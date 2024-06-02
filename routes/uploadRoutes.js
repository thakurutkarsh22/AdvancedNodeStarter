const AWS = require("aws-sdk");
const keys = require("../config/keys");
const uuid = require("uuid/v1");
const requireLogin = require("../middlewares/requireLogin");

const s3 = new AWS.S3({
  accessKeyId: keys.accessKeyId,
  secretAccessKey: keys.secretAccessKey,
  signatureVersion: "v4",
  region: "ap-south-1",
});

module.exports = (app) => {
  app.get("/api/upload", requireLogin, (req, res) => {
    const userId = req.user.id;
    const uuidId = uuid();
    const key = `${userId}/${uuidId}.jpeg`;
    // Check doc for this
    s3.getSignedUrl(
      "putObject",
      {
        Bucket: "nodeadvanceproject",
        ContentType: "image/jpeg",
        Key: key,
      },
      (error, url) => {
        res.send({ key, url });
      }
    );
  });
};
