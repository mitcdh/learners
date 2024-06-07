
function editDrawIO(event, button_element) {
  event.preventDefault();
  const drawio_obj = $(button_element).closest(".drawio-previewer").find(".drawio-object")[0];
  DiagramEditor.editElement(drawio_obj)
}

function resetDrawIO(event, button_element, original_data) {
  const drawio_obj = $(button_element).closest(".drawio-previewer").find(".drawio-object")[0];
  $(drawio_obj).attr('data', original_data);
  event.preventDefault();
}

function setRiskValue(elem) {
  const cell = $(elem)[0].target
  
  var rowIndex = $(cell).parent().index() - 1;
  var colIndex = $(cell).index();
  const valueText = `Likelihood: ${rowIndex}; Impact: ${colIndex}; Risk: ${cell.textContent}`

  const riskValue = $(cell).closest(".risk-wrapper").find(".risk-value")
  riskValue.val(valueText)
  
  const riskTable = $(cell).closest(".risk-table")
  $(riskTable).find("tr td").removeClass("selected")
  $(cell).addClass("selected")
}

$(function () {
  $(".risk-table tr td").on('click', (elem) => {
    setRiskValue(elem)
  })
})