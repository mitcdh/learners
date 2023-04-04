$(function () {
  getState();

  exercises = [];
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

  hide_show_content();

  $(".inactive_menu_link").click(function (event) {
    // If not in dev environment ignore the click event
    if ($(this).attr("devstage") != "true") 
        event.preventDefault();
  });

  init_comment_forms();
});

function init_comment_forms() {
  $(".comment-form").submit(function (event) {

    // Get data
    const comment = $(this).find("textarea").val()
    const info = $(this).find("input[name=info]").val();
    const page = JSON.parse(info).page
    const data = JSON.stringify({
      "page": page,
      "comment": comment,
    })

    // Get feedback container
    const responseContainer = $(this).find(".response");

    // Send comment to backend
    sendAjax("POST", { url: `/comments`, data: data })
      .then(function (data, textStatus, jqXHR) {
        responseContainer.html("Thank you for your feedback.").addClass("success");
      })
      .catch(function (jqXHR, textStatus, errorThrown) {
        responseContainer.html("Something went wrong.").addClass("error");
      });

    // Prevent default    
    event.preventDefault();
    event.stopImmediatePropagation();
  });
}

function hide_show_content() {
  let menulinks = $("#sidebar .topics").find(".dd-item a");
  $(menulinks).each(function (index, menulink) {
    let hideopts = $(menulink).attr("hideopts");

    if (hideopts) {
      if (hideopts == "true") $(menulink).addClass("inactive_menu_link");
      if (hideopts.includes("until") || hideopts.includes("from")) {
        let parsed_hideopts = parse_hideopts(hideopts);
        if (parsed_hideopts.reveildate && parsed_hideopts.hidedate) {
          if (
            new Date().toLocaleString() < parsed_hideopts.reveildate &&
            parsed_hideopts.hidedate < new Date().toLocaleString()
          ) {
            $(menulink).addClass("inactive_menu_link");
            when_time_passed(parsed_hideopts.reveildate).then(() => {
              $(menulink).removeClass("inactive_menu_link");
            });
          } else {
            $(menulink).removeClass("inactive_menu_link");
            when_time_passed(parsed_hideopts.hidedate).then(() => {
              $(menulink).addClass("inactive_menu_link");
              when_time_passed(parsed_hideopts.reveildate).then(() => {
                $(menulink).removeClass("inactive_menu_link");
              });
            });
          }
        } else if (parsed_hideopts.reveildate) {
          if (parsed_hideopts.reveildate > new Date().toLocaleString())
            $(menulink).addClass("inactive_menu_link");
          when_time_passed(parsed_hideopts.reveildate).then(() => {
            $(menulink).removeClass("inactive_menu_link");
          });
        } else if (parsed_hideopts.hidedate) {
          if (parsed_hideopts.hidedate < new Date().toLocaleString())
            $(menulink).removeClass("inactive_menu_link");
          when_time_passed(parsed_hideopts.hidedate).then(() => {
            $(menulink).addClass("inactive_menu_link");
          });
        }
      }
    }
  });
}

function when_time_passed(date) {
  return new Promise((resolve) => {
    let timer = setInterval(function () {
      if (date < new Date().toLocaleString()) {
        clearInterval(timer);
        resolve(true);
      }
    }, 60 * 1000 * 5); // check every 5 min
  });
}

function parse_hideopts(hideopts) {
  let reveildate = null;
  let hidedate = null;
  try {
    reveildate = new Date(
      Date.parse(hideopts.split("until ")[1].split("from ")[0].trim())
    ).toLocaleString();
  } catch (e) {}
  try {
    hidedate = new Date(
      Date.parse(hideopts.split("from ")[1].split("until ")[0].trim())
    ).toLocaleString();
  } catch (e) {}

  return { reveildate, hidedate };
}
