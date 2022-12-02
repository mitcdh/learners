function formExercise(exercise) {

  $.extend(jQuery.validator.messages, {
    required: "",
  });

  $(`#${exercise.global_exercise_id}`).validate({ ignore: [], rules: getValidationRules() });

  $(`#${exercise.global_exercise_id}`).submit(function (event) {

    let status = $(`#${exercise.global_exercise_id}`).validate({ ignore: [], rules: getValidationRules() });

    if (($("#upload-container").length > 0) && (!$("#upload-container").find("#attachment").val())) {
      uploadFile()
        .then(function () {
          setTimeout(function () {
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

  $("#comment-form").submit(function (event) {
    let comment = $(this).find("textarea").val()
    postComment(exercise, comment)
    event.preventDefault();
    event.stopImmediatePropagation();
  });

  loadForm(exercise);
  initForm(exercise);

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
    success: function (data) {
      showMsg("upload-container", data);
      if (data) {
        $("#upload-container").find("#attachment").attr("value", data.file);
      }
      defer.resolve(data);
    }
  });

  return defer.promise();
}

function appendNewInputRow(this_fieldset, amount=1) {
  let base = $(this_fieldset).find(".default-inputs")
  let container = $(this_fieldset).find("#additionalInput")[0]
  let current_count = $(container).find(".input-group").length

  for (let i = 0; i < amount; i++) {
    let new_input_row = base.clone();
    let new_index = current_count + i + 1

    // Update Titel of new input row:
    $(new_input_row).find("h4")[0].append(` (Additional ${new_index})`)
    
    // Update input names and labels
    $.each($(new_input_row).find(".input"), function (index, input_object) {
      let current_input_name = $(input_object).attr("name")
      let new_input_name = `${current_input_name} (Additional ${new_index})`
      $(new_input_row).find(`label[for=${current_input_name}]`).attr("for", new_input_name)
      $(input_object).attr("name", new_input_name)
    })

    $(new_input_row).removeClass("default-inputs")
    $(new_input_row).css("display", "none")
    
    let closer = $('<div class="closer"><svg class="bi" width="50%" height="50%"><use xlink:href="#close"></use></svg></div>')
    $(new_input_row).prepend(closer)

    $(container).append(new_input_row);
    $(new_input_row).slideDown();
  } 
}

function getHistory(exercise) {
  getExecutionHistory(exercise)
    .then(function (response) {
      // if (response.completed) {
      //   disableForm(exercise.global_exercise_id);
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

  $.each($(`#${exercise.global_exercise_id}`).find("fieldset"), function () {
    section++;
    let section_obj = {};
    let section_name = $(this).find("h4").first().text() || `Section ${section}`;

    $.each($(this).find(".input").not("[name='minInputs']").not(".uploader-element"), function () {
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
    var method = $(`#${exercise.global_exercise_id}`).hasClass("mail") ? "mail" : "";
    executeAndCheck(exercise)
  }
}

function initForm(exercise) {
  
  $(`#${exercise.global_exercise_id}`).find(".add-input-row").click(function () {
    appendNewInputRow($(this).closest("fieldset"), amount=1);
  });
  
  $(document).on("click", ".closer", function () {
    $(this).parent().slideUp("normal", function () {
        $(this).remove();
      });
    setTimeout(function () {
      persistForm(exercise.global_exercise_id);
    }, 500);
  });

  $(document).on("change", ".input", function () {
    persistForm(exercise.global_exercise_id);
  });
}

function loadForm(exercise) {
  var storedForm = JSON.parse(localStorage.getItem(exercise.global_exercise_id)) || {};

  // if stored form is not empty
  if (Object.keys(storedForm).length != 0) {
    let field_sets = $(`#${exercise.global_exercise_id}`).find("fieldset")

    let inputdata = []

    const keys = Object.keys(storedForm);

    keys.forEach((key, fieldset_index) => {

      // Expand if needed
      let additional_count = storedForm[key]["additional"]
      appendNewInputRow(field_sets[fieldset_index], amount=additional_count)

      // Extract input data
      for (const subkey in storedForm[key]) {
        if (subkey != "additional") inputdata.push(storedForm[key][subkey])
      }
    });

    // Set data
    let input_fields = $(`#${exercise.global_exercise_id}`).find(".input")
    $.each($(input_fields), function (index, input_field) {
      $(input_field).val(inputdata[index])
    });

  };
}

function persistForm(global_exercise_id) {

  let form_data_to_store = {}
  let parent = null

  $.each($(`#${global_exercise_id}`).find(".input"), function (index, input_field) {

    // get current fieldset
    let current_parent = $(input_field).closest("fieldset")[0]

    // init parent fieldset
    if (parent != current_parent) {
      parent = current_parent
      parentindex = index
    }

    // if in the same fieldset
    if (parent == current_parent) {
      form_data_to_store[parentindex] = form_data_to_store[parentindex] || {}
      form_data_to_store[parentindex][index] = $(input_field).val()
      form_data_to_store[parentindex]["additional"] = $(parent).find(".closer").length
    }
  });
  localStorage.setItem(global_exercise_id, JSON.stringify(form_data_to_store));
}

function setSectionValues(element, section) {
  if (section) {
    $.each($(element).find(".input").not("[name='minInputs']").not(".uploader-element"), function () {
      $(this).val(section[$(this).attr("name")])
    });
  }
}

function getSectionValues(element) {
  let input_group_obj = {}
  $.each($(element).find(".input").not("[name='minInputs']").not(".uploader-element"), function () {
    let input_name = $(this).attr("name");
    let input_value = $(this).val();
    input_group_obj[input_name] = input_value;
  });
  return input_group_obj;
}

function callSetDrawIO(event, parent, url_encoded_data, button_element) {

  let container = $(button_element).closest(".image-container")
  let current_input = $(container).find("textarea.drawio-input").val()

  if (current_input) url_encoded_data = current_input
  url_encoded_data = url_encoded_data.replace("https://app.diagrams.net/", "")

  try {
    parent.setDrawIO(url_encoded_data);
  } catch (e) {
    let newTab = window.open(`https://app.diagrams.net/${url_encoded_data}`, "_blank");
    newTab.name = `drawio_tab`;
  }
  event.preventDefault(); 
}

function resetDrawIO(event, button_element) {

  let container = $(button_element).closest(".image-container")
  $(container).find("textarea.drawio-input").val("")
  event.preventDefault(); 
}

function insertDrawIOhook(element) {
  let current_value = $(element).val().split("#")
  let title = (current_value[0]).split("title=")[1] || "unknown"
  let url_encoded_data = current_value[1]
  let new_value = ""
  if (url_encoded_data) new_value = `?title=${title}#${url_encoded_data}`
  $(element).val(new_value)
  if (!new_value) {
    $(element).attr("placeholder", "Please paste in the url-encoded diagram (menu - file - publish - link)")
  }
}

$(function () {
  $(".drawio-input").bind('input propertychange', function() {
    insertDrawIOhook(this)
  });
})