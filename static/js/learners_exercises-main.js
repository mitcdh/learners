$(function () {

    getState();

    exercises = [];
    $(".exercise-info[name=info]").each(function () {
        exercises.push(JSON.parse($(this).attr('value')));
    });

    $.each(exercises, function (i, exercise_item) {
        var exercise = {
            name: exercise_item.name,
            id: exercise_item.id,
            type: exercise_item.type,
            script: exercise_item.script || null
        }

        switch (exercise.type) {
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