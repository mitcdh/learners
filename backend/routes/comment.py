from backend.classes.SSE_element import SSE_element
from backend.functions.helpers import convert_to_dict, sse_create_and_publish
from flask import Blueprint, jsonify, make_response, render_template, request
from flask_jwt_extended import jwt_required, current_user
from backend.functions.database import (
    db_create_comment,
    db_create_notification,
    get_all_comments,
    get_comment_by_id,
    get_comments_by_userid,
    get_user_by_id,
    get_users_by_role,
)

from backend.conf.config import cfg
from backend.jwt_manager import admin_required, jwt_required_any_location
from backend.classes.sse import sse


comment_api = Blueprint("comment_api", __name__)


# Post new comment
@comment_api.route("/comments", methods=["POST"])
@jwt_required()
def run_execution():

    data = request.get_json()
    comment = data.get("comment")
    page = data.get("page")

    if db_create_comment(comment=comment, page=page, user_id=current_user.id):
        sse_create_and_publish(event="newComment", user=current_user, page=page)
        return jsonify(success=True), 200

    return jsonify(success=False), 500


# Get all comments, grouped by the page titles
@comment_api.route("/comments", methods=["GET"])
@admin_required()
def getComments():

    comments = {}
    for comment in get_all_comments():
        # Initiate dict key with empty list if not present
        comments.setdefault(comment.page, [])
        # Append comment object
        comments[comment.page].append(
            # Create comment object
            {"user": get_user_by_id(comment.user_id).name, "comment": comment.comment}
        )

    return jsonify(comments=comments), 200


# Get specific comment based on comment ID
@comment_api.route("/comments/<comment_id>", methods=["GET"])
@admin_required()
def getCommentById(comment_id):

    comment = get_comment_by_id(comment_id).__dict__
    comment.pop("_sa_instance_state")

    return jsonify(comment=comment), 200


# Get all user comments based on the user ID
@comment_api.route("/comments/user/<user_id>", methods=["GET"])
@admin_required()
def getUserComments(user_id):

    comments = convert_to_dict(get_comments_by_userid(user_id))

    return jsonify(comments=comments), 200
