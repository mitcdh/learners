$(function () {

    getState();

    exercises = [];
    $(".exercise-info[name=info]").each(function () {
        exercises.push(JSON.parse($(this).attr('value')));
    });

    $.each(exercises, function (i, exercise_item) {
        var exercise = {
            exercise_name: exercise_item.exercise_name,
            global_exercise_id: exercise_item.global_exercise_id,
            exercise_type: exercise_item.exercise_type,
            script: exercise_item.script || null
        }

        switch (exercise.exercise_type) {
            case "form":
                formExercise(exercise);
                break;
            case "script":
                scriptExercise(exercise);
                break;
        }
    })

    let active_menuItem = $(".topics .active")

    if (active_menuItem.length > 0) {
        $(".topics").animate({ scrollTop: $(".topics .active").offset().top }, "slow");
    }

});