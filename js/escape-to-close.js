/*
 * Escape closes whatever is open.
 *
 * Rather than reimplement each thing's close logic, this finds the close
 * control that is already on screen and clicks it -- so the panel animation,
 * the class toggling in Boxlayout and the modal's own inline handler all run
 * exactly as they do when you click the control yourself.
 *
 * Ordered innermost first, so Escape peels one layer at a time instead of
 * shutting everything at once.
 */
(function () {
    'use strict';

    var LAYERS = [
        /* The login modal, shown by setting display:block on #id01. */
        { host: '#id01', close: '.close' },
        /* The "Misc." sheet that slides up over an expanded panel. */
        { host: '.bl-panel-items.bl-panel-items-show', close: 'nav > .bl-icon-close' },
        /* An expanded schedule / lunch / help panel. */
        { host: 'section.bl-expand', close: '.bl-icon-close' }
    ];

    function onScreen(el) {
        if (!el) { return false; }
        var style = window.getComputedStyle(el);
        if (style.display === 'none' || style.visibility === 'hidden') { return false; }
        var box = el.getBoundingClientRect();
        return box.width > 0 && box.height > 0;
    }

    document.addEventListener('keydown', function (event) {
        /* event.key on anything current; keyCode for older iOS Safari. */
        if (event.key !== 'Escape' && event.key !== 'Esc' && event.keyCode !== 27) { return; }

        /* Let a text field have its own Escape. */
        var focused = document.activeElement;
        if (focused && /^(INPUT|TEXTAREA|SELECT)$/.test(focused.tagName)) { return; }

        for (var i = 0; i < LAYERS.length; i++) {
            var host = document.querySelector(LAYERS[i].host);
            if (!onScreen(host)) { continue; }

            var control = host.querySelector(LAYERS[i].close);
            if (control) {
                control.click();
                event.preventDefault();
            }
            return;     // one layer per press
        }
    });
})();
