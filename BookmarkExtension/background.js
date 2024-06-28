/**
 * Listens for updates to the tabs in the Chrome browser and sends a message to the content script
 * if the updated tab's URL contains "youtube.com/watch".
 *
 * @param {number} tabId - The ID of the updated tab.
 * @param {object} tab - The updated tab object.
 */
chrome.tabs.onUpdated.addListener((tabId, tab) => {
    if(tab.url && tab.url.includes("youtube.com/watch")) {
        const queryParameters = tab.url.split("?")[1];
        const urlParameters = new URLSearchParams(queryParameters);

        chrome.tabs.sendMessage(tabId, {
            type: "NEW",
            videoId: urlParameters.get("v"),
        });
    }
})