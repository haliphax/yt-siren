// ==UserScript==
// @name         YT Siren
// @namespace    https://roadha.us
// @version      0.3
// @description  Reports current YouTube video and chapter on change
// @author       haliphax
// @match        https://www.youtube.com/watch?v=*
// @icon         https://www.google.com/s2/favicons?domain=youtube.com
// @grant        GM_registerMenuCommand
// @grant        GM_setValue
// @grant        GM_getValue
// ==/UserScript==

(async () => {
    'use strict';

    let sirenUrl = GM_getValue('sirenUrl', 'http://localhost:8008', 'u'),
        sirenPassword = GM_getValue('sirenPassword', 'changeme', 'p');

    GM_registerMenuCommand(
        'Settings',
        () => {
            sirenUrl = prompt('Siren URL:', sirenUrl);
            sirenPassword = prompt('Siren password:', sirenPassword);
            GM_setValue('sirenUrl', sirenUrl);
            GM_setValue('sirenPassword', sirenPassword);
        });

    const extract = RegExp('[?&]v=([^&]+)', 'i');

    let channelTitle = null,
        songTitle = null,
        chapterTitle = null;

    const update = async () => {
        await fetch(sirenUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json;charset=utf-8'
            },
            body: JSON.stringify({
                pwd: sirenPassword,
                channel: channelTitle,
                song: songTitle,
                chapter: chapterTitle,
                url: window.location.href,
            }),
        });
        console.log(channelTitle);
        console.log(songTitle);
    };

    const fetchSongTitle = async (act) => {
        const songId = extract.exec(window.location.href)[1];

        songTitle = document.querySelector('h1.title:not(.meta)').innerText;
        fetchChapterTitle(false);

        if (act === false) return;

        await update();
    };

    const fetchChapterTitle = async (act) => {
        chapterTitle = document.querySelector('.ytp-chapter-title-content').innerText;

        if (act === false) return;

        fetchSongTitle(false);
        await update();
    };

    const fetchChannelTitle = async (act) => {
        channelTitle = document.querySelector('yt-formatted-string.ytd-channel-name .yt-formatted-string').innerText;

        if (act === false) return;

        fetchChapterTitle(false);
        await update();
    };

    const init = async () => {
        const channel = document.querySelector('#upload-info a.yt-formatted-string:first-of-type'),
            video = document.querySelector('#info-contents h1'),
            chapter = document.querySelector('.ytp-chapter-title-content');

        if (channel === null || video === null) {
            setTimeout(init, 100);
            return;
        }

        new MutationObserver(fetchChannelTitle).observe(
            channel, { childList: true, subtree: true });
        new MutationObserver(fetchSongTitle).observe(
            video, { childList: true, subtree: true });
        new MutationObserver(fetchChapterTitle).observe(
            chapter, { childList: true, subtree: true });

        await fetchChannelTitle(false);
        await fetchSongTitle(false);

        if (channelTitle === null || songTitle === null) {
            setTimeout(init, 100);
            return;
        }

        console.log('YT Siren: active');
        await fetchChannelTitle();
    };

    await init();
})();