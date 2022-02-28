$(function () {
  let url_token = $(location).attr("search").split("?auth=")[1];

  // Set cookie if present in query-string
  if (url_token) {
    // function definition in "token-handling.js"
    setCookie("auth", url_token, 1);
  }
});
