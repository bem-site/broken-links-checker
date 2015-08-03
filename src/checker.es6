import Url from 'url';
import Table from 'easy-table';
import got from 'got';

import Base from './base';
// import Util from './util';
import BasedOptions from './based-option';
import BasedRules from './based-rule';
import Document from './model/document';
import Statistic from './model/statistic';

require('http').globalAgent.maxSockets = Infinity;
require('https').globalAgent.maxSockets = Infinity;

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
        this._rules = new BasedRules();

        this.options
            .setOption(options, 'concurrent', this.constructor.DEFAULT.concurrent)
            .setOption(options, 'requestHeaders', this.constructor.DEFAULT.requestHeaders)
            .setOption(options, 'requestRetriesAmount', this.constructor.DEFAULT.requestRetriesAmount)
            .setOption(options, 'requestTimeout', this.constructor.DEFAULT.requestTimeout)
            .setOption(options, 'onDone', this.onDone.bind(this));

        this.rules
            .setRule(options, 'acceptedSchemes', this.constructor.DEFAULT.acceptedSchemes)
            .setRule(options, 'checkExternalUrls', this.constructor.DEFAULT.checkExternalUrls)
            .setRule(options, 'excludeLinkPatterns', this.constructor.DEFAULT.excludeLinkPatterns);
    }

    /**
     * Getter function for options
     * @returns {BasedOptions}
     */
    get options() {
        return this._options;
    }

    /**
     * Getter function for rules
     * @returns {BasedRules}
     */
    get rules() {
        return this._rules;
    }

    /**
     * Returns application default options and rules
     * @returns {Object}
     * @constructor
     */
    static get DEFAULT() {
        return {
            concurrent: 100,
            requestHeaders: { 'user-agent': 'node-spider' },
            requestRetriesAmount: 1,
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
            URL_REGEXP: /https?\:\/\/\w+((\:\d+)?\/\S*)?/
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
                return this.rules.getRule('acceptedSchemes').indexOf(Url.parse(url).protocol) < 0;
            },

            /**
             * Checks if given url has the different hostname then initial
             * (If 'checkExternalUrls' rule is set to true)
             * @param {String} url — request url
             * @returns {boolean} — result flag
             * @private
             */
            skipExternalUrls: url => {
                return !this.rules.getRule('checkExternalUrls') && url.indexOf(this._url['hostname']) < 0;
            },

            /**
             * Checks if given url has host different then host of initial url
             * @param {String} url — request url
             * @returns {boolean} — result flag
             * @private
             */
            skipExcludedUrls: url => {
                return this.rules.getRule('excludeLinkPatterns').some(pattern => {
                    return !!url.match(pattern);
                });
            }
        };
    }

    /**
     * Returns true if anyone of skip conditions returns true
     * @param {String} url - request url
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

            _this._logger
                .verbose('Found link: %s', href)
                .verbose('Resolved url: %s', url);

            if (_this.isNeedToSkipUrl(url)) {
                return;
            }

            _this._addToQueue(url, { page: documentUrl, href: href });
        });
        this._onFinishLoad(documentUrl);
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
        this._processed = new Map();
        this._statistic = Statistic.create();

        this._logger
            .info('START to crawl pages')
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
        this._active.push(url);

        var requestOptions = {
                encoding: 'utf-8',
                headers: this.options.getOption('headers'),
                timeout: this.options.getOption('requestTimeout')
            },
            isInternal = url.indexOf(this._url.hostname) > -1,
            method = isInternal ? 'get' : 'head';

        got[method](url, requestOptions, (error, data, res) => {
            if (error) {
                if (!error.statusCode && attempt < this.options.getOption('requestRetriesAmount')) {
                    attempt++;
                    this._logger.warn('[%s] attempt to request url: %s', attempt, url);
                    return this.load(url, advanced, attempt, callback);
                } else {
                    this._statistic.getBroken().add(url, advanced, error.statusCode);
                    this._logger.error('Broken [%s] link: => %s on page: => %s',
                        error.statusCode, advanced.href, advanced.page);
                }
            }

            this._logger.debug('[%s] [%s] Receive [%s] for url: => %s',
                this._pending.length, this._active.length, res ? res.statusCode : -1, url);

            isInternal ?
                this._statistic.increaseInternalCount() :
                this._statistic.increaseExternalCount();

            isInternal ?
                callback.call(this, new Document(url, data)) :
                this._onFinishLoad(url);
        });
    }

    /**
     * onDone callback function
     * @param {Statistic} statistic model instance
     * @protected
     */
    onDone(statistic) {
        this._logger.info('FINISH to crawl pages');

        var table = new Table();
        statistic.getBroken().getAll().forEach((item, index) => {
            table.cell('#', index);
            table.cell('Code', item.code);
            table.cell('href', item.advanced.href);
            table.cell('page', item.advanced.page);
            table.newRow();
        });
        console.log(table.toString());

        this._logger.info('-- Internal urls: [%s]', statistic.getInternalCount())
            .info('-- External urls: [%s]', statistic.getExternalCount())
            .info('-- Broken urls: [%s]', statistic.getBrokenCount())
            .info('-- Total urls: [%s]', statistic.getAllCount())
            .info('-- Broken urls percentage: [%s] %', (statistic.getBrokenCount() * 100) / statistic.getAllCount());
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
        var i = this._active.indexOf(url);
        this._active.splice(i, 1);

        if (!this._isQueueFull()) {
            var next = this._pending.shift();
            if (next) {
                this.load(next.url, next.advanced, 0, this.processLoadedDocument.bind(this));
            } else if (!this._active.length) {
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
