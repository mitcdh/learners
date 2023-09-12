

function isEmpty(td) {
    if (
        td.text == '' || 
        td.text() == ' ' || 
        $(td).html() == "<br>" || 
        td.html() == '&nbsp;' || 
        td.html() == undefined || 
        td.is(':empty') || 
        td.is(":not(:visible)")
        ) {
          return true;
    }            
    return false;
  }
  
  function initTableDetection(row, cm) {
    $(row).find("td").focusout(() => {
      detectFullTable($(event.target).closest("table"), cm)
    })
  }
  
  function detectFullTable(table_obj, cm) {
    const tds = $(table_obj).find("tr:last td")
    const trs = $(table_obj).find("tr").not("tr:last").not("tr:first")
    let tableBody = $(table_obj).find('tbody').first();
  
    let empty_row = true
    let new_row_template = "<tr>"
  
    $.each(tds, (i, cell) => {
      new_row_template += "<td contenteditable='true'>&nbsp;</td>"
      if (isEmpty($(cell)) === false) empty_row = false
    });
  
    new_row_template += "</tr>"
  
    // Append new empty row
    if (!empty_row) {
      $(tableBody).append(new_row_template)
      $(tableBody).find("tr:last td")
      .wrapInner('<div style="display: none;" />')
      .parent()
      .find("td > div")
      .slideDown(700, function () {
        var $set = $(this);
        $set.replaceWith($set.contents());
      });
      $(tableBody).slideDown();
      initTableDetection($(tableBody).find("tr:last"), cm)
    }
  
    // Remove empty rows
    $.each(trs, (i, row) => {
      let trIsEmpty = true
  
      $.each($(row).find("td"), (i, cell) => {
        if (isEmpty($(cell)) === false)  {
          trIsEmpty = false;   
         }
      });
      if (trIsEmpty) {
        $(row).children('td')
        .animate({'padding-top' : 0, 'padding-bottom' : 0})
        .wrapInner('<div />') 
        .children()
        .slideUp(function(){
          $(this).closest('tr').remove();
        });
      }
    });
  
  }


  function caseClickHandler(case_obj) {
    if (!$(event.target).hasClass('input') && !$(event.target).parent().first().hasClass('input') && !$(event.target).hasClass('delete-row')) {
        $(case_obj).toggleClass('active');
        $(case_obj).parent().find('.arrow').toggleClass('arrow-animate');
        $(case_obj).parent().find('.content').slideToggle(280);
      }
    if ($(event.target).hasClass('delete-row')) {
        if ($(case_obj).parent().parent().find(".case-container").length > 1) {
            $(case_obj).parent().slideUp(function() {
                const global_exercise_id = $(case_obj).closest("form").attr("id")
                console.log(global_exercise_id)
                $(this).remove();
                persistForm(global_exercise_id)
            });
        }
        console.log($(case_obj).parent().parent().find(".case-container").length > 1)
      }

  }

  function addCaseHandler(cm) {
    const cases = $(cm).find('#cases .case-container')
    const current_count = cases.length

    // Close all cases
    $(cases).find(".head").removeClass('active')
    $(cases).find(".head").parent().find('.arrow').removeClass('arrow-animate');
    $(cases).find(".head").parent().find('.content').slideUp(280)
    
    const case_base = $(cases).first()
    const case_container = $(cm).find('#cases fieldset').first()

    // Clone first case
    let new_case = $(case_base).clone().css("display", "none")
    $(new_case).find(".head").parent().find('.content').hide()

    // Clear all inputs
    const input_fields = $(new_case).find(".input").not(".divider")
    $.each(input_fields, (i, input_field) => {
        $(input_field).val("")

        // Update name
        const current_name = $(input_field).attr("name")
        $(input_field).attr("name", `${current_name} (${current_count + 1})`);
        $(new_case).find(`label[for="${current_name}"]`).attr("for", `${current_name} (${current_count + 1})`);
      });

    // Clear all input tables
    const input_tables = $(new_case).find(".editable-table")
    $.each(input_tables, (i, input_table) => {

        const input_table_cells = $(input_table).find("td[contenteditable=true]")
        $.each(input_table_cells, (i, input_table_cell) => {
            $(input_table_cell)
                // Clear table
                .text("")
                // Add automatic clearing function
                .focusout(() => {
                    detectFullTable($(event.target).closest("table"), cm)
                })

            // Remove empty table rows
            detectFullTable($(input_table_cell).closest("table"), cm)
        });
        
        // Update name
        const current_name = $(input_table).attr("name")
        $(input_table).attr("name", `${current_name} (${current_count + 1})`);
        $(new_case).find(`label[for="${current_name}"]`).attr("for", `${current_name} (${current_count + 1})`);
        
    })

    // Allow case to be opened
    $(new_case).find('.head').click(function(){ caseClickHandler(this) });
    
    // Write to dom
    $(case_container).append(new_case)
    $(new_case).slideDown();

  }
  
  function initCaseManagement() {
    const cm = $('.case-management-container')
    
    // Init case opening functionalities
    $(cm).find('.head').click(function(){
        caseClickHandler(this)
    });
    $(".editable-table tr td").focusout(() => {
      detectFullTable($(event.target).closest("table"), cm)
    })

    // Init button handler
    $(cm).find('.add-case').click(function(){
        addCaseHandler(cm)
    })
  }