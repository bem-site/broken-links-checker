var Url = require('url'),

    inherit = require('inherit'),
    curl = require('curlrequest'),
    parser = require('http-string-parser'),

    Base = require('./base'),
    Util = require('./util'),
    FileSystem = require('./filesystem'),
    BasedOptions = require('./based-option'),
    BasedRules = require('./based-rule'),
    SkipRules = require('./skip-rules'),
    Document = require('./document'),
    BrokenLinks = require('./broken');

module.exports = inherit([Base, FileSystem, SkipRules, BasedRules, BasedOptions, Util], {
    _url: undefined,  // initial url

    _pending: undefined, // array of items which should be checking for availability but later
    _active: undefined, // array of items which are checking now
    _processed: undefined, // hash of already processed urls for preventing infinite loops

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
     * @protected
     */
    onDone: function () {
        this._logger.info('FINISH to crawl pages');
        return this.readReportFile().reduce(function (prev, item) {
            item = item.split(' ');
            return prev.add(item[0], item[1]);
        }, BrokenLinks.create());
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
        this.createReportFile();

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
        curl.request({
            url: url,
            headers: this.getOption('requestHeaders'),
            retries: this.getOption('requestRetriesAmount'),
            timeout: this.getOption('requestTimeout'),
            redirects: this.getOption('requestMaxRedirectsAmount'),
            scope: this,
            include: true
        }, function (error, data) {
            var res = parser.parseResponse(data),
                statusCode = +res.statusCode;

            if (error || !data || statusCode >= 400) {
                this._logger.error('Broken [%s] url: => %s on page: => %s', statusCode, url, baseUrl);
                this.appendToReportFile([url, baseUrl, statusCode ].join(' '));
            }

            if (url.indexOf(this._url.hostname) < 0) {
                this._logger.verbose('[%s] [%s] External url: => %s',
                    this._pending.length, this._active.length, url);
                return this._onFinishLoad(url);
            }

            if (statusCode === 301 || statusCode === 302) {
                var redirect = res.headers['Location'];
                if (redirect && this.__self.isString(redirect)) {
                    return this.load(Url.resolve(this._url.href, redirect), baseUrl, callback);
                } else {
                    return this._onFinishLoad(url);
                }
            }

            this._logger.verbose('[%s] [%s] Receive [%s] for url: => %s',
                this._pending.length, this._active.length, statusCode, url);
            callback.call(this, new Document(url, res));
        });
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
                this.getOption('onDone').call(this);
            }
        }
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
