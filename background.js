const OPENU_MY_COURSES_URL =
  "https://sheilta.apps.openu.ac.il/pls/dmyopt2/course_info.courses";

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "fetchData" && message.url) {
    console.log("Fetching data from:", message.url);

    fetch(message.url)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.arrayBuffer(); // Get the response as an ArrayBuffer
      })
      .then((buffer) => {
        // Use TextDecoder to decode the buffer
        const decoder = new TextDecoder("windows-1255"); // Use "utf-8" or another encoding like "windows-1255"
        const decodedText = decoder.decode(buffer);

        // Extract "נקודות זכות" using regex
        const creditPoints =
          parseInt(
            decodedText.match(/\d+ נקודות זכות/)?.[0].match(/\d+/)?.[0],
            10
          ) || null;

        sendResponse({ success: true, creditPoints });
      })
      .catch((error) => {
        console.error("Fetch or decoding error:", error);
        sendResponse({
          success: false,
          error: error.message,
        });
      });

    return true; // Keeps the message channel open for async response
  }
});

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
