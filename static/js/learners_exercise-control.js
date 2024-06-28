const short_msgs = {
  executed: 'submitted',
  completed: 'exercise completed',
  partial: 'partially completed',
  completion_failed: 'exercise not completed',
  never_executed: 'not executed',
  server_error: 'server error',
  data_fail: 'error in data format',
  history_completed: 'succeeded',
  history_partial: 'partially succeeded',
  history_fail: 'failed',
};

function showLoading(id) {
  $(id)
    .stop(true, true)
    .removeClass('failed')
    .removeClass('success')
    .removeClass('none')
    .removeClass('partial')
    .addClass('loading')
    .show();
}

function showSuccess(id, delay = 200) {
  $(id)
    .stop(true, true)
    .delay(delay)
    .queue(function (next) {
      $(this)
        .removeClass('loading')
        .removeClass('failed')
        .removeClass('none')
        .removeClass('partial')
        .addClass('success')
        .show();
      next();
    });
  celebrate();
}

function showPartialSuccess(id, delay = 200) {
  $(id)
    .stop(true, true)
    .delay(delay)
    .queue(function (next) {
      $(this)
        .removeClass('loading')
        .removeClass('failed')
        .removeClass('none')
        .removeClass('success')
        .addClass('partial')
        .show();
      next();
    });
}

function showError(id, delay = 200) {
  $(id)
    .stop(true, true)
    .delay(delay)
    .queue(function (next) {
      $(this)
        .removeClass('loading')
        .removeClass('success')
        .removeClass('none')
        .removeClass('partial')
        .addClass('failed')
        .show();
      next();
    });
}

function showNone(id, delay = 200) {
  $(id)
    .stop(true, true)
    .delay(delay)
    .queue(function (next) {
      $(this)
        .removeClass('loading')
        .removeClass('success')
        .removeClass('failed')
        .removeClass('partial')
        .addClass('none')
        .show();
      next();
    });
}

function visualFeedback(parentID = '', data = '', disable_on_success = false) {
  if (data == '' || data == undefined) {
    showError(`#${parentID} #exercise_executed`);
    showError(`#${parentID} #exercise_completed`);
    $(`#${parentID} #msg`)
      .hide(300)
      .html(short_msgs.server_error)
      .animate({ width: 'toggle' }, 300);
    return false;
  } else if (!data.history) {
    showNoExecution(parentID);
    return false;
  } else {
    showMsg(parentID, data);
    showExecutionState(parentID, data);
    return true;
  }
}

function showNoExecution(parentID) {
  showNone(`#${parentID} #exercise_executed`);
  showNone(`#${parentID} #exercise_completed`);
  var msg_container = $(`#${parentID} #msg-container #msg`);
  msg_container.removeClass('success error partial');
  msg_container
    .hide(300)
    .html(short_msgs.never_executed)
    .animate({ width: 'toggle' }, 300);
}

function showMsg(parentID, data) {
  const msg_detail = $(`#${parentID} #msg-detail`).not('.upload-msg');
  msg_detail.removeClass('success error partial');
  if (data.partial) msg_detail.addClass('partial');
  else if (!data.completed || data.never_executed || !data.executed)
    msg_detail.addClass('error');
  else msg_detail.addClass('success');

  if (data.status_msg) {
    msg_detail.html(data.status_msg);
    msg_detail.slideDown();
  } else {
    msg_detail.html('');
  }
}

function showExecutionState(parentID, data) {
  var id_executed = `#${parentID} #exercise_executed`;
  var id_completed = `#${parentID} #exercise_completed`;
  var msg_container = $(`#${parentID} #msg-container #msg`);
  var submit_btn = $(`#${parentID} #submitExercise`);

  msg_container.removeClass('success error partial');

  if (data.executed != undefined) {
    if (data.executed || data.partial) {
      showSuccess(id_executed);
      msg_container.addClass('success');
      msg_container
        .hide(300)
        .html(short_msgs.executed)
        .animate({ width: 'toggle' }, 300);
      return true;
    } else {
      showError(id_executed);
      showError(id_completed);
      msg_container.addClass('error');
      msg_container
        .hide(300)
        .html(short_msgs.execution_failed)
        .animate({ width: 'toggle' }, 300);
      submit_btn.prop('disabled', false);
      return false;
    }
  } else {
    msg_container.addClass('error');
    msg_container
      .hide(300)
      .html(short_msgs.server_error)
      .animate({ width: 'toggle' }, 300);
    return false;
  }
}

function showCompletionState(parentID, data, disable_on_success) {
  var id_completed = `#${parentID} #exercise_completed`;
  var msg_container = $(`#${parentID} #msg-container #msg`);
  var submit_btn = $(`#${parentID} #submitExercise`);

  msg_container.removeClass('success error partial');

  if (data.completed != undefined) {
    if (data.partial) {
      showPartialSuccess(id_completed);
      msg_container.addClass('partial');
      msg_container
        .hide(300)
        .html(short_msgs.partial)
        .animate({ width: 'toggle' }, 300);
      submit_btn.prop('disabled', false);
      return false;
    } else if (data.completed) {
      showSuccess(id_completed);
      msg_container.addClass('success');
      //
      msg_container
        .hide(300)
        .html(short_msgs.executed)
        .animate({ width: 'toggle' }, 300);
      if (!disable_on_success) submit_btn.prop('disabled', false);
      return true;
    } else {
      showError(id_completed);
      msg_container.addClass('error');
      msg_container
        .hide(300)
        .html(short_msgs.completion_failed)
        .animate({ width: 'toggle' }, 300);
      submit_btn.prop('disabled', false);
      return false;
    }
  } else {
    showError(id_completed);
    msg_container.addClass('error');
    msg_container
      .hide(300)
      .html(short_msgs.data_fail)
      .animate({ width: 'toggle' }, 300);
    submit_btn.prop('disabled', false);
  }
}

function sendAjax(type, payload) {
  let promise = new Promise((resolve, reject) => {
    $.ajax({
      type: type,
      url: `${apiUrl}${payload.url}`,
      headers: Object.assign(
        { 'Content-type': 'application/json' },
        { Authorization: `Bearer ${getCookie('jwt_cookie')}` },
        payload.additional_headers,
      ),
      data: payload.data,

      success: function (data) {
        resolve(data);
      },

      error: function (jqXHR, textStatus, errorThrown) {
        reject(jqXHR, textStatus, errorThrown);
      },
    });
  });

  return promise;
}

function printHistory(parentID, data) {
  var history_container = $(`#${parentID} #history`);

  const history = data.history;
  if (history) {
    var header = '';

    if (data.exercise_type == 'form') {
      header = `
      <table id='history-table'>
          <tr> 
              <th>Exercise started</th> 
              <th>Status</th> 
          </tr>
      `;
    }
    if (data.exercise_type == 'script') {
      header = `
      <table id='history-table'>
      <tr> 
          <th>Exercise started</th> 
          <th>Response received</th> 
          <th>Status</th> 
      </tr>
      `;
    }

    var tbl_body = header;

    $.each(history, function () {
      let start_time = this.start_time;
      let response_time = (() =>
        this.response_time ? this.response_time : 'no response')();
      let completed = (() => {
        if (this.partial)
          return `<span class='partial'>${short_msgs.history_partial}</span>`;
        if (this.completed)
          return `<span class='success'>${short_msgs.history_completed}</span>`;
        return `<span class='failed'>${
          this.status_msg || short_msgs.history_fail
        }</span>`;
      })();

      var table_row = '';
      if (data.exercise_type == 'form') {
        table_row = `
        <tr>
          <td> ${start_time} </td>
          <td> ${completed} </td>
        </tr>
        `;
      }
      if (data.exercise_type == 'script') {
        table_row = `
        <tr>
          <td> ${start_time} </td>
          <td> ${response_time} </td>
          <td> ${completed} </td>
        </tr>
        `;
      }

      tbl_body += table_row;
    });

    tbl_body += '</table>';

    history_container.html(tbl_body);

    if (history_container.find('tr').length > 2) {
      history_container
        .find('tr')
        .eq(1)
        .find('td')
        .wrapInner('<div style="display: none;" />')
        .parent()
        .find('td > div')
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

function updateExecutionHistory(global_exercise_id) {
  return sendAjax('GET', { url: `/submissions/${global_exercise_id}` })
    .then((data) => {
      if (data) {
        printHistory(global_exercise_id, data);
        updateProgress();
      }
      return data;
    })
    .catch((error) => {
      throw error;
    });
}

function getExecutionHistory(global_exercise_id) {
  const submissionCheckmark = `#${global_exercise_id} #exercise_executed`;
  showLoading(submissionCheckmark);

  updateExecutionHistory(global_exercise_id)
    .then((data) => {
      if (!data) showNoExecution(global_exercise_id);
      else visualFeedback(global_exercise_id, data);
    })
    .catch((error) => {
      console.error(error);
    });
}

function updateProgress() {
  var defer = $.Deferred();
  sendAjax('GET', { url: `/progress` })
    .then(function (data, textStatus, jqXHR) {
      $.each(data.success_list, function (parentTitle, parentExercise) {
        let menuItem = $(`.page-control[title='${parentTitle}']`)
          .find('a')
          .first();
        if (menuItem.length) {
          update_counter(menuItem, parentExercise.done, parentExercise.total);
          $.each(parentExercise.exercises, function (i, subExercise) {
            let subMenuItem = $(`.page-control[title='${subExercise.title}']`)
              .find('a')
              .first();
            if (subMenuItem.length) {
              update_counter(subMenuItem, subExercise.done, subExercise.total);
            }
          });
        }
      });
      defer.resolve(data);
    })
    .catch(function (jqXHR, textStatus, errorThrown) {
      defer.reject(jqXHR, textStatus, errorThrown);
    });

  return defer.promise();
}

function update_counter(element, done, total) {
  let icon = element.find('i').first();
  icon.addClass('counter');
  if (element.html().match(/\(\d\/\d+\)/)) {
    element.html(element.html().replace(/\(\d\/\d+\)/, `(${done}/${total})`));
  } else if (icon.length) {
    icon.append(`(${done}/${total})`);
  } else {
    element.append(`<i class='fas read-icon counter'> (${done}/${total})</i>`);
  }

  if (done == total) {
    element.find('i').addClass('fa-check done');
  } else {
    element.find('i').removeClass('fa-check done');
  }
}
