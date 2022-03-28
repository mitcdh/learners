function scriptExercise(exercise) {

  getExecutionHistory(exercise);

  $(`#${exercise.id} .btn-run-exercise`).click(function () {
    executeAndCheck(exercise)
  });
};
