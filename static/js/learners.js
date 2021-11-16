$(function () {

    token = $(location).attr('search').split('?auth=')[1]

    // Set cookie if present in query-string
    if (token) {
        // function definition in "token-handling.js"
        setCookie('auth', token, 1)
    }


    exercise_id = slugify($('.btn-run-exercise').first().attr('value'));
    url_executeExercise = "http://127.0.0.1:5000/venjix/" + exercise_id
    url_checkCompleted = "http://127.0.0.1:5000/venjix_status/" + exercise_id
    token = getCookie('auth')
    
    indicator_id_executed = "#exercise_executed"
    indicator_id_completed = "#exercise_completed"
    
    executeAndCheck(
        token, 
        url_executeExercise, 
        indicator_id_executed, 
        url_checkCompleted, 
        indicator_id_completed
        )

    // Run exercises
    $('.btn-run-exercise').click(function () {

        showLoading(indicator_id_executed);
        showLoading(indicator_id_completed);

        $('#error-msg').html("");
        $('#success-msg').html("");
        
        executeAndCheck(
            token, 
            url_executeExercise, 
            indicator_id_executed, 
            url_checkCompleted, 
            indicator_id_completed
            )

    })

});



