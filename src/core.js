var request = require('request'),
    Document = require('./document');

function Spider(opts) {
    opts = this.opts = opts || {};
    opts.concurrent = opts.concurrent || 1;
    opts.headers = opts.headers || {};

    this.pending = [];
    this.active = [];

    this.crawled = {};
}

Spider.prototype = {
    constructor: Spider,

    full: function () {
        return this.active.length >= this.opts.concurrent;
    },

    queue: function (url, done) {
        if (this.crawled[url.replace(/\/$/, '')]) {
            return;
        }

        this.crawled[url.replace(/\/$/, '')] = true;
        if (this.full()) {
            this.pending.push({ u:url, d:done });
        } else {
            this.load(url, done);
        }
    },

    load: function (url, done) {
        this.active.push(url);

        request({
            url: url,
            headers: this.opts.headers
        }, function (err, res) {
            if (err) {
                if (!this.opts.error) {
                    throw err;
                }
                return this.opts.error(url, err);
            }

            var doc = new Document(url, res);
            done.call(this, doc);
            this.finished(url);
        }.bind(this));
    },

    dequeue: function () {
        var next = this.pending.shift();
        if (next) {
            this.load(next.u, next.d);
        } else if (this.opts.done && this.active.length === 0) {
            this.opts.done.call(this);
        }
    },

    finished: function (url) {
        var i = this.active.indexOf(url);
        this.active.splice(i, 1);

        if (!this.full()) {
            this.dequeue();
        }
    }
};

module.exports = Spider;
