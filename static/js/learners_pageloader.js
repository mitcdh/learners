let sse;
let exercises = [];

$(function () {
  const stream_endpoint = `${window.location.origin}/stream`;
  console.log(stream_endpoint);

  console.log("open sse connection");
  sse = establishSSEConnection(stream_endpoint);

  $(window).on("beforeunload", function () {
    console.log("close sse connection");
    closeSSEConnection(sse);
  });

  updateProgress();

  $(".exercise-info[name=info]").each(function () {
    exercises.push(JSON.parse($(this).attr("value")));
  });

  $.each(exercises, function (i, exercise) {
    switch (exercise.exercise_type) {
      case "form":
        formExercise(exercise);
        break;
      case "script":
        scriptExercise(exercise);
        break;
      case "questionaire":
        questionaire(exercise);
        break;
    }
  });

  let active_menuItem = $(".topics .active");

  if (active_menuItem.length > 0) {
    $(".topics").animate(
      { scrollTop: $(".topics .active").offset().top },
      "slow"
    );
  }
  $(".inactive_menu_link").click(function (event) {
    // If not in dev environment ignore the click event
    if ($(this).attr("devstage") != "true") 
        event.preventDefault();
  });

  init_comment_forms();

});
