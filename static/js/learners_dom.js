function findHiddenValueByPageId(obj, targetPageId) {
  for (const key in obj) {
    const currentObj = obj[key];

    if (currentObj.page_id === targetPageId) {
      return currentObj.hidden;
    }

    if (typeof currentObj.childs === "object") {
      const hiddenValue = findHiddenValueByPageId(
        currentObj.childs,
        targetPageId
      );
      if (hiddenValue !== undefined) {
        return hiddenValue;
      }
    }
  }
  return undefined;
}

function showHidePages() {
  let pages = {};
  sendAjax("GET", { url: `/pages` })
    .then(function (data, textStatus, jqXHR) {
      pages = data.pages;

      const menuItems = document.querySelectorAll(".page-control");
      for (let i = 0; i < menuItems.length; i++) {
        const menuItem = menuItems[i];

        let hidden = findHiddenValueByPageId(pages, menuItem.id);
        if (hidden) {
          $(menuItem).slideUp(250, () => {
            menuItem.classList.add("hidden");
          });
        } else {
          menuItem.classList.remove("hidden");
          $(menuItem).slideDown(400);
        }
      }
    })
    .catch(function (jqXHR, textStatus, errorThrown) {
      console.log(jqXHR, textStatus, errorThrown);
    });
}
