/*
 * Pick up a new deploy without anyone pressing refresh.
 *
 * Bell Ninja is a page people leave open all day, so a tab opened at 8am would
 * otherwise keep running the code it loaded at 8am no matter what is published
 * afterwards. This polls version.txt and reloads once when it changes.
 *
 * The version it compares against is the ?v= stamp on this script's own tag,
 * written by tools/release.js -- so there is no constant to keep in sync.
 */
(function () {
    'use strict';

    var POLL_MS = 5 * 60 * 1000;
    var SEEN_KEY = 'bell-ninja-reloaded-for';

    if (!window.fetch) { return; }

    function ownTag() {
        if (document.currentScript) { return document.currentScript; }
        var all = document.getElementsByTagName('script');
        for (var i = all.length - 1; i >= 0; i--) {
            if (/check-for-updates\.js/.test(all[i].src)) { return all[i]; }
        }
        return null;
    }

    var tag = ownTag();
    var stamped = tag && tag.src.match(/[?&]v=([^&]*)/);
    var running = stamped && stamped[1];

    /* Unstamped means a local copy that has never been released. Nothing to
     * compare against, so stay out of the way. */
    if (!running) { return; }

    function alreadyReloadedFor(version) {
        /* Reload at most once per version. The HTML itself is cached for ten
         * minutes, so a reload can come back still announcing the old stamp;
         * without this the page would reload over and over. If storage is
         * unavailable we simply never reload -- a missed update is much
         * cheaper than a reload loop. */
        try {
            if (window.sessionStorage.getItem(SEEN_KEY) === version) { return true; }
            window.sessionStorage.setItem(SEEN_KEY, version);
            return false;
        } catch (err) {
            return true;
        }
    }

    function check() {
        fetch('/version.txt', { cache: 'no-store' })
            .then(function (response) { return response.ok ? response.text() : null; })
            .then(function (body) {
                if (!body) { return; }
                var latest = body.trim();
                if (!latest || latest === running) { return; }

                /* Don't yank a panel out from under someone reading it; the
                 * next poll will catch them. */
                if (document.querySelector('section.bl-expand, .bl-panel-items-show')) { return; }

                if (alreadyReloadedFor(latest)) { return; }
                window.location.reload();
            })
            .catch(function () { /* offline or blocked: try again next time */ });
    }

    setInterval(check, POLL_MS);
    document.addEventListener('visibilitychange', function () {
        if (!document.hidden) { check(); }
    });
})();
