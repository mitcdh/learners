function establishSSEConnection(endpoint) {
  new_sse = new EventSource(endpoint);
  new_sse.addEventListener("newContent", function (event) {
    showHidePages()
  });

  new_sse.onerror = function (event) {
    console.error("SSE Connection Error", event);
  };
  return new_sse;
}

function closeSSEConnection(see) {
  sse.close();
}
