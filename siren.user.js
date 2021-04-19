// ==UserScript==
// @name         YT Siren
// @namespace    https://roadha.us
// @version      0.2
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

    let songTitle = null,
        chapterTitle = null,
        songUrl = null;

    const update = async () => {
        await fetch(sirenUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json;charset=utf-8'
            },
            body: JSON.stringify({
                pwd: sirenPassword,
                song: songTitle,
                chapter: chapterTitle,
                url: songUrl,
            }),
        });
        console.log(songTitle);
        console.log(songUrl);
    };

    const fetchSongTitle = async (act) => {
        const songId = extract.exec(window.location.href)[1];

        songTitle = document.querySelector('h1.title:not(.meta)').innerText;
        fetchChapterTitle(false);

        if (act === false) return;

        songUrl = `https://youtu.be/${songId}`;

        await update();
    };

    const fetchChapterTitle = async (act) => {
        chapterTitle = document.querySelector('.ytp-chapter-title-content').innerText;

        if (act === false) return;

        fetchSongTitle(false);
        await update();
    };

    const init = async () => {
        const video = document.querySelector('h1.title:not(.meta)'),
            chapter = document.querySelector('.ytp-chapter-title-content');

        if (video === null || chapter === null) {
            setTimeout(init, 1000);
            return;
        }

        new MutationObserver(fetchSongTitle).observe(
            video, { childList: true, subtree: true });
        new MutationObserver(fetchChapterTitle).observe(
            chapter, { childList: true, subtree: true });
        console.log('YT Siren: active');
        await fetchSongTitle();
    };

    await init();
})();