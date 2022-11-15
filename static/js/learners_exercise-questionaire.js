function questionaire(exercise) {
  $(`#${exercise.global_questionaire_id}`).submit(function (event) {
    var data = new FormData(this);
    submitQuestionaire(exercise, data);
    event.preventDefault();
  });

  loadQuestionaire();
  persistQuestionaire();

}

// ------------------------------------------------------------------------------------------------------------

function submitQuestionaire(exercise, data) {
  var defer = $.Deferred();
  var disable_on_success = false;

  showLoading(`#${exercise.global_questionaire_id} #exercise_executed`);
  $(`#${exercise.global_questionaire_id} #submitExercise`).prop(
    "disabled",
    true
  );
  $(`#${exercise.global_questionaire_id} #error-msg`).html("");
  $(`#${exercise.global_questionaire_id} #success-msg`).html("");
  $(`#${exercise.global_questionaire_id} #notification-msg`).html("");

  var json_data = {};
  data.forEach(function (value, key) {
    json_data[key] = value;
  });

  sendAjax("POST", {
    url: `/questionaire/${exercise.global_questionaire_id}`,
    data: JSON.stringify(json_data),
  })
    .then(function (data, textStatus, jqXHR) {
      showExecutionState(exercise.global_questionaire_id, data);
      showMsg(exercise.global_questionaire_id, data)
      defer.resolve(data);
    })
    .catch(function (jqXHR, textStatus, errorThrown) {
      $(`#${exercise.global_questionaire_id} #submitQuestionaire`).prop(
        "disabled",
        false
      );
      visualFeedback(exercise.global_questionaire_id, "", disable_on_success);
      defer.reject(jqXHR, textStatus, errorThrown);
    });

  return defer.promise();
}

function persistQuestionaire() {
  $(document).on("change", ".input", function () {
    $("input[type=radio]").each(function () {
      localStorage.setItem(
        "radio_" + $(this).attr("id"),
        JSON.stringify({ checked: this.checked })
      );
    });
  });
}

function loadQuestionaire() {
  $("input[type=radio]").each(function () {
    var state = JSON.parse(localStorage.getItem("radio_" + $(this).attr("id")));
    if (state) this.checked = state.checked;
  });
}
