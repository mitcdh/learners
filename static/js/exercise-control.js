function showLoading(id) {
    $(id).stop(true, true)
        .removeClass('failed')
        .removeClass('success')
        .addClass('loading')
        .show();
}

function showSuccess(id) {
    $(id).stop(true, true)
        .removeClass('loading')
        .removeClass('failed')
        .addClass('success')
        .show();
}

function showError(id) {
    $(id).stop(true, true)
        .removeClass('loading')
        .removeClass('success')
        .addClass('failed')
        .show();
}

function getCurrentState() {
    $.ajax({
        type: "GET",
        url: url_getCurrentState,
        crossDomain: true,
        headers: { "Authorization": "Bearer " + token },
        success: function (data) {
            console.log(data)
            if (data.script_executed) {
                showSuccess(indicator_id_executed)
            } else {
                showError(indicator_id_executed)
            }
            if (data.completed) {
                showSuccess(indicator_id_completed)
            } else {
                showError(indicator_id_completed)
            }

            printHistory(data.history)

        },
        error: function (jqXHR, textStatus, errorThrown) {
            showError(indicator_id_executed)
            showError(indicator_id_completed)
        }
    });
}

function printHistory(history) {

    var tbl_body = "<table id='history-table'>"
    console.log(tbl_body)
    var header = "<tr> <th>Exercise started</th> <th>Response received</th> <th>Completed</th> </tr>"
    console.log(tbl_body)
    tbl_body += header
    console.log(tbl_body)
    
    $.each(history, function() {
        var tbl_row = "";
        $.each(this, function(key , value) {
            if (key == "completed") {
                if (Boolean(value)) {
                    value = "succeded";
                } else {
                    value = "failed";
                }
            }
            if (value == null) {
                value = "no response"
            }
            tbl_row = "<td>" + value + "</td>" + tbl_row;
        });
        tbl_body += "<tr>" + tbl_row + "</tr>";
        console.log(tbl_body)
    });
    
    tbl_body += "</table>"
    console.log(tbl_body)

    $("#history").html(tbl_body);
    
}

function sendAjax(type, url, token, indicator) {
    let promise = new Promise((resolve, reject) => {
        $.ajax({
            type: type,
            url: url,
            crossDomain: true,
            headers: { "Authorization": "Bearer " + token },
            success: function (data) {
                console.log(data)
                resolve(data)
            },
            error: function (jqXHR, textStatus, errorThrown) {
                reject(jqXHR, textStatus, errorThrown)
            }
        })
    })
    return promise
}

function executeAndCheck(token, url_executeExercise, indicator_id_executed, url_checkCompleted, indicator_id_completed) {

    let execution = false;
    let completed = false;
    let connection = true;
    let uuid = "";
    let url_checkCompleted_uuid = "";

    $.when(sendAjax("POST", url_executeExercise, token, indicator_id_executed))
        .then(function (data, textStatus, jqXHR) {
            if (data.executed == true) {
                // connection: ok
                // executed: ok
                console.log(data);
                showSuccess(indicator_id_executed);
                execution = true
            } else {
                // connection: ok
                // executed: fail
                console.log(data);
                showError(indicator_id_executed);
                showError(indicator_id_completed);
                $('#error-msg').html("Execution failed.<br>")
            }
            uuid = data.uuid
            url_checkCompleted_uuid = url_checkCompleted + uuid
        })
        .catch(function (resp) {
            // connection: failed
            connection = false;
            console.log(resp.status);
            console.log(resp.statusText);
            console.log(resp.responseJSON);
            showError(indicator_id_executed);
            showError(indicator_id_completed);
            $('#error-msg').html("Connection failed.<br>")
        })
        .then(function () {
            console.log("url_checkCompleted_uuid: " + url_checkCompleted_uuid)
            $.when(sendAjax("GET", url_checkCompleted_uuid, token, indicator_id_completed))
                .then(function (data, textStatus, jqXHR) {
                    if (data.completed == true) {
                        // connection: ok
                        // completed: ok
                        console.log(data);
                        if (execution) {
                            completed = true;
                            showSuccess(indicator_id_completed);
                            $('#success-msg').html("Execution completed.<br>")
                        }
                    } else {
                        // connection: ok
                        // completed: fail
                        console.log(data);
                        showError(indicator_id_completed);
                        if (connection) {
                            $('#error-msg').append("Not completed.<br>")
                        }
                    }
                    getCurrentState();
                })
                .catch(function (resp) {
                    // connection: failed
                    connection = false;
                    console.log(resp.status);
                    console.log(resp.statusText);
                    console.log(resp.responseJSON);
                    showError(indicator_id_completed);
                    $('#error-msg').append("Connection failed.<br>")
                });
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