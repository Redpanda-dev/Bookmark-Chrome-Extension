(() => {
    //https://www.youtube.com/watch?v=0n809nd4Zu4
    let youtubeLeftControls, youtubePlayer;
    let currentVideo = "";
    let currentVideoBookmarks = [];


    chrome.runtime.onMessage.addListener((obj, sender, response) => {
        const { type, value, videoId } = obj;

        if(type == "NEW"){
            currentVideo = videoId;
            newVideoLoaded();
        } else if (type == "PLAY"){
            youtubePlayer.currentTime = value
        } else if (type == "DELETE"){
            currentVideoBookmarks = currentVideoBookmarks.filter((b) => b.time != value);
            chrome.storage.sync.set({ [currentVideo]: JSON.stringify(currentVideoBookmarks)});
            response(currentVideoBookmarks);
        }
    });

    const fetchBookmarks = () => {
        return new Promise((resolve) => {
            chrome.storage.sync.get([currentVideo], (obj) => {
              resolve(obj[currentVideo] ? JSON.parse(obj[currentVideo]) : []);
            });
        });
    }

    const getTime = t => {
        var date = new Date(0);
        date.setSeconds(t);
    
        return date.toISOString().substr(11, 8);
    }

    const newVideoLoaded = async () => {
        addBookmarkButton();
        await loadVideoMetadata();
        currentVideoBookmarks = await fetchBookmarks();
    };

    const addBookmarkButton = () => {
        const bookmarkBtnExists = document.querySelector(".ytp-right-controls .bookmark-btn");
        if (!bookmarkBtnExists) {
            const bookmarkBtn = document.createElement("img");
            bookmarkBtn.src = chrome.runtime.getURL("assets/bookmark.png");
            bookmarkBtn.className = "ytp-button bookmark-btn";
            bookmarkBtn.title = "Click to bookmark current timestamp";
    
            youtubeLeftControls = document.getElementsByClassName("ytp-right-controls")[0];
            youtubePlayer = document.getElementsByClassName("video-stream")[0];
    
            youtubeLeftControls.insertBefore(bookmarkBtn, youtubeLeftControls.children[1]); // Adds the button to the left side of the controls
            bookmarkBtn.addEventListener("click", addNewBookmarkEventHandler);
        }
    };

    const loadVideoMetadata = async () => {
        await new Promise(resolve => {
            const observer = new MutationObserver(() => {
                const videoTitleElement = document.querySelector('div#info-contents h1.title');
                const videoOwnerElement = document.querySelector('ytd-video-owner-renderer #text-container yt-formatted-string a');
                if (videoTitleElement && videoOwnerElement) {
                    videoTitle = videoTitleElement.textContent;
                    videoOwner = videoOwnerElement.textContent;
                    observer.disconnect();
                    resolve();
                }
            });
            observer.observe(document.body, { childList: true, subtree: true });
        });
    
        console.log(videoTitle + " " + videoOwner); // DEBUGGING
    };

    const addNewBookmarkEventHandler = async () => {
        const currentTime = youtubePlayer.currentTime;
        const newBookmark = {
            time: currentTime,
            title: videoTitle,
            owner: videoOwner, 
            desc: "Bookmark at " + getTime(currentTime),
            link: window.location.href
        };

        currentVideoBookmarks = await fetchBookmarks();
        //console.log(newBookmark);

        chrome.storage.sync.set({
            [currentVideo]: JSON.stringify([...currentVideoBookmarks, newBookmark].sort((a, b) => a.time - b.time))
          });
    }

    newVideoLoaded();
})();

