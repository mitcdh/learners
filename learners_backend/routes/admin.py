import json

from flask import Blueprint, jsonify, render_template, request
from collections import defaultdict
from learners_backend.conf.config import cfg
from learners_backend.functions.database import (
    get_all_exercises,
    get_all_exercises_sorted,
    get_all_questionaires_sorted,
    get_all_usergroups,
    get_all_users,
    get_completed_state,
    get_executions_by_user_exercise,
    get_user_by_id,
    get_completion_percentage,
    get_questionaire_completion_percentage,
    get_exercise_by_global_exercise_id,
    get_results_of_single_exercise,
    get_questionaire_by_global_questionaire_id,
    get_all_questionaires_questions,
    get_question_counts,
    get_usergroup_by_name,
)
from learners_backend.functions.helpers import extract_history, replace_attachhment_with_url, build_urls
from learners_backend.functions.results import construct_results_table
from flask_jwt_extended import get_jwt_identity, jwt_required, get_jwt
from learners_backend.jwt_manager import admin_required
from learners_backend.logger import logger
from learners_backend.conf.config import cfg

admin_api = Blueprint("admin_api", __name__)


@admin_api.route("/admin", methods=["GET"])
@admin_required()
def admin_area():

    exercises = get_all_exercises_sorted()
    users = get_all_users()

    user_filter = [{"id": 0, "username": "all"}]
    user_filter.extend({"id": user.id, "username": user.name} for user in users)

    exercises_filter = [{"id": "all", "name": "all"}]
    exercises_filter.extend({"id": exercise.exercise_name, "name": exercise.page_title} for exercise in exercises)

    results_table = construct_results_table(exercises, users)

    cfg.template = build_urls(config=cfg, role=get_jwt().get("role"), user_id=get_jwt_identity())
    return render_template("results_table.html", exercises=exercises_filter, users=user_filter, table=results_table, **cfg.template)


@admin_api.route("/result/all", methods=["GET"])
@admin_required()
def get_all_results():

    grouped_exercises = {}
    sorted_exercises = get_all_exercises_sorted()

    for exercise in sorted_exercises:
        setattr(exercise, "completion_percentage", get_completion_percentage(exercise.id))
        if not grouped_exercises.get(exercise.parent_page_title):
            grouped_exercises[exercise.parent_page_title] = {exercise.page_title: [exercise]}
        elif grouped_exercises[exercise.parent_page_title].get(exercise.page_title):
            grouped_exercises[exercise.parent_page_title][exercise.page_title].append(exercise)

        else:
            grouped_exercises[exercise.parent_page_title][exercise.page_title] = [exercise]

    results_table = construct_results_table(sorted_exercises, get_all_users())

    cfg.template = build_urls(config=cfg, role=get_jwt().get("role"), user_id=get_jwt_identity())
    return render_template("results_overview.html", exercises=grouped_exercises, results_table=results_table, **cfg.template)


@admin_api.route("/result/<global_exercise_id>", methods=["GET"])
@admin_required()
def get_single_result(global_exercise_id):

    exercise = get_exercise_by_global_exercise_id(global_exercise_id)
    setattr(exercise, "completion_percentage", get_completion_percentage(exercise.id))

    results = get_results_of_single_exercise(global_exercise_id)

    cfg.template = build_urls(config=cfg, role=get_jwt().get("role"), user_id=get_jwt_identity())
    return render_template("results_single.html", exercise=exercise, results=results, **cfg.template)


@admin_api.route("/result/<user_id>/<global_exercise_id>", methods=["GET"])
@admin_required()
def get_exercise_result(user_id, global_exercise_id):

    exercise = get_exercise_by_global_exercise_id(global_exercise_id)
    user = get_user_by_id(user_id)
    executions = get_executions_by_user_exercise(user_id, exercise.id)

    last_execution = executions[0] if executions else None
    data = {
        "completed": any(execution.completed for execution in executions) if last_execution else False,
        "executed": any(not execution.connection_failed for execution in executions) if last_execution else False,
        "msg": last_execution.msg if last_execution else None,
        "response_timestamp": last_execution.response_timestamp if last_execution else None,
        "connection": any(not execution.connection_failed for execution in executions) if last_execution else False,
    }

    if exercise.exercise_type == "form":
        data["form"] = json.loads(last_execution.form_data) if last_execution else None
        data["form"] = replace_attachhment_with_url(data["form"])

    data["history"] = extract_history(executions) if executions else None

    cfg.template = build_urls(config=cfg, role=get_jwt().get("role"), user_id=get_jwt_identity())
    return render_template("results_execution_details.html", user=user.name, exercise=exercise.exercise_name, data=data, **cfg.template)


@admin_api.route("/questionaire/all", methods=["GET"])
@admin_required()
def get_all_questionaires():

    grouped_questionaires = {}
    sorted_questionaires = get_all_questionaires_sorted()

    for questionaire in sorted_questionaires:
        setattr(questionaire, "completion_percentage", get_questionaire_completion_percentage(questionaire.global_questionaire_id))

        if not grouped_questionaires.get(questionaire.parent_page_title):
            grouped_questionaires[questionaire.parent_page_title] = [questionaire]
        else:
            grouped_questionaires[questionaire.parent_page_title].append(questionaire)

    cfg.template = build_urls(config=cfg, role=get_jwt().get("role"), user_id=get_jwt_identity())
    return render_template("questionaires_overview.html", questionaires=grouped_questionaires, **cfg.template)


@admin_api.route("/questionaire/<global_questionaire_id>", methods=["GET"])
@admin_required()
def get_single_questionaire(global_questionaire_id):

    # questionaire = get_exercise_by_global_exercise_id(global_questionaire_id)
    questionaire = get_questionaire_by_global_questionaire_id(global_questionaire_id)
    setattr(questionaire, "completion_percentage", get_questionaire_completion_percentage(questionaire.global_questionaire_id))
    questions = get_all_questionaires_questions(global_questionaire_id)

    for question in questions:
        labels, counts = get_question_counts(question.global_question_id)
        setattr(question, "labels", labels)
        setattr(question, "counts", counts)

    cfg.template = build_urls(config=cfg, role=get_jwt().get("role"), user_id=get_jwt_identity())
    return render_template("questionaires_single.html", questionaire=questionaire, questions=questions, **cfg.template)


@admin_api.route("/admin/notifications", methods=["GET"])
@admin_required()
def admin_notifications():

    db_userlist = get_all_users()
    userlist = []

    for user in db_userlist:
        userlist.append({"user_id": user.id, "username": user.name})

    usergroups = get_all_usergroups()

    return render_template("admin_notification.html", userlist=userlist, usergroups=usergroups, **cfg.template)


# @admin_api.route("/submissions", methods=["GET"])
# @admin_required()
# def get_all_submissions():

#     grouped_exercises = {}
#     sorted_exercises = get_all_exercises_sorted()

#     for exercise in sorted_exercises:

#         # Convert SQLalchemy object to dict
#         exercise = exercise.__dict__
#         # Remove '_sa_instance_state' from dict
#         exercise.pop("_sa_instance_state")
#         # Calculate and add 'completion_percentage'
#         exercise["completion_percentage"] = get_completion_percentage(exercise.get("id"))

#         page_title = exercise.get("page_title")
#         parent_title = exercise.get("parent_page_title")

#         # if parent title doesn't exist in dict, create key and add the exercise to its list
#         if not grouped_exercises.get(parent_title):
#             grouped_exercises[parent_title] = {page_title: [exercise]}
#         # if parent title already exists, add exercise to respective key
#         elif grouped_exercises[parent_title].get(page_title):
#             grouped_exercises[parent_title][page_title].append(exercise)
#         # if parent title but no page title exists, add page title and exercise to it
#         else:
#             grouped_exercises[parent_title][page_title] = [exercise]

#     table_data = construct_results_table(sorted_exercises, get_all_users())

#     return jsonify(exercises=grouped_exercises, tabledata=table_data)


@admin_api.route("/submissions", methods=["GET"])
@admin_required()
def get_all_submissions():

    users = get_all_users()
    exercises = get_all_exercises()

    submissions = []

    for user in users:
        executions = {"user_id": user.id, "username": user.name}
        for exercise in exercises:
            completed_state = [state[0] for state in get_completed_state(user.id, exercise.id)]
            executions[exercise.global_exercise_id] = int(any(completed_state)) if completed_state else -1
        submissions.append(executions)

    return jsonify(submissions=submissions)


@admin_api.route("/exercises", methods=["GET"])
@admin_required()
def get_exercises():

    exercises = []
    sorted_exercises = get_all_exercises_sorted()

    for exercise in sorted_exercises:

        # Convert SQLalchemy object to dict
        exercise = exercise.__dict__
        # Remove '_sa_instance_state' from dict
        exercise.pop("_sa_instance_state")
        # Calculate and add 'completion_percentage'
        exercise["completion_percentage"] = get_completion_percentage(exercise.get("id"))

        exercises.append(exercise)

        # page_title = exercise.get("page_title")
        # parent_title = exercise.get("parent_page_title")

        # # if parent title doesn't exist in dict, create key and add the exercise to its list
        # if not exercises.get(parent_title):
        #     exercises[parent_title] = {page_title: [exercise]}
        # # if parent title already exists, add exercise to respective key
        # elif exercises[parent_title].get(page_title):
        #     exercises[parent_title][page_title].append(exercise)
        # # if parent title but no page title exists, add page title and exercise to it
        # else:
        #     exercises[parent_title][page_title] = [exercise]

    return jsonify(exercises=exercises)

    # users = get_all_users()
    # exercises = get_all_exercises()

    # submissions = []

    # for user in users:
    #     executions = {"user_id": user.id, "username": user.name}
    #     for exercise in exercises:
    #         completed_state = [state[0] for state in get_completed_state(user.id, exercise.id)]
    #         executions[exercise.global_exercise_id] = int(any(completed_state)) if completed_state else -1
    #     submissions.append(executions)

    # return jsonify(submissions=submissions)

    # try:
    #     rows = []
    #     for user in get_all_users():
    #         row = {"user_id": user.id, "username": user.name}
    #         for exercise in exercises:
    #             completed_state = [state[0] for state in get_completed_state(user.id, exercise.id)]
    #             row[exercise.global_exercise_id] = int(any(completed_state)) if completed_state else -1
    #         rows.append(row)

    #     cols = [{"id": "username", "name": "user"}]
    #     cols.extend({"id": exercise.global_exercise_id, "name": exercise.exercise_name} for exercise in exercises)

    #     return {"cols": cols, "rows": rows}

    # except Exception as e:
    #     logger.exception(e)
    #     return None

    # grouped_exercises = {}
    # sorted_exercises = get_all_exercises_sorted()

    # for exercise in sorted_exercises:

    #     # Convert SQLalchemy object to dict
    #     exercise = exercise.__dict__
    #     # Remove '_sa_instance_state' from dict
    #     exercise.pop("_sa_instance_state")
    #     # Calculate and add 'completion_percentage'
    #     exercise["completion_percentage"] = get_completion_percentage(exercise.get("id"))

    #     page_title = exercise.get("page_title")
    #     parent_title = exercise.get("parent_page_title")

    #     # if parent title doesn't exist in dict, create key and add the exercise to its list
    #     if not grouped_exercises.get(parent_title):
    #         grouped_exercises[parent_title] = {page_title: [exercise]}
    #     # if parent title already exists, add exercise to respective key
    #     elif grouped_exercises[parent_title].get(page_title):
    #         grouped_exercises[parent_title][page_title].append(exercise)
    #     # if parent title but no page title exists, add page title and exercise to it
    #     else:
    #         grouped_exercises[parent_title][page_title] = [exercise]

    # table_data = construct_results_table(sorted_exercises, get_all_users())

    # return jsonify(exercises=grouped_exercises, tabledata=table_data)
