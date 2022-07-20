// Risk Calculation

function calcRiskValue(element) {
  let risk_id = element.id.split("_")[1]
  let likelihood_value = $(`#likelihood_${risk_id}`)[0].value;
  let impact_value = $(`#impact_${risk_id}`)[0].value;
  $(`#risk_${risk_id}`)[0].value =
    parseInt(likelihood_value.slice(0, 1)) * parseInt(impact_value.slice(0, 1));
}
