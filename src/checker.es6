import got  from 'got';
import Url  from 'url';
import Base  from './base';
import BasedOptions  from './based-option';
import Document  from './model/document';
import Statistic  from './model/statistic';

require('http').globalAgent.maxSockets = Infinity;
require('https').globalAgent.maxSockets = Infinity;
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

export default class Checker extends Base {
    /**
     * Constructor
     * @param {Object}    [options]                            — configuration object
     * @param {Number}    [options.concurrent]                 — number of concurrent requests
     * @param {Object}    [options.requestHeaders]             — set custom request headers for crawler requests
     * @param {Number}    [options.requestRetriesAmount]       - number of attempts for request if it fails at first
     * @param {Number}    [options.requestTimeout]             - request timeout (in milliseconds)
     * @param {Function}  [options.onDone]                     - set custom done handler function
     * @param {String[]}  [options.acceptedSchemes]            — set array of accepted request acceptedSchemes
     * @param {Boolean}   [options.checkExternalUrls]          — set `true` for check outer links
     * @param {RegExp[]}  [options.excludeLinkPatterns         - array of regular expressions. Urls that matches
     * for this regular expressions would be excluded from verification
     * @constructor
     */
    constructor(options = {}) {
        super(options, module);

        this._logger.info('Initialize crawler instance');

        this._options = new BasedOptions();

        const def = this.constructor.DEFAULT;
        this.options
            .setOption(options, 'mode', def.mode)
            .setOption(options, 'concurrent', def.concurrent)
            .setOption(options, 'requestHeaders', def.requestHeaders)
            .setOption(options, 'requestTimeout', def.requestTimeout)
            .setOption(options, 'acceptedSchemes', def.acceptedSchemes)
            .setOption(options, 'checkExternalUrls', def.checkExternalUrls)
            .setOption(options, 'excludeLinkPatterns', def.excludeLinkPatterns)
            .setOption(options, 'requestRetriesAmount', def.requestRetriesAmount)
            .setOption(options, 'onDone', this.onDone.bind(this));
    }

    /**
     * Getter function for options
     * @returns {BasedOptions}
     */
    get options() {
        return this._options;
    }

    /**
     * Returns application default options
     * @returns {Object}
     * @constructor
     */
    static get DEFAULT() {
        return {
            mode: 'website',
            concurrent: 100,
            requestHeaders: { 'user-agent': 'node-spider' },
            requestRetriesAmount: 5,
            requestTimeout: 5000,
            acceptedSchemes: ['http:', 'https:'],
            checkExternalUrls: false,
            excludeLinkPatterns: []
        };
    }

    /**
     * Returns application constants model
     * @returns {Object}
     * @static
     */
    static get CONSTANTS() {
        return {
            URL_REGEXP: /https?\:\/\/\w+((\:\d+)?\/\S*)?/,
            MODE: {
                WEBSITE: 'website',
                SECTION: 'section',
                PAGE: 'page'
            }
        };
    }

    /**
     * Initialize predefined skip rules for prevent deeper crawling for given url
     * @param {String} initial - initial url
     * @returns {{skipNonAcceptableProtocols: Function, skipOuterUrls: Function, skipExcludedUrls: Function}}
     */
    initSkipRules(initial) {
        this._url = Url.parse(initial);
        this._skipRules = {
            /**
             * Check if protocol of given url satisfies acceptedSchemes criteria
             * @param {String} url - request url
             * @returns {boolean} — result flag
             * @private
             */
            skipNonAcceptableProtocols: url => {
                return this.options.getOption('acceptedSchemes').indexOf(Url.parse(url).protocol) < 0;
            },

            /**
             * Checks if given url has the different hostname then initial
             * (If 'checkExternalUrls' rule is set to true)
             * @param {String} url — request url
             * @returns {boolean} — result flag
             * @private
             */
            skipExternalUrls: url => {
                return !this.options.getOption('checkExternalUrls') && url.indexOf(this._url['hostname']) < 0;
            },

            /**
             * Checks if given url has host different then host of initial url
             * @param {String} url — request url
             * @returns {boolean} — result flag
             * @private
             */
            skipExcludedUrls: url => {
                return this.options.getOption('excludeLinkPatterns').some(pattern => {
                    return !!url.match(pattern);
                });
            },

            /**
             * Checks if given url is need to be check depending on mode configuration option
             * @type {boolean} - result flag
             * @private
             */
            skipOnMode: url => {
                var mode = this.options.getOption('mode');
                const MODES = this.constructor.CONSTANTS.MODE;

                if (mode === MODES.PAGE) {
                    return true;
                } else if (mode === MODES.SECTION) {
                    return url.indexOf(this._url.path) === -1;
                } else {
                    return false;
                }
            }
        };
    }

    /**
     * Returns true if anyone of skip conditions returns true
     * @param {String} url - url of link
     * @param {String} baseUrl - url of page where link is
     * @returns {boolean} — result flag
     */
    isNeedToSkipUrl(url) {
        return Object.keys(this._skipRules).some(fName => {
            return this._skipRules[fName](url);
        });
    }

    /**
     * Processes loaded document
     * @param {Document}                   document - document model
     * @param {String}                     document.url - request url
     * @param {HttpResponse|HttpsResponse} document.res - response object
     */
    processLoadedDocument(document) {
        var _this = this,
            documentUrl = document.url,
            $ = document.$;

        $('a').each(function () {
            var href = $(this).attr('href'),
                url;

            if (!href) {
                return;
            }

            url = document.resolve(href.split('#')[0]);

            _this._logger.verbose('Found link: %s', href).verbose('Resolved url: %s', url);
            if (_this.isNeedToSkipUrl(url)) {
                return;
            }

            _this._addToQueue(url, { page: documentUrl, href: href });
        });
    }

    /**
     * Start to crawl pages for given url
     * @param {String} url - initial site url for start crawl
     */
    start(url) {
        if (!url) {
            throw new Error('Url was not set');
        }

        if (!url.match(this.constructor.CONSTANTS.URL_REGEXP)) {
            throw new Error('Urls is not valid');
        }

        this.initSkipRules(url);

        this._pending = [];
        this._active = [];
        this._external = new Map();
        this._processed = new Map();
        this._statistic = Statistic.create();

        this._logger
            .info('Start to analyze pages for: => %s', url)
            .info('It can be take a long time. Please wait ...');
        this._addToQueue(url, { page: url });
    }

    /**
     * Makes request to given url
     * @param {String} url - link url (url that should be requested)
     * @param {Object} advanced - object with advanced data
     * @param {Number} attempt - number of request attempt
     * @param {Function} callback - callback function
     */
    load(url, advanced, attempt, callback) {
        if (attempt === 0) {
            this._active.push(url);
        }

        var isInternal = url.indexOf(this._url.hostname) > -1,
            requestOptions = {
                encoding: 'utf-8',
                headers: this.options.getOption('headers'),
                timeout: this.options.getOption('requestTimeout')
            },
            method = isInternal ? 'get' : 'head';

        got[method](url, requestOptions, (error, data, res) => {
            if (error) {
                 if (isInternal && !error.statusCode && attempt < this.options.getOption('requestRetriesAmount')) {
                     return this.load(url, advanced, ++attempt, callback);
                 } else {
                     if (isInternal || error.statusCode === 404) {
                         this._statistic.getBroken().add(url, advanced, error.statusCode);
                         this._logger.error('Broken [%s] link: => %s on page: => %s',
                            error.statusCode, advanced.href, advanced.page);
                     }
                 }
                 return this._onFinishLoad(url);
            }

            this._logger.debug('[%s] [%s] Receive [%s] for url: => %s',
                this._pending.length, this._active.length, res ? res.statusCode : -1, url);

            if (isInternal) {
                this._statistic.increaseInternalCount();
                callback.call(this, new Document(url, data));
            } else {
                this._statistic.increaseExternalCount();
            }
            this._onFinishLoad(url);
        });
    }

    /**
     * onDone callback function
     * @param {Statistic} statistic model instance
     * @protected
     */
    onDone(statistic) {
        return statistic;
    }

    /* ----- private methods ----- */
    /**
     * Checks if loading queue is full
     * @returns {Boolean}
     * @private
     */
    _isQueueFull() {
        return this._active.length >= this.options.getOption('concurrent');
    }

    /**
     * Adds item to check queue
     * @param {String} url - link url
     * @param {Object} advanced - object with advanced data
     * @private
     */
    _addToQueue(url, advanced) {
        url = url.replace(/\/$/, '');

        if (this._processed.has(url)) {
            return;
        }
        this._processed.set(url, true);
        this._isQueueFull() ? this._pending.push({ url: url, advanced: advanced }) :
            this.load(url, advanced, 0, this.processLoadedDocument.bind(this));
    }

    /**
     * Function which called after request to given url will be finished
     * @param  {String} url which was requested
     * @return {*}
     * @private
     */
    _onFinishLoad(url) {
        this._active.splice(this._active.indexOf(url), 1);

        if (!this._isQueueFull()) {
            var next = this._pending.shift();
            if (next) {
                this.load(next.url, next.advanced, 0, this.processLoadedDocument.bind(this));
            } else if (!this._active.length) {
                console.log('pending length: %s', this._pending.length);
                console.log('active length: %s', this._active.length);
                this._done.call(this);
            }
        }
    }

    /**
     * Done callback function. Calls configured onDone callback with statistic argument
     * @return {*}
     * @private
     */
    _done() {
        return this.options.getOption('onDone')(this._statistic);
    }
}
