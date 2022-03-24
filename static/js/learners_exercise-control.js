var id_executed = "exercise_executed";
var id_completed = "exercise_completed";

/*
The following short functions 'showLoading', 'showSuccess', 'showError' serve 
to give the user a visual feedback on the exercise progress. Basically they 
toggle the corresponding classes.

params:
    id: the respective id of the element to change
    delay: option to delay the effect
*/

function showLoading(id) {
  // switch indicator to loading
  $(id)
    .stop(true, true)
    .removeClass("failed")
    .removeClass("success")
    .addClass("loading")
    .show();
}

function showSuccess(id, delay = 200) {
  // switch indicator to check
  $(id)
    .stop(true, true)
    .delay(delay)
    .queue(function (next) {
      $(this)
        .removeClass("loading")
        .removeClass("failed")
        .addClass("success")
        .show();
      next();
    });
}

function showError(id, delay = 200) {
  // switch indicator to fail
  $(id)
    .stop(true, true)
    .delay(delay)
    .queue(function (next) {
      $(this)
        .removeClass("loading")
        .removeClass("success")
        .addClass("failed")
        .show();
      next();
    });
}

function visualFeedback(
  parentID = "",
  data = "",
  disable_on_success = false,
  msg = {
    executed: "Successfully executed.",
    execution_failed: "Connection failed.",
    completed: "Exercise completed",
    completion_failed: "Exercise not completed.",
  }
) {
  var id_executed = `#${parentID} #exercise_executed`;
  var id_completed = `#${parentID} #exercise_completed`;
  var error_container = $(`#${parentID} #error-msg`);
  var success_container = $(`#${parentID} #success-msg`);
  var submit_btn = $(`#${parentID} #submitExercise`);

  if (data == "" || data == undefined) {
    showError(id_executed);
    showError(id_completed);
    $(parentID + " #error-msg").html("Server error.");
    return false;
  }

  // display execution state
  if (data.executed != undefined) {
    if (data.executed) {
      showSuccess(id_executed);
      error_container.html("");
      success_container.html("");
    } else {
      showError(id_executed);
      showError(id_completed);
      submit_btn.prop("disabled", false);
      success_container.html("");
      if (data.msg) {
        error_container.html(data.msg);
      } else {
        error_container.html(msg.execution_failed);
      }
      return false;
    }
  }

  // display completion state
  if (data.completed != undefined) {
    if (data.completed) {
      showSuccess(id_completed);
      error_container.html("");
      success_container.html(msg.completed);
      if (!disable_on_success) submit_btn.prop("disabled", false);
      return true;
    } else {
      showError(id_completed);
      success_container.html("");
      if (data.msg) {
        error_container.html(data.msg);
      } else {
        error_container.html(msg.completion_failed);
      }
      submit_btn.prop("disabled", false);
      return false;
    }
  } else {
    submit_btn.prop("disabled", false);
  }

  if (data.never_executed) {
    showError(id_executed);
    showError(id_completed);
    success_container.html("");
    error_container.html("No exercises executed.");
    return false;
  }
}

/*
This function serves as a generic ajax-request function that returns a promise.

params:
    type: "GET", "POST"
    payload: A dict comprising the URL and optional 'additional_headers' and 'data'
*/

function sendAjax(type, payload, token) {
  let promise = new Promise((resolve, reject) => {
    $.ajax({
      type: type,
      url: payload.url,
      crossDomain: true,
      headers: Object.assign(
        {},
        { Authorization: `Bearer ${token}` },
        payload.additional_headers
      ),
      data: payload.data,

      // execute if the request was successful
      success: function (data) {
        resolve(data);
      },

      // execute if request failed
      error: function (jqXHR, textStatus, errorThrown) {
        reject(jqXHR, textStatus, errorThrown);
      },
    });
  });

  return promise;
}

/*
This function queries 'Learners' for the current status of the corresponding 
exercise. The exercise must be passed as URL (in default case as URL of 
learners + "/check_completion/" + uuid of the execute-request).

params:
    url: Learners Endpoint 
    token: JWT Token
    history: Whether or not to display the execution history (default = true)
*/

function getExecutionHistory(parentID, url, token) {
  var defer = $.Deferred();

  var id_executed = `#${parentID} #exercise_executed`;
  var id_completed = `#${parentID} #exercise_completed`;

  showLoading(id_executed);
  showLoading(id_completed);

  sendAjax("GET", (payload = { url: url }), token)
    .then(function (data, textStatus, jqXHR) {
      visualFeedback(parentID, data);
      printHistory(parentID, data.history);
      defer.resolve(data);
    })
    .catch(function (jqXHR, textStatus, errorThrown) {
      visualFeedback(parentID, jqXHR);
      defer.reject(jqXHR, textStatus, errorThrown);
    });

  return defer.promise();
}

/*
This function is responsible for constructing the execution history in the DOM.

params:
    history: A json-object comprising: 'start_time', 'response_time', 'completed'
*/

function printHistory(parentID, history) {
  var history_container = $(`#${parentID} #history`);

  if (history) {
    // starting block of html (table header)
    var tbl_body = `
            <table id='history-table'>
                <tr> 
                    <th>Exercise started</th> 
                    <th>Response received</th> 
                    <th>Completed</th> 
                </tr>
            `;

    // construct each row
    $.each(history, function () {
      var tbl_row = "";

      // construct each column per row
      $.each(this, function (key, value) {
        if (key == "completed") {
          if (Boolean(value)) {
            value = `<span class='success'>succeded</span>`;
          } else {
            value = `<span class='failed'>failed</span>`;
          }
        }
        if (value == null) {
          value = "no response";
        }
        tbl_row = `<td> ${value} </td> ${tbl_row}`;
      });

      // append row to body
      tbl_body += `<tr> ${tbl_row} </tr>`;
    });

    tbl_body += "</table>";

    // create DOM
    history_container.html(tbl_body);

    // Slide down effect
    if (history_container.find("tr").length > 2) {
      history_container.find("tr")
        .eq(1)
        .find("td")
        .wrapInner('<div style="display: none;" />')
        .parent()
        .find("td > div")
        .slideDown(700, function () {
          var $set = $(this);
          $set.replaceWith($set.contents());
        });
      history_container.slideDown();
    } else {
      history_container.slideDown();
    }
  }
}

// execute when button is clicked
function executeAndCheck(
  id,
  type,
  token,
  url_execute,
  url_check,
  payload_data,
  additional_headers,
  disable_on_success = true
) {
  var defer = $.Deferred();

  var id_executed = `#${id} #exercise_executed`;
  var id_completed = `#${id} #exercise_completed`;
  var submit_btn = $(`#${id} #submitExercise`);

  // prevent multiple executions
  submit_btn.prop("disabled", true);

  showLoading(id_executed);
  showLoading(id_completed);

  sendAjax(
    "POST",
    (payload = {
      url: url_execute,
      data: payload_data,
      additional_headers: additional_headers,
    }),
    token
  )
    .then(function (data, textStatus, jqXHR) {
      url_check += data.uuid || "";
      visualFeedback(id, data, disable_on_success);
      printHistory(id, data.history);

      sendAjax(
        "GET",
        (payload = {
          url: url_check,
        }),
        token
      )
        .then(function (data, textStatus, jqXHR) {
          visualFeedback(id, data, disable_on_success);
          printHistory(id, data.history);
          defer.resolve(data);
        })
        .catch(function (jqXHR, textStatus, errorThrown) {
          visualFeedback(id, jqXHR, disable_on_success);
          defer.reject(jqXHR, textStatus, errorThrown);
        });

      defer.resolve(data);
    })
    .catch(function (jqXHR, textStatus, errorThrown) {
      visualFeedback(id, jqXHR, disable_on_success);
      defer.reject(jqXHR, textStatus, errorThrown);
    });

  return defer.promise();
}
