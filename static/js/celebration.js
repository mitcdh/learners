async function celebrate(child_id) {
  try {
    child_elem = $(`#${ child_id }`)
  } catch (e) {
    child_elem = $(`${ child_id }`)
  }

  const form_elem = child_elem.is('form') ? child_elem : child_elem.closest('form');
  enabled_celebration = form_elem.attr("celebrate") ? JSON.parse(form_elem.attr("celebrate").toLowerCase()) : false;

  if (!enabled_celebration) return;

  const defaults = {
    spread: 360,
    ticks: 100,
    gravity: 0,
    decay: 0.94,
    startVelocity: 30,
  };

  function shoot() {
    confetti({
      ...defaults,
      particleCount: 60,
      scalar: 1.2,
      shapes: ["circle", "square"],
      colors: ["#a864fd", "#29cdff", "#78ff44", "#ff718d", "#fdff6a"],
    });

    confetti({
      ...defaults,
      particleCount: 20,
      scalar: 2,
      shapes: ["emoji"],
      shapeOptions: {
        emoji: {
          value: ["🦄", "🌈"],
        },
      },
    });
  }

  setTimeout(shoot, 0);
  setTimeout(shoot, 100);
  setTimeout(shoot, 200);
  setTimeout(shoot, 400);

}
