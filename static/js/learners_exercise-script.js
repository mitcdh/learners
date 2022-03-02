$(function () {
  let script_name = $(".btn-run-exercise").first().attr("value");
  let url_history = learners_url + "/history/" + script_name;
  let url_execute = learners_url + "/execute/" + script_name;

  getExecutionHistory((url = url_history), (token = getCookie("auth")));

  let url_check = learners_url + "/monitor/";

  // Run exercises
  $(".btn-run-exercise").click(function () {
    executeAndCheck(
      (type = "script"),
      (token = getCookie("auth")),
      (url_execute = url_execute),
      (url_check = url_check)
    );
  });
});
