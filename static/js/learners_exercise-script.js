function scriptExercise(exercise) {
  $(`#${exercise.global_exercise_id} .btn-script-trigger`).click(function () {
    executeScript(this, exercise.global_exercise_id);
  });

  getExecutionHistory(exercise.global_exercise_id);
}

function executeScript(button, global_exercise_id) {
  // Get the DOM elements for status display
  const stat_indicator = $(button).parent().find(".stat_indicator")[0];
  const stat_message = $(button).parent().find(".stat_message")[0];

  sendAjax("POST", { url: `/submissions/script/${global_exercise_id}` })
    .then(function (data, textStatus, jqXHR) {
      waitForExecutionResponse(
        data,
        stat_indicator,
        stat_message,
        button,
        global_exercise_id
      );
    })
    .catch(function (xhr, status, error) {
      displayError(stat_indicator, stat_message, "Error: failed to execute");
    });
}

// helper functions
function waitForExecutionResponse(
  data,
  stat_indicator,
  stat_message,
  button,
  global_exercise_id
) {
  const defer = $.Deferred();

  // deactivate button and show loading
  $(button).prop("disabled", true);
  displayLoading(stat_indicator, stat_message);

  sendAjax("GET", { url: `/executions/state/${data.uuid}` })
    .then(function (data, textStatus, jqXHR) {
      if (data) {
        if (!data.executed)
          displayError(
            stat_indicator,
            stat_message,
            data.status_msg || "Error: execution failed"
          );
        else if (data.partial)
          displayPartialSuccess(
            stat_indicator,
            stat_message,
            data.status_msg || ""
          );
        else if (data.completed == 0)
          displayPartialSuccess(
            stat_indicator,
            stat_message,
            data.status_msg || "not completed"
          );
        else if (data.completed == 1)
          displaySuccess(
            stat_indicator,
            stat_message,
            data.status_msg || "completed"
          );
        else
          displaySuccess(
            stat_indicator,
            stat_message,
            data.status_msg || "executed"
          );

        printScriptResponse(button, data.script_response);

        updateExecutionHistory(global_exercise_id);
      } else {
        hideLoading(stat_indicator, stat_message);
      }
      defer.resolve(data);
    })
    .catch(function (jqXHR, textStatus, errorThrown) {
      console.error(jqXHR, textStatus, errorThrown);
      setTimeout(function () {
        displayError(stat_indicator, stat_message, "failed to execute");
      }, 500);
      defer.reject(jqXHR, textStatus, errorThrown);
    })
    .finally(() => {
      $(button).prop("disabled", false);
    });
}

const printScriptResponse = (button, script_response) => {
  const script_response_container = $(button)
    .parent()
    .find(".script_response")
    .first();

  script_response_container.slideUp(function () {
    if (script_response) {
      script_response_container.text(script_response);
      script_response_container.slideDown();
    }
  });
};

const displayLoading = (stat_indicator, stat_message) => {
  $(stat_indicator)
    .stop(true, true)
    .removeClass("failed success none partial")
    .addClass("loading")
    .show();
  $(stat_message).removeClass().addClass("stat_message");
  $(stat_message)
    .hide(100)
    .html("running ...")
    .animate({ width: "toggle" }, 300);
};

const hideLoading = (stat_indicator, stat_message) => {
  $(stat_indicator)
    .stop(true, true)
    .removeClass("failed success none partial loading")
    .show();
  $(stat_message).removeClass().addClass("stat_message");
  $(stat_message).hide(100).html("").animate({ width: "toggle" }, 300);
};

const displaySuccess = (stat_indicator, stat_message, success_msg) => {
  $(stat_indicator)
    .stop(true, true)
    .delay(200)
    .queue(function (next) {
      $(this)
        .removeClass("loading failed none partial")
        .addClass("success")
        .show();
      next();
    });
  $(stat_message).removeClass().addClass("stat_message success");
  $(stat_message).hide(200).html(success_msg).animate({ width: "toggle" }, 300);
};

const displayError = (stat_indicator, stat_message, error_msg) => {
  $(stat_indicator)
    .stop(true, true)
    .delay(200)
    .queue(function (next) {
      $(this)
        .removeClass("loading success none partial")
        .addClass("failed")
        .show();
      next();
    });
  $(stat_message).removeClass().addClass("stat_message error");
  $(stat_message).hide(200).html(error_msg).animate({ width: "toggle" }, 300);
};

const displayPartialSuccess = (stat_indicator, stat_message, msg) => {
  $(stat_indicator)
    .stop(true, true)
    .delay(200)
    .queue(function (next) {
      $(this)
        .removeClass("loading success none failed")
        .addClass("partial")
        .show();
      next();
    });
  $(stat_message).removeClass().addClass("stat_message partial");
  $(stat_message).hide(200).html(msg).animate({ width: "toggle" }, 300);
};
