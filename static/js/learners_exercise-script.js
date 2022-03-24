function scriptExercise(exercise) {
  
    getExecutionHistory(
      (parentID = exercise.id),
      (url = `${learners_url}/history/${exercise.script}`),
      (token = getCookie("auth"))
    );

    // Run exercises
    $(`#${exercise.id} .btn-run-exercise`).click(function () {
      executeAndCheck(
        (id = exercise.id),
        (type = "script"),
        (token = getCookie("auth")),
        (url_execute = `${learners_url}/execute/${exercise.script}`),
        (url_check = `${learners_url}/monitor/`)
      );
    });
};
