const mongoose = require("mongoose");
const redis = require("redis");
const util = require("node:util");

const redisUrl = "redis://127.0.0.1:6379";
const client = redis.createClient(redisUrl);
client.get = util.promisify(client.get);
client.hget = util.promisify(client.hget);

const exec = mongoose.Query.prototype.exec;

// throuth this we are making sure every query on mongoose that is going to mongo
//  we are going to intercept that and check our things what we want.

// THIS IS MONKEY PATCHING.

mongoose.Query.prototype.cache = function (optins = {}) {
  // if in our query we can do
  // await blogRoutes.find().cache()
  this.useCache = true;
  this.hashKey = JSON.stringify(optins.key || "");

  // but we want to do more
  // await blogRoutes.find().cache().limit(10).sort()
  return this;
};

mongoose.Query.prototype.exec = async function () {
  console.log(this.useCache, "this cache");
  if (!this.useCache) {
    return exec.apply(this, arguments);
  }

  const query = this.getQuery();
  const collectionName = this.mongooseCollection.name;
  const key = JSON.stringify(
    Object.assign({}, query, { collection: collectionName })
  );

  // see if we have value or the key in redis
  // const cacheValue = await client.get(key);
  const cacheValue = await client.hget(this.hashKey, key);

  // if yes then return
  if (cacheValue) {
    console.log("redis hit");

    // THIS WILL NOT WORK WHY bec mongoose expects exec function to return a  mongoose document.
    // return JSON.parse(cacheValue);

    // so we have to convert JSON.parse(cacheValue) into model instance of mongoose
    // const doc = new this.model(JSON.parse(cacheValue));
    // return doc;

    // Still this will not work as such bec model needs to return a single object or an Array of object

    const doc = JSON.parse(cacheValue);

    return Array.isArray(doc)
      ? doc.map((d) => new this.model(d))
      : new this.model(doc);
  }

  // if no call the DB

  const result = await exec.apply(this, arguments);

  // result here is actually a mongoose document instance

  // client.set(key, JSON.stringify(result), "EX", 10);
  client.hset(this.hashKey, key, JSON.stringify(result), "EX", 100000);

  return result;
};

// NOW WE NEED TO create to delete the entire data for a perticular hash.

module.exports = {
  clearHash(hashKey) {
    client.del(JSON.stringify(hashKey));
  },
};
