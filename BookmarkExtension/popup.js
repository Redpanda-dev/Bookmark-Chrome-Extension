import { getActiveTabURL } from "./utils.js"

// adding a new bookmark row to the popup
const addNewBookmark = (bookmarks, bookmark) => {
    const bookmarkTitleElement = document.createElement("div");
    const newBookmarkElement = document.createElement("div");
    const controlsElement = document.createElement("div");

    bookmarkTitleElement.textContent = bookmark.desc;
    bookmarkTitleElement.className = "bookmark-title";

    controlsElement.className = "bookmark-controls";

    newBookmarkElement.id = "bookmark-" + bookmark.time;
    newBookmarkElement.className = "bookmark";
    newBookmarkElement.setAttribute("timestamp", bookmark.time);

    setBookmarkAttributes("play", onPlay, controlsElement);
    setBookmarkAttributes("delete", onDelete, controlsElement);

    newBookmarkElement.appendChild(bookmarkTitleElement);
    newBookmarkElement.appendChild(controlsElement);
    bookmarks.appendChild(newBookmarkElement);
};

const viewBookmarks = (currentBookmarks = []) => {
    const bookmarksElement = document.getElementById("bookmarks");
    bookmarksElement.innerHTML = "";

    if (currentBookmarks.length > 0) {
        for (let i = 0; i < currentBookmarks.length; i++) {
            const bookmark = currentBookmarks[i];
            addNewBookmark(bookmarksElement, bookmark);
        }
      } else {
        bookmarksElement.innerHTML = '<i class="row">No bookmarks to show</i>';
      }
    
      return;
};

const onPlay = async e => {
    const bookmarkTime = e.target.parentNode.parentNode.getAttribute("timestamp");
    const activeTab = await getActiveTabURL();

    chrome.tabs.sendMessage(activeTab.id, {
        type: "PLAY",
        value: bookmarkTime
    })
};

const onDelete = async e => {
    const activeTab = await getActiveTabURL();
    const bookmarkTime = e.target.parentNode.parentNode.getAttribute("timestamp");
    const bookmarkElementToDelete = document.getElementById("bookmark-"+bookmarkTime)

    bookmarkElementToDelete.parentNode.removeChild(bookmarkElementToDelete);

    chrome.tabs.sendMessage(activeTab.id, {
        type: "DELETE",
        value: bookmarkTime
    }, viewBookmarks);
};

const setBookmarkAttributes = (src, eventListener, controlParentElement) => {
    const controlElement = document.createElement("img");

    controlElement.src = "assets/" + src + ".png";
    controlElement.title = src;
    controlElement.addEventListener("click", eventListener);
    controlParentElement.appendChild(controlElement);
};



document.addEventListener("DOMContentLoaded", async () => {
    const activeTab = await getActiveTabURL();
    const queryParameters = activeTab.url.split("?")[1];
    const urlParameters = new URLSearchParams(queryParameters);

    const currrentVideo = urlParameters.get("v");

    if(activeTab.url.includes("youtube.com/watch") && currrentVideo){
        chrome.storage.sync.get([currrentVideo], (data) => {
            const currentVideoBookmarks = data[currrentVideo] ? JSON.parse(data[currrentVideo]) : [];

            // viewBookmarks
            viewBookmarks(currentVideoBookmarks);
            //console.log("Youtube open", currentVideoBookmarks)

        })
    } else {
        if(activeTab.url == "https://www.youtube.com/") {
            displayAllBookmarks();

        } else {
            const container = document.getElementsByClassName("container")[0];
            container.innerHTML = '<div class="title">This is a not a YouTube video page.</div>';
        }
    }
});

const displayAllBookmarks = () => {
    chrome.storage.sync.get(null, (data) => {
        let videos = {}; // To store unique videos
        for (const [key, value] of Object.entries(data)) {
            try {
                const bookmarks = JSON.parse(value);
                //console.log(bookmarks.title)
                const videoIdentifier = bookmarks[0].title + " " + bookmarks[0].owner; // Assuming the first bookmark contains the videoId
                if (!videos[videoIdentifier]) {
                    videos[videoIdentifier] = bookmarks[0]; // Store only the first bookmark of each video
                }
            } catch (error) {
                console.error("Error parsing bookmarks for key:", key, error);
            }
        }
        
        // Display all unique videos
        const container = document.getElementsByClassName("container")[0];
        if (Object.keys(videos).length > 0) {
            for (const videoId in videos) {
                const bookmark = videos[videoId];
                const videoElement = document.createElement("div");

                // Add event listener to the videoElement div
                videoElement.addEventListener("click", function() {
                    window.open(bookmark.link, '_blank'); // Open link in new tab when clicked
                });

                const bookmarkElement = document.createElement("div");
                bookmarkElement.className = "bookmark";
                bookmarkElement.innerHTML = `
                    <p><strong>Title:</strong> ${bookmark.title}</p>
                    <p><strong>Owner:</strong> ${bookmark.owner}</p>
                `;
                videoElement.appendChild(bookmarkElement);
                container.appendChild(videoElement);
            }
        } else {
            container.innerHTML = '<div class="title">No bookmarks found.</div>';
        }
    });
};
