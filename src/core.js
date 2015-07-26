var request = require('request'),
    inherit = require('inherit'),
    Document = require('./document');

module.exports = inherit({
    _concurrent: undefined,
    _headers: undefined,

    _pending: undefined,
    _active: undefined,
    _processed: undefined,

    __constructor: function (options) {
        options = options || {};

        this._concurrent = options.concurrent;
        this._headers = options.headers;
        this._done = options.done;
        this._error = options.error;

        this._pending = [];
        this._active = [];
        this._processed = {};
    },

    full: function () {
        return this._active.length >= this._concurrent;
    },

    queue: function (url, done) {
        url = url.replace(/\/$/, '');

        if (this._processed[url]) {
            return;
        }

        this._processed[url] = true;

        if (this.full()) {
            this._pending.push({ u: url, d: done });
        } else {
            this.load(url, done);
        }
    },

    dequeue: function () {
        var next = this._pending.shift();
        if (next) {
            this.load(next.u, next.d);
        } else if (this._done && !this._active.length) {
            this._done.call(this);
        }
    },

    finished: function (url) {
        var i = this._active.indexOf(url);
        this._active.splice(i, 1);

        if (!this.full()) {
            this.dequeue();
        }
    },

    load: function (url, done) {
        this._active.push(url);

        request({ url: url, headers: this._headers }, function (err, res) {
            if (err) {
                return this._error(url, err);
            }

            done.call(this, new Document(url, res));
            this.finished(url);
        }.bind(this));
    }
});
