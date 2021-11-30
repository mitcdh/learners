
// switch indicator to loading
function showLoading(id) {
    $(id).stop(true, true)
        .removeClass('failed')
        .removeClass('success')
        .addClass('loading')
        .show();
}


// switch indicator to check
function showSuccess(id) {
    $(id).stop(true, true)
        .removeClass('loading')
        .removeClass('failed')
        .addClass('success')
        .show();
}


// switch indicator to fail
function showError(id) {
    $(id).stop(true, true)
        .removeClass('loading')
        .removeClass('success')
        .addClass('failed')
        .show();
}


// Read current completion state from CPM 
function getCurrentState() {

    $.ajax({
        type: "GET",
        url: url_getCurrentState,                           // use uuid-dependand URL 
        crossDomain: true,
        headers: { "Authorization": "Bearer " + token },    // append JWT token

        // execute if the request was successful
        success: function (data) {
            
            // display execution state
            if (data.script_executed) {
                showSuccess(indicator_id_executed)
            } else {
                showError(indicator_id_executed)
            }
            
            // display completion state
            if (data.completed) {
                showSuccess(indicator_id_completed)
            } else {
                showError(indicator_id_completed)
            }

            // print last 10 tries
            printHistory(data.history)

        },

        // execute if request failed
        error: function (jqXHR, textStatus, errorThrown) {

            // display errors
            showError(indicator_id_executed)
            showError(indicator_id_completed)

        }
    });

}


// display execution table
function printHistory(history) {

    if (history) {
        
        // starting block of html (table header)
        var tbl_body = `
            <table id='history-table'>
                <tr> 
                    <th>Exercise started</th> 
                    <th>Response received</th> 
                    <th>Completed</th> 
                </tr>
            `;
        
        // construct each row
        $.each(history, function () {
            var tbl_row = "";

            // construct each column per row
            $.each(this, function (key, value) {
                if (key == "completed") {
                    if (Boolean(value)) {
                        value = `
                            <span class='success'>
                                succeded
                            </span>
                            `;
                    } else {
                        value = `
                            <span class='failed'>
                                failed
                            </span>
                            `;
                    }
                }
                if (value == null) {
                    value = "no response"
                }
                tbl_row = "<td>" + value + "</td>" + tbl_row;
            });

            // append row to body
            tbl_body += "<tr>" + tbl_row + "</tr>";
        
        });

        // close html-tag
        tbl_body += "</table>"

        // create DOM
        $("#history").html(tbl_body);
        
        // slide down effect
        $("#history").slideDown();
    }
}


// ajax request function
function sendAjax(type, url, token) {
    
    let promise = new Promise((resolve, reject) => {
        $.ajax({
            type: type,
            url: url,
            crossDomain: true,
            headers: { "Authorization": "Bearer " + token },    // append JWT token
            
            // execute if the request was successful
            success: function (data) {
                resolve(data)
            },

            // execute if request failed
            error: function (jqXHR, textStatus, errorThrown) {
                reject(jqXHR, textStatus, errorThrown)
            }
        })
    })

    return promise
}


// execute when button is clicked
function executeAndCheck(btn, token, url_executeExercise, indicator_id_executed, url_checkCompleted, indicator_id_completed) {

    // prevent multiple executions
    $(btn).prop('disabled', true);

    let execution = false;
    let connection = true;
    let url_checkCompleted_uuid = "";

    $.when(sendAjax("POST", url_executeExercise, token))

        // execute if the execution-request was successful
        .then(function (data, textStatus, jqXHR) {

            if (data.executed == true) {
                showSuccess(indicator_id_executed);
                execution = true
            } else {
                showError(indicator_id_executed);
                showError(indicator_id_completed);
                $('#error-msg').html("Execution failed.<br>")
            }

            // concatenate CPM-check base URL with UUID 
            url_checkCompleted_uuid = url_checkCompleted + data.uuid
        })

        // execute if execution-request failed
        .catch(function (resp) {
            showError(indicator_id_executed);
            showError(indicator_id_completed);
            $('#error-msg').html("Connection failed.<br>")
        })

        .then(function () {

            // only check on completion if the execution was successful
            if (execution) {

                $.when(sendAjax("GET", url_checkCompleted_uuid, token))

                    // execute if the response was received
                    .then(function (data, textStatus, jqXHR) {

                        if (data.completed == true) {
                            showSuccess(indicator_id_completed);
                            $('#success-msg').html("Execution completed.<br>")
                        } else {
                            showError(indicator_id_completed);
                            $('#error-msg').append("Not completed.<br>")
                        }

                        // update history
                        getCurrentState();
                        
                        // enable button for further executions
                        $(btn).prop('disabled', false);

                    })

                    // execute if completion-request failed
                    .catch(function (resp) {
                        showError(indicator_id_completed);
                        $('#error-msg').append("Connection failed.<br>")

                        // enable button for further executions
                        $(btn).prop('disabled', false);
                    });

            } else {
                // enable button for further executions
                $(btn).prop('disabled', false);
            }
        })
}


function slugify(str) {
    str = str.replace(/^\s+|\s+$/g, '');

    // Make the string lowercase
    str = str.toLowerCase();

    // Remove accents, swap ñ for n, etc
    var from = "ÁÄÂÀÃÅČÇĆĎÉĚËÈÊẼĔȆÍÌÎÏŇÑÓÖÒÔÕØŘŔŠŤÚŮÜÙÛÝŸŽáäâàãåčçćďéěëèêẽĕȇíìîïňñóöòôõøðřŕšťúůüùûýÿžþÞĐđßÆa·/_,:;";
    var to = "AAAAAACCCDEEEEEEEEIIIINNOOOOOORRSTUUUUUYYZaaaaaacccdeeeeeeeeiiiinnooooooorrstuuuuuyyzbBDdBAa------";
    for (var i = 0, l = from.length; i < l; i++) {
        str = str.replace(new RegExp(from.charAt(i), 'g'), to.charAt(i));
    }

    // Remove invalid chars
    str = str.replace(/[^a-z0-9 -]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');

    return str;
}