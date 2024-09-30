const OPENU_MY_COURSES_URL =
  "https://sheilta.apps.openu.ac.il/pls/dmyopt2/course_info.courses";

chrome.action.onClicked.addListener((tab) => {
  chrome.tabs.update(tab.id, { url: OPENU_MY_COURSES_URL });

  chrome.tabs.onUpdated.addListener(function tabUpdateListener(
    tabId,
    changeInfo,
    updatedTab
  ) {
    if (tabId === tab.id && changeInfo.status === "complete") {
      chrome.tabs.get(tabId, function (tabInfo) {
        if (tabInfo.url.startsWith(OPENU_MY_COURSES_URL)) {
          // Inject the content script into the tab
          chrome.scripting.executeScript({
            target: { tabId: tabId },
            files: ["content.js"],
          });
        } else {
          // User might not be logged in, handle accordingly
          chrome.scripting.executeScript({
            target: { tabId: tabId },
            func: () => {
              alert(
                "Please log in to your Open University account, then re-run the extension."
              );
            },
          });
        }
        chrome.tabs.onUpdated.removeListener(tabUpdateListener);
      });
    }
  });
});
