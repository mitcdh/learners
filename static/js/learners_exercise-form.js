const validationOptions = {
  ignore: [],
  rules: getValidationRules(),
};

function formExercise(exercise) {
  const exerciseForm = $(`#${exercise.global_exercise_id}`);

  // Initital validation
  exerciseForm.validate(validationOptions);

  // Submit Handler
  exerciseForm.submit(async (event) => {
    event.preventDefault();
    
    // Upload Handler
    let sucessfulUploadHandler = await uploadHandler(exerciseForm);
    persistForm(exercise.global_exercise_id);
    
    // Validate Form
    let status = exerciseForm.validate(validationOptions);
    let validForm = !Object.keys(status.invalid).length;
    
    if (validForm && sucessfulUploadHandler) {
      await submitForm(this, exercise);
      getExecutionHistory(exercise);
    }
  });

  $("#upload_form").submit(function (event) {
    const status = $(this).validate(validationOptions);
    const validForm = !Object.keys(status.invalid).length;

    if (validForm) {
        uploadHandler(exerciseForm)
    }
    event.preventDefault();
    event.stopImmediatePropagation();
  });

  loadForm(exercise);
  initForm(exercise);

  getExecutionHistory(exercise);

  const drawioContainers = $(".drawio-container")
  $.each(drawioContainers, (i, drawioContainer) => {
    setTimeout((() => {
      initDrawIO(drawioContainer.id)
    }), 1000);

  });
}

// ------------------------------------------------------------------------------------------------------------

async function uploadHandler(exerciseForm) {
  var defer = $.Deferred();

  // Determine if fileupload exists in exercise
  const uploadContainerList = exerciseForm.find("#upload-container");

  // If no upload present return
  if (!uploadContainerList.length) defer.resolve(true);

  // Set variables
  let uploadContainer = uploadContainerList[0];
  let fileInput = $($(uploadContainer).find("#file")[0]).val();

  if (fileInput) {
    await uploadFile(uploadContainer).then((data) => {
      
      // User feedback
      const msgContainer = $(uploadContainer).find("#msg-detail")[0];

      // Add classes
      $(msgContainer).removeClass("error success");
      if (!data.executed) {
        $(msgContainer).addClass("error");
        $(msgContainer).html(data.msg || "File upload failed.");
        $(msgContainer).slideDown();
      }
      else if (data.executed) {
        $(msgContainer).addClass("success");
        $(msgContainer).html(data.msg || "File uploaded.");
        $(msgContainer).slideDown();
      } else {
        $(msgContainer).removeClass();
        $(msgContainer).html("");
        $(msgContainer).hide();
      }

      defer.resolve(true);
    });
  }

  let uploadedFilename = $($(uploadContainer).find("#attachment")[0]).val();
  if (uploadedFilename) defer.resolve(true);

  return defer.promise();
}

async function uploadFile(upload_container) {
  var defer = $.Deferred();

  const file_data = $(upload_container).find("#file").prop("files")[0];
  let form_data = new FormData();
  form_data.append("file", file_data);
  await $.ajax({
    // TODO: Remove localhost
    // url: "http://localhost:5000" + "/uploads",
    url: "/uploads",
    cache: false,
    contentType: false,
    processData: false,
    data: form_data,
    type: "post",
    headers: { Authorization: `Bearer ${getCookie("jwt_cookie")}` },
    success: function (data) {
      if (data) {
        // Set attachment value to hidden field
        const hiddenField = $(upload_container).find("#attachment")[0];
        $(hiddenField).attr("value", data.filename);
        defer.resolve(data);
      }
      defer.resolve(false);
    },
  });
  return defer.promise();
}


function appendNewInputRow(this_fieldset, amount = 1) {
  const base = $(this_fieldset).find(".default-inputs");
  const container = $(this_fieldset).find("#additionalInput")[0];
  let current_count = $(container).find(".input-group").length;

  for (let i = 0; i < amount; i++) {
    let new_input_row = base.clone();
    let new_index = current_count + i + 1;

    // Update Titel of new input row:
    $(new_input_row).find("h4")[0].append(` (Additional ${new_index})`);

    // Update input names and labels
    $.each($(new_input_row).find(".input"), function (index, input_object) {
      let current_input_name = $(input_object).attr("name");
      let new_input_name = `${current_input_name} (Additional ${new_index})`;
      $(new_input_row)
        .find(`label[for=${current_input_name}]`)
        .attr("for", new_input_name);
      $(input_object).attr("name", new_input_name);
      $(input_object).val("");
    });

    $(new_input_row).removeClass("default-inputs");
    $(new_input_row).css("display", "none");

    let closer = $(
      '<div class="closer"><svg class="bi" width="50%" height="50%"><use xlink:href="#close"></use></svg></div>'
    );
    $(new_input_row).prepend(closer);

    $(container).append(new_input_row);
    $(new_input_row).slideDown();
  }
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
    let section_name =
      $(this).find("h4").first().text() || `Section ${section}`;

    $.each(
      $(this).find(".input").not("[name='minInputs']").not(".uploader-element"),
      function () {
        let input_name = $(this).attr("name");
        let input_value = $(this).val();
        section_obj[input_name] = input_value;
      }
    );

    form_data[section_name] = section_obj;
  });

  return form_data;
}

function minimumElements(form) {
  var valid = true;
  let fieldsets = $(form).find("fieldset");
  $.each(fieldsets, function () {
    let hidden_inputs = $(this).find("[name='minInputs']");
    if (hidden_inputs.length > 0) {
      var minInputs = hidden_inputs[0].value;
    }
    var additionalInputs = $(this).find("#additionalInput .input-group").length;
    if (additionalInputs + 1 < minInputs) {
      valid = false;
      $(this).addClass("error");
      $(this)
        .find("#fieldset-error")
        .html(
          `A minimum of ${minInputs} items are required. Only ${
            additionalInputs + 1
          } were given.`
        );
    } else {
      $(this).removeClass("error");
      $(this).find("#fieldset-error").html("");
    }
    let error = $("fieldset.error");
    if (error.length > 0) {
      $("html, body").animate(
        {
          scrollTop: $("fieldset.error").offset().top,
        },
        400
      );
    }
  });
  return valid;
}

function submitForm(form, exercise) {
  var defer = $.Deferred();
  if (minimumElements(form)) {
    formData = getFormData(exercise)
    sendAjax("POST", { url: `/submissions/form/${exercise.global_exercise_id}`, data: JSON.stringify(formData) })
    .then(function (data, textStatus, jqXHR) {
      defer.resolve(data);
    })
    .catch(function (jqXHR, textStatus, errorThrown) {
      defer.reject(jqXHR, textStatus, errorThrown);
    });
  }
  return defer.promise();
}

function initForm(exercise) {
  $(`#${exercise.global_exercise_id}`)
    .find(".add-input-row")
    .click(function () {
      appendNewInputRow($(this).closest("fieldset"), (amount = 1));
    });

  $(document).on("click", ".closer", function () {
    $(this)
      .parent()
      .slideUp("normal", function () {
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
  // Get cache from server
  let storedForm = {};

  sendAjax("GET", { url: `/cache/${exercise.global_exercise_id}` })
    .then(function (data, textStatus, jqXHR) {
      storedForm = JSON.parse(data["form_data"]);

      // if stored form is not empty
      if (storedForm) {
        let field_sets = $(`#${exercise.global_exercise_id}`).find("fieldset");

        let inputdata = [];

        const keys = Object.keys(storedForm);
        keys.forEach((key, fieldset_index) => {
          // Expand if needed
          let additional_count = storedForm[key]["additional"];
          appendNewInputRow(
            field_sets[fieldset_index],
            (amount = additional_count)
          );

          // Extract input data
          for (const subkey in storedForm[key]) {
            if (subkey != "additional") inputdata.push(storedForm[key][subkey]);
          }
        });

        // Set data
        let input_fields = $(`#${exercise.global_exercise_id}`).find(".input");
        $.each($(input_fields), function (index, input_field) {
          if ($(input_field).attr("type") != "file") {
            $(input_field).val(inputdata[index]);
          }
        });
      }
    })
    .catch(function (jqXHR, textStatus, errorThrown) {
      console.error(jqXHR, textStatus, errorThrown);
    });
}

function persistForm(global_exercise_id) {
  let form_data_to_store = {};
  let parent = null;

  $.each(
    $(`#${global_exercise_id}`).find(".input"),
    function (index, input_field) {
      // get current fieldset
      let current_parent = $(input_field).closest("fieldset")[0];

      // init parent fieldset
      if (parent != current_parent) {
        parent = current_parent;
        parentindex = index;
      }

      // if in the same fieldset
      if (parent == current_parent) {
        form_data_to_store[parentindex] = form_data_to_store[parentindex] || {};
        form_data_to_store[parentindex][index] =
          $(input_field).val() || $(input_field).attr("value") || "";
        form_data_to_store[parentindex]["additional"] =
          $(parent).find(".closer").length;
      }
    }
  );

  // Set cache on server
  sendAjax("PUT", {
    url: `/cache`,
    data: JSON.stringify({
      global_exercise_id: global_exercise_id,
      form_data: form_data_to_store,
    }),
  }).catch(function (jqXHR, textStatus, errorThrown) {
    console.error(jqXHR, textStatus, errorThrown);
  });
}

function setSectionValues(element, section) {
  if (section) {
    $.each(
      $(element)
        .find(".input")
        .not("[name='minInputs']")
        .not(".uploader-element"),
      function () {
        $(this).val(section[$(this).attr("name")]);
      }
    );
  }
}

function getSectionValues(element) {
  let input_group_obj = {};
  $.each(
    $(element)
      .find(".input")
      .not("[name='minInputs']")
      .not(".uploader-element"),
    function () {
      let input_name = $(this).attr("name");
      let input_value = $(this).val();
      input_group_obj[input_name] = input_value;
    }
  );
  return input_group_obj;
}

const updateDrawioPreview = (container, data) => {
  const preview = $(container).find(".drawio-preview")[0];
  $(preview).attr("src", `https://viewer.diagrams.net/${data}`)
}

function initDrawIO(container_id) {
  const container = $(`#${container_id}`);
  let current_input = $(container).find("textarea.drawio-input").val();
  
  if (current_input) {
    current_input = current_input.replace("https://app.diagrams.net/", "");
    updateDrawioPreview(container, current_input)
  }
}

function callSetDrawIO(event, url_encoded_data, button_element) {
  const container = $(button_element).closest(".drawio-container");
  const current_input = $(container).find("textarea.drawio-input").val();

  if (current_input) url_encoded_data = current_input;
  url_encoded_data = url_encoded_data.replace("https://app.diagrams.net/", "");

  const openDrawioInNewTab = () => {
    const newTab = window.open(
      `https://app.diagrams.net/${url_encoded_data}`,
      "_blank"
    );
    newTab.name = `drawio_tab`;
  }

  if ($(container).attr("devstage") === "true") {
    openDrawioInNewTab()
  } else {
    try {
      window.parent.postMessage({
        'func': 'setDrawIO',
        'message': `${url_encoded_data}`
      }, "*");  
    } catch (e) {
      console.error(e)
      openDrawioInNewTab()
    }
  }

  event.preventDefault();
}

function resetDrawIO(event, button_element, original_data) {
  let container = $(button_element).closest(".drawio-container")[0];
  $(container).find("textarea.drawio-input").val("");
  updateDrawioPreview(container, original_data)
  event.preventDefault();
}

function insertDrawIOhook(element) {
  let current_value = $(element).val().split("#");
  let title = current_value[0].split("title=")[1] || "unknown";
  let url_encoded_data = current_value[1];
  let new_value = "";
    
  if (url_encoded_data) new_value = `?title=${title}#${url_encoded_data}`;
  $(element).val(new_value);

  // Update preview
  const preview = $(element).closest(".drawio-container").find(".drawio-preview")[0];
  $(preview).attr("src", `https://viewer.diagrams.net/${new_value}`)

  if (!new_value) {
    $(element).attr(
      "placeholder",
      "Please paste in the url-encoded diagram (menu - file - publish - link)"
    );
  }
}

$(function () {
  $(".drawio-input").bind("input propertychange", function () {
    insertDrawIOhook(this);
  });
});

$.extend(jQuery.validator.messages, {
  required: "",
});
