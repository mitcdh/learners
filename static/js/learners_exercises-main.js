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
});

function hide_show_content() {
  let menulinks = $("#sidebar .topics").find(".dd-item a");
  $(menulinks).each(function (index, menulink) {
    let hideopts = $(menulink).attr("hideopts");

    console.log(menulink);

    if (hideopts) {
      console.log(hideopts);

      if (hideopts == "true") $(menulink).addClass("inactive_menu_link");

      if (hideopts.includes("until") || hideopts.includes("from")) {
        let parsed_hideopts = parse_hideopts(hideopts);
        console.log("parsed_hideopts: ", parsed_hideopts);

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

    console.log(menulink);
  });
}

function when_time_passed(date) {
  return new Promise((resolve) => {
    let timer = setInterval(function () {
      console.log(date);
      console.log(date < new Date().toLocaleString());
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
