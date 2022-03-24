function scriptExercise(exercise) {

  getExecutionHistory(
    (parentID = exercise.id),
    (url = `/history/${exercise.script}`),
    (token = getCookie("auth"))
  );

  // Run exercises
  $(`#${exercise.id} .btn-run-exercise`).click(function () {
    executeAndCheck(
      (id = exercise.id),
      (type = "script"),
      (token = getCookie("auth")),
      (url_execute = `/execute/${exercise.script}`),
      (url_check = `/monitor/`)
    );
  });
};
