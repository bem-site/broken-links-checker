var Url = require('url'),

    inherit = require('inherit'),
    got = require('got'),

    Base = require('./base'),
    Util = require('./util'),
    BasedOptions = require('./based-option'),
    BasedRules = require('./based-rule'),
    SkipRules = require('./skip-rules'),
    Document = require('./model/document'),
    Statistic = require('./model/statistic');

require('http').globalAgent.maxSockets = Infinity;
require('https').globalAgent.maxSockets = Infinity;

module.exports = inherit([Base, SkipRules, BasedRules, BasedOptions, Util], {
    _url: undefined,  // initial url

    _pending: undefined, // array of items which should be checking for availability but later
    _active: undefined, // array of items which are checking now
    _processed: undefined, // hash of already processed urls for preventing infinite loops

    _statistic: undefined,

    /**
     * Constructor
     * @param {Object}    [options]                            — configuration object
     * @param {Number}    [options.concurrent]                 — number of concurrent requests
     * @param {Object}    [options.requestHeaders]             — set custom request headers for crawler requests
     * @param {Number}    [options.requestRetriesAmount]       - number of attempts for request if it fails at first
     * @param {Number}    [options.requestMaxRedirectsAmount]  - max number of allowed redirects per request
     * @param {Number}    [options.requestTimeout]             - request timeout (in milliseconds)
     * @param {Function}  [options.onError]                    - set custom error handler function
     * @param {Function}  [options.onDone]                     - set custom done handler function
     * @param {String[]}  [options.acceptedSchemes]            — set array of accepted request acceptedSchemes
     * @param {Boolean}   [options.checkExternalUrls]          — set `true` for check outer links
     * @param {RegExp[]}  [options.excludeLinkPatterns         - array of regular expressions. Urls that matches
     * for this regular expressions would be excluded from verification
     * @private
     */
    __constructor: function (options) {
        this.__base(options, module);

        options = options || {};

        this
            .setOption(options, 'concurrent', this.__self.DEFAULT.concurrent)
            .setOption(options, 'requestHeaders', this.__self.DEFAULT.requestHeaders)
            .setOption(options, 'requestRetriesAmount', this.__self.DEFAULT.requestRetriesAmount)
            .setOption(options, 'requestMaxRedirectsAmount', this.__self.DEFAULT.requestMaxRedirectsAmount)
            .setOption(options, 'requestTimeout', this.__self.DEFAULT.requestTimeout)

            .setOption(options, 'onDone', this.onDone.bind(this))

            .setRule(options, 'acceptedSchemes', this.__self.DEFAULT.acceptedSchemes)
            .setRule(options, 'checkExternalUrls', this.__self.DEFAULT.checkExternalUrls)
            .setRule(options, 'excludeLinkPatterns', this.__self.DEFAULT.excludeLinkPatterns);

        this._pending = [];
        this._active = [];
        this._processed = {};
    },

    /**
     * Processes loaded document
     * @param {Document}                   document - document model
     * @param {String}                     document.url - request url
     * @param {HttpResponse|HttpsResponse} document.res - response object
     */
    processLoadedDocument: function (document) {
        var _this = this,
            documentUrl = document.url;

        document.$('a').each(function () {
            var href = this.attr('href'),
                url;

            if (!href) {
                return;
            }

            href = href.split('#')[0];
            url = document.resolve(href);

            if (_this.isNeedToSkipUrl(url)) {
                return;
            }

            _this._addToQueue(url, documentUrl);
        });
        this._onFinishLoad(documentUrl);
    },

    /**
     * onDone callback function
     * @param {Statistic} statistic model instance
     * @protected
     */
    onDone: function (statistic) {
        this._logger
            .info('FINISH to crawl pages')
            .info('-- Internal links: [%s]', statistic.getInternalCount())
            .info('-- External links: [%s]', statistic.getExternalCount())
            .info('-- Broken links: [%s]', statistic.getBrokenCount())
            .info('-- Total links: [%s]', statistic.getAllCount())
            .info('-- Broken links percentage: [%s] %', (statistic.getBrokenCount() * 100) / statistic.getAllCount());
    },

    /**
     * Start to crawl pages for given url
     * @param {String} url - initial site url for start crawl
     */
    start: function (url) {
        if (!url) {
            throw new Error('Url was not set');
        }

        if (!url.match(this.__self.CONSTANTS.URL_REGEXP)) {
            throw new Error('Urls is not valid');
        }

        this._url = Url.parse(url);
        this.initSkipRules(this._url);
        this._statistic = Statistic.create();

        this._logger
            .info('START to crawl pages')
            .info('It can be take a long time. Please wait ...');
        this._addToQueue(url, url);
    },

    /**
     * Makes request to given url
     * @param {String} url - link url (url that should be requested)
     * @param {String} baseUrl - url of page where link was discovered
     * @param {Function} callback - callback function
     */
    load: function (url, baseUrl, callback) {
        this._active.push(url);

        var requestOptions = {
                encoding: 'utf-8',
                headers: this.getOption('headers'),
                timeout: this.getOption('requestTimeout')
            },
            isInternal = url.indexOf(this._url.hostname) > -1,
            method = isInternal ? 'get' : 'head';

        got[method](url, requestOptions, function (error, data, res) {
            if (error) {
                this._statistic.getBroken().add(url, baseUrl, error.statusCode);
                this._logger.error('Broken [%s] url: => %s on page: => %s', error.statusCode, url, baseUrl);
            }

            this._logger.verbose('[%s] [%s] Receive [%s] for url: => %s',
                this._pending.length, this._active.length, res.statusCode, url);

            isInternal ?
                this._statistic.increaseInternalCount() :
                this._statistic.increaseExternalCount();

            isInternal ?
                callback.call(this, new Document(url, data)) :
                this._onFinishLoad(url);
        }.bind(this));
    },

    /**
     * Checks if loading queue is full
     * @returns {Boolean}
     * @private
     */
    _isQueueFull: function () {
        return this._active.length >= this.getOption('concurrent');
    },

    /**
     * Adds item to check queue
     * @param {String} url - link url
     * @param {String} baseUrl - url of page where link was discovered
     * @private
     */
    _addToQueue: function (url, baseUrl) {
        url = url.replace(/\/$/, '');

        if (this._processed[url]) {
            return;
        }

        this._processed[url] = true;

        if (this._isQueueFull()) {
            this._pending.push({ url: url, baseUrl: baseUrl });
        } else {
            this.load(url, baseUrl, this.processLoadedDocument.bind(this));
        }
    },

    _onFinishLoad: function (url) {
        var i = this._active.indexOf(url);
        this._active.splice(i, 1);

        if (!this._isQueueFull()) {
            var next = this._pending.shift();
            if (next) {
                this.load(next.url, next.baseUrl, this.processLoadedDocument.bind(this));
            } else if (!this._active.length) {
                this._done.call(this);
            }
        }
    },

    _done: function () {
        this.getOption('onDone')(this._statistic);
    }
}, {
    DEFAULT: {
        concurrent: 5,
        requestHeaders: { 'user-agent': 'node-spider' },
        requestRetriesAmount: 1,
        requestTimeout: 5000,
        requestMaxRedirectsAmount: 10,
        acceptedSchemes: ['http:', 'https:'],
        checkExternalUrls: false,
        excludeLinkPatterns: []
    },
    CONSTANTS: {
        URL_REGEXP: /https?\:\/\/\w+((\:\d+)?\/\S*)?/
    }
});
