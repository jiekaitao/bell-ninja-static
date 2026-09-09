/*
 * tests/lib/shim.js
 *
 * A tiny, engine-agnostic browser shim so the real shipped bell-*.js files can
 * be executed under BOTH engines we care about:
 *
 *   - node   (V8)          -> stands in for Chrome / Edge
 *   - jsc    (JavaScriptCore) -> stands in for Safari on iOS + macOS
 *
 * Plain ES5, no modules, no require(). Everything hangs off the global object
 * so `load()` (jsc) and `vm.runInContext()` (node) both work.
 */

var BellTest = (typeof BellTest !== 'undefined') ? BellTest : {};

/* The clock every faked `new Date()` reads from. Tests move this around. */
BellTest.nowMs = Date.now();

BellTest.installClock = function (globalObj) {
    var RealDate = globalObj.Date;
    BellTest.RealDate = RealDate;

    function FakeDate(a, b, c, d, e, f, g) {
        switch (arguments.length) {
            case 0: return new RealDate(BellTest.nowMs);
            case 1: return new RealDate(a);
            case 2: return new RealDate(a, b);
            case 3: return new RealDate(a, b, c);
            case 4: return new RealDate(a, b, c, d);
            case 5: return new RealDate(a, b, c, d, e);
            case 6: return new RealDate(a, b, c, d, e, f);
            default: return new RealDate(a, b, c, d, e, f, g);
        }
    }
    FakeDate.now = function () { return BellTest.nowMs; };
    FakeDate.parse = function (s) { return RealDate.parse(s); };
    FakeDate.UTC = function () { return RealDate.UTC.apply(RealDate, arguments); };
    FakeDate.prototype = RealDate.prototype;

    globalObj.Date = FakeDate;
};

/* ------------------------------------------------------------------ *
 * Minimal DOM. Only what the bell scripts actually touch.
 * ------------------------------------------------------------------ */
BellTest.makeElement = function (id) {
    return {
        id: id,
        innerHTML: '',
        className: '',
        style: {},
        children: {},
        querySelector: function (sel) {
            var key = sel.replace(/^[.#]/, '');
            if (!this.children[key]) this.children[key] = BellTest.makeElement(key);
            return this.children[key];
        },
        addEventListener: function () {},
        removeEventListener: function () {},
        appendChild: function () {},
        play: function () { return BellTest.thenable(); },
        pause: function () {},
        getBoundingClientRect: function () {
            return { top: 0, left: 0, width: 0, height: 0, right: 0, bottom: 0 };
        }
    };
};

/* A Promise-like with .then/.catch so audio play() is safe in any engine. */
BellTest.thenable = function () {
    var t = {
        then: function (fn) { if (fn) fn(); return t; },
        catch: function () { return t; }
    };
    return t;
};

BellTest.installDom = function (globalObj) {
    var els = {};

    var document = {
        _els: els,
        getElementById: function (id) {
            if (!els[id]) els[id] = BellTest.makeElement(id);
            return els[id];
        },
        querySelector: function (sel) { return this.getElementById(sel.replace(/^[.#]/, '')); },
        querySelectorAll: function () { return []; },
        getElementsByTagName: function () { return []; },
        createElement: function (tag) { return BellTest.makeElement(tag); },
        addEventListener: function () {},
        documentElement: BellTest.makeElement('html'),
        body: BellTest.makeElement('body'),
        readyState: 'complete'
    };

    globalObj.document = document;
    globalObj.els = els;
    BellTest.els = els;

    /* Timers are recorded, never fired: the tests drive time explicitly. */
    BellTest.timers = [];
    globalObj.setTimeout = function (fn, ms) {
        BellTest.timers.push({ kind: 'timeout', ms: ms, fn: fn });
        return BellTest.timers.length;
    };
    globalObj.setInterval = function (fn, ms) {
        BellTest.timers.push({ kind: 'interval', ms: ms, fn: fn });
        return BellTest.timers.length;
    };
    globalObj.clearTimeout = function () {};
    globalObj.clearInterval = function () {};

    globalObj.Audio = function (src) {
        var el = BellTest.makeElement('audio');
        el.src = src;
        return el;
    };

    globalObj.navigator = { userAgent: 'test', platform: 'test', maxTouchPoints: 0 };
    globalObj.location = { reload: function () { BellTest.reloaded = true; }, href: '' };
    globalObj.alert = function (msg) { BellTest.alerts.push(String(msg)); };
    BellTest.alerts = [];

    if (typeof globalObj.console === 'undefined') {
        globalObj.console = {
            log: function () {}, warn: function () {}, error: function () {}
        };
    } else {
        /* Silence the scripts' own chatter so test output stays readable. */
        globalObj.console = {
            log: function () {}, warn: function () {}, error: function () {}
        };
    }

    globalObj.window = globalObj;
    globalObj.self = globalObj;
};

BellTest.installAll = function (globalObj) {
    BellTest.installDom(globalObj);
    BellTest.installClock(globalObj);
};
