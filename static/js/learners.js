$(function () {

    url_token = $(location).attr('search').split('?auth=')[1]

    // Set cookie if present in query-string
    if (url_token) {
        // function definition in "token-handling.js"
        setCookie('auth', url_token, 1)
    }

    // Get current token
    token = getCookie('auth')

    indicator_id_executed = "#exercise_executed"
    indicator_id_completed = "#exercise_completed"

    script_name = $('.btn-run-exercise').first().attr('value')
    if (script_name) {
        script_name = slugify(script_name);
        url_getCurrentState = "http://127.0.0.1:5000/current_state/" + script_name 
        url_executeExercise = "http://127.0.0.1:5000/execute_script/" + script_name
        // initial load
        getCurrentState()
    }
    
    url_checkCompleted = "http://127.0.0.1:5000/check_completion/"

    
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



