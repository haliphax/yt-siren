// ==UserScript==
// @name         YT Siren
// @author       haliphax
// @description  Reports current YouTube video and chapter on change
// @grant        GM_getValue
// @grant        GM_registerMenuCommand
// @grant        GM_setValue
// @icon         https://www.google.com/s2/favicons?domain=youtube.com
// @match        https://music.youtube.com/
// @match        https://music.youtube.com/watch?v=*
// @match        https://www.youtube.com/watch?v=*
// @namespace    https://roadha.us
// @version      0.7
// ==/UserScript==

(async () => {
    "use strict";

    let sirenUrl = GM_getValue("sirenUrl", "http://localhost:8008", "u"),
        sirenPassword = GM_getValue("sirenPassword", "changeme", "p");

    GM_registerMenuCommand(
        "Settings",
        () => {
            sirenUrl = prompt("Siren URL:", sirenUrl);
            sirenPassword = prompt("Siren password:", sirenPassword);
            GM_setValue("sirenUrl", sirenUrl);
            GM_setValue("sirenPassword", sirenPassword);
        });

    const extract = RegExp("[?&]v=([^&]+)", "i");

    let channelTitle = null,
        songTitle = null,
        chapterTitle = null,
        songId = null;

    const update = async () => {
        await fetch(sirenUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json;charset=utf-8"
            },
            body: JSON.stringify({
                pwd: sirenPassword,
                channel: channelTitle,
                song: songTitle,
                chapter: chapterTitle,
                url: `https://youtu.be/${songId}`,
            }),
        });

        console.log(channelTitle);
        console.log(songTitle);
    };

    const fetchSongTitle = async (act) => {
        songId = extract.exec(window.location.href)[1];
        songTitle = document.querySelector(
            window.location.hostname === "music.youtube.com"
                ? ".content-info-wrapper.ytmusic-player-bar "
                    + "yt-formatted-string.title"
                : "h1.title:not(.meta)"
        ).innerText;

        fetchChapterTitle(false);

        if (act === false) return;

        await update();
    };

    const fetchChapterTitle = async (act) => {
        chapterTitle = document.querySelector(".ytp-chapter-title-content")
            .innerText;

        if (act === false) return;

        fetchSongTitle(false);
        await update();
    };

    const fetchChannelTitle = async (act) => {
        channelTitle = document.querySelector(
            window.location.hostname === "music.youtube.com"
                ? "yt-formatted-string.byline.ytmusic-player-bar "
                    + "a.yt-simple-endpoint.yt-formatted-string:first-child"
                : "yt-formatted-string.ytd-channel-name .yt-formatted-string"
        ).innerText;

        if (act === false) return;

        fetchChapterTitle(false);
        await update();
    };

    // www.youtube.com
    const initStandard = async () => {
        const channel = document.querySelector(
            "#upload-info a.yt-formatted-string:first-of-type"
        );
        const video = document.querySelector("#info-contents h1");
        const chapter = document.querySelector(".ytp-chapter-title-content");

        if (channel === null || video === null) {
            setTimeout(initStandard, 100);
            return;
        }

        new MutationObserver(fetchChannelTitle).observe(
            channel, { childList: true, subtree: true }
        );
        new MutationObserver(fetchSongTitle).observe(
            video, { childList: true, subtree: true }
        );
        new MutationObserver(fetchChapterTitle).observe(
            chapter, { childList: true, subtree: true }
        );

        await fetchChannelTitle(false);
        await fetchSongTitle(false);

        if (channelTitle === null || songTitle === null) {
            setTimeout(initStandard, 100);
            return;
        }

        console.log("YT Siren: active (standard)");

        await fetchChannelTitle();
    };

    // music.youtube.com
    const initMusic = async () => {
        const song = document.querySelector(
            ".content-info-wrapper.ytmusic-player-bar yt-formatted-string.title"
        );
        const artist = document.querySelector(
            "yt-formatted-string.byline.ytmusic-player-bar "
            + "a.yt-simple-endpoint.yt-formatted-string:first-child"
        );

        if (song === null || artist === null) {
            setTimeout(initMusic, 100);
            return;
        }

        await fetchChannelTitle(false);
        await fetchSongTitle(false);

        if (channelTitle === null || songTitle === null) {
            setTimeout(initMusic, 100);
            return;
        }

        new MutationObserver(fetchChannelTitle).observe(
            artist, { childList: true, subtree: true });
        new MutationObserver(fetchSongTitle).observe(
            song, { childList: true, subtree: true });

        console.log("YT Siren: active (ytmusic)");

        await fetchChannelTitle();
    };

    console.log("YT Siren: starting up");
    window.location.hostname === "music.youtube.com"
        ? initMusic()
        : initStandard();
})();