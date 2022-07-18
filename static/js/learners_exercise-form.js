function formExercise(exercise) {

  $.extend(jQuery.validator.messages, {
    required: "*",
  });

  if ($(`#${exercise.id}`).find("#additionalInput").length) {
    initAdditionalInput(exercise);
  }

  $(`#${exercise.id}`).validate({ignore: [],  rules: getValidationRules() });
  
  $(`#${exercise.id}`).submit(function (event) {
    
    let status = $(`#${exercise.id}`).validate({ignore: [], rules: getValidationRules() });
    
    if (($("#upload-container").length > 0) && (!$("#upload-container").find("#attachment").val())) {
      uploadFile()
      .then(function () {
        setTimeout(function() {
          if ($("#upload-container").find("#attachment").val()) {
            submitForm(this, exercise);
            getHistory(exercise);
          }
        }, 500);
      });
    } else if (!Object.keys(status.invalid).length) {
      submitForm(this, exercise);
      getHistory(exercise);
    }
    event.preventDefault();
  });
  
  $("#upload_form").submit(function (event) {
    let status = $(this).validate({ rules: getValidationRules() });
    if (!Object.keys(status.invalid).length) {
      uploadFile();
    }
    event.preventDefault();
    event.stopImmediatePropagation();
  });
  
  loadForm(exercise);
  initForm(exercise);
  updateRiskValue();
  
  getHistory(exercise);


};

// ------------------------------------------------------------------------------------------------------------

function uploadFile() {

  var defer = $.Deferred();

  var file_data = $("#upload-container").find("#file").prop('files')[0]
  var form_data = new FormData();                  
  form_data.append('file', file_data);
  $.ajax({
      url: '/upload',
      cache: false,
      contentType: false,
      processData: false,
      data: form_data,                         
      type: 'post',
      headers: { Authorization: `Bearer ${getCookie("access_token_cookie")}` },
      success: function(data){
        showMsg("upload-container", data);
        if (data) {
          $("#upload-container").find("#attachment").attr("value", data.file);
        }
        defer.resolve(data);
      }
   });

  return defer.promise();
}


function initAdditionalInput(exercise) {
  $.each($(`#${exercise.id} #inputgroup_`), function (index) {

    let new_index = index + 1;
    $(this).attr("id", `inputgroup_${new_index}`);
    $(this)
      .parent()
      .find(".add-input-row")
      .attr("value", `inputgroup_${new_index}`);
  });

  $(".add-input-row").click(function () {
    addFieldset($(this), exercise);
  });

}

function addFieldset(element, exercise) {
  let current_id = element.attr("value");
  let next_index = parseInt(current_id.match(/\d+/)[0], 10) + 1;
  let additional_container = element.parent().find(`#${current_id}`)
    .parent()
    .find("#additionalInput");

  let last_item = additional_container.find(".input-group").last();
  if (last_item.length != 0) {
    next_index = parseInt(last_item.attr("id").match(/\d+/)[0], 10) + 1;
  }

  let current_reference = element.parent().find(`#${current_id}`)
  let new_html_object = current_reference.clone();
  new_html_object.find("#fieldset-error").remove();
  new_html_object.find("input").attr("value", "");

  let html =
    `<div id="inputgroup_${next_index}" style="display: none" class="input-group">`;
  html +=
    '<div class="closer"><svg class="bi" width="50%" height="50%"><use xlink:href="#close"></use></svg></div>';
  html += new_html_object.html();
  html += '</div>';

  additional_container.append(html);
  additional_container
    .find("h4")
    .html(`Additional ${current_reference.find("h4").html()}`);

  $(`#inputgroup_${next_index}`).slideDown();

  $(document).on("click", ".closer", function () {
    $(this)
      .parent()
      .slideUp("normal", function () {
        $(this).remove();
      });

      setTimeout(function() {
        persistForm(exercise);
     }, 500);
  });

  initForm(exercise);
  $(`#${exercise.id}`).validate({ignore: [],  rules: getValidationRules() });
}

function getHistory(exercise) {
  getExecutionHistory(exercise)
    .then(function (response) {
      // if (response.completed) {
      //   disableForm(exercise.id);
      // }
    });
}

function disableForm(id) {
  $(`#${id} .btn-submit-form`).prop("disabled", true);
  $(`#${id} .add-input-row`).remove();

  let input_types = ["input", "textarea", "select", "button"];
  $.each(input_types, function () {
    $.each($(`#${id}`).find(String(this)), function () {
      $(this).prop("disabled", "true");
    });
  });
}

function getValidationRules() {
  var rule_dict = {};
  $.each($(".form .required"), function () {
    key = $(this).attr("id");
    rule_dict[key] = "required";
  });
  return rule_dict;
}

function getFormData(exercise) {

  let form_data = {};
  let section = 0;

  $.each($(`#${exercise.id}`).find(".input-group"), function () {
    section++;
    let section_obj = {};
    let section_name = $(this).find("h4").text() || `Section ${section}`;

    $.each($(this).find("input, textarea, select").not("[name='minInputs']").not(".uploader-element"), function () {
      let input_name = $(this).attr("name");
      let input_value = $(this).val();
      section_obj[input_name] = input_value;
    });

    form_data[section_name] = section_obj;
  });

  return form_data;
}

function minimumElements(form) {
  var valid = true;
  let fieldsets = $(form).find("fieldset");
  $.each(fieldsets, function () {
    let hidden_inputs = $(this).find("[name='minInputs']")
    if (hidden_inputs.length > 0) {
      var minInputs = hidden_inputs[0].value;
    }
    var additionalInputs = $(this).find("#additionalInput .input-group").length;
    if ((additionalInputs + 1) < minInputs) {
      valid = false;
      $(this).addClass("error")
      $(this).find("#fieldset-error").html(
        `A minimum of ${minInputs} items are required. Only ${(additionalInputs + 1)} were given.`
      )
    } else {
      $(this).removeClass("error")
      $(this).find("#fieldset-error").html("")
    }
    let error = $("fieldset.error")
    if (error.length > 0) {
      $('html, body').animate({
        scrollTop: $("fieldset.error").offset().top
      }, 400);
    }
  });
  return valid
}

function submitForm(form, exercise) {
  if (minimumElements(form)) {
    exercise["formData"] = getFormData(exercise);
    var method = $(`#${exercise.id}`).hasClass("mail") ? "mail" : "";
    executeAndCheck(exercise)
  }
}

function expandAdditionalInputs(storedForm, exercise) {
  if (Object.keys(storedForm).length != 0) {
    let index = 0;
    $.each($(`#${exercise.id}`).find("fieldset"), function () {
      index++;
      let group = storedForm[index]
      let subgroup_length = Object.keys(group).length
      if ((subgroup_length > 1) && (Object.values(group)[0] instanceof Object)) {
        let btn = $(this).find(".add-input-row");
        for (let i = 0; i < (subgroup_length - 1); i++) {
          addFieldset(btn, exercise);
        }
      }
    });
  }
}

function initForm(exercise) {
  $.each($(`#${exercise.id} input, #${exercise.id} textarea, #${exercise.id} select`).not("[name='minInputs']"), function () {
    $(this).on("change", (e) => {
      persistForm(exercise);
    });
  });

  $(".input-group #Likelihood, .input-group #Impact").on("change", (event) => {
    updateRiskValue()
  });  
}

function updateRiskValue() {
    $.each($(".input-group"), function (element) {
      let computedRiskField = $(this).find("#Risk")[0]
      if (computedRiskField) {
        let likelihood_value = $(this).find("#Likelihood")[0].value
        let impact_value = $(this).find("#Impact")[0].value
        computedRiskField.value = parseInt(likelihood_value.slice(0,1)) * parseInt(impact_value.slice(0,1));
      }
  })
};

function loadForm(exercise) {

  var storedForm = JSON.parse(localStorage.getItem(exercise.id)) || {};

  if (Object.keys(storedForm).length != 0) {
    expandAdditionalInputs(storedForm, exercise);

    let index = 0;
    let subindex = 0;

    $.each($(`#${exercise.id}`).find(".input-group"), function () {
      let expandable = $(this).closest("fieldset").find("#additionalInput").length

      if (expandable) {
        subindex++;
        if (subindex < 2) index++;
        let section = storedForm[index]
        setSectionValues(this, section[subindex]);
      } else {
        subindex = 0;
        index++;
        let section = storedForm[index]
        setSectionValues(this, section);
      }
    });
  };
}

function persistForm(exercise) {

  let index = 0;
  let subindex = 0;
  let form_data = {}

  $.each($(`#${exercise.id}`).find(".input-group"), function () {
    let expandable = $(this).closest("fieldset").find("#additionalInput").length
    if (expandable) {
      subindex++;
      if (subindex < 2) index++;
      let subgroup = form_data[index] || {};
      subgroup[subindex] = getSectionValues(this);
      form_data[index] = subgroup;
    } else {
      subindex = 0;
      index++;
      form_data[index] = getSectionValues(this);
    }
  });

  localStorage.setItem(exercise.id, JSON.stringify(form_data));
}

function setSectionValues(element, section) {
  if (section) {
    $.each($(element).find("input, textarea, select").not("[name='minInputs']").not(".uploader-element"), function () {
      $(this).val(section[$(this).attr("name")])
    });
  }
}

function getSectionValues(element) {
  let input_group_obj = {}
  $.each($(element).find("input, textarea, select").not("[name='minInputs']").not(".uploader-element"), function () {
    let input_name = $(this).attr("name");
    let input_value = $(this).val();
    input_group_obj[input_name] = input_value;
  });
  return input_group_obj;
}