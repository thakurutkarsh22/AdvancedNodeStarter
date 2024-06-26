import React, { Component } from "react";
import { connect } from "react-redux";
import { fetchBlog } from "../../actions";

class BlogShow extends Component {
  renderImage() {
    const { imageUrl } = this.props.blog;
    if (imageUrl) {
      return (
        <img
          src={
            "https://nodeadvanceproject.s3.ap-south-1.amazonaws.com/" + imageUrl
          }
        />
      );
    }
  }

  componentDidMount() {
    this.props.fetchBlog(this.props.match.params._id);
  }

  render() {
    if (!this.props.blog) {
      return "";
    }

    const { title, content } = this.props.blog;

    return (
      <div>
        <h3>{title}</h3>
        <p>{content}</p>
        {this.renderImage()}
      </div>
    );
  }
}

function mapStateToProps({ blogs }, ownProps) {
  return { blog: blogs[ownProps.match.params._id] };
}

export default connect(mapStateToProps, { fetchBlog })(BlogShow);
