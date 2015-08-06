import got  from 'got';
import Url  from 'url';
import Base  from './base';
import BasedOptions  from './based-option';
import BasedRules  from './based-rule';
import Document  from './model/document';
import Statistic  from './model/statistic';
import RequestQueue from './request-queue';

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

            _this._requestQueue.add(url, { page: documentUrl, href: href });
        });
        this._requestQueue.remove(documentUrl);
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
        this._statistic = Statistic.create();
        this._requestQueue = new RequestQueue(this.options.getOption('concurrent'), this.load.bind(this),
            () => {
                this.options.getOption('onDone').call(null, this._statistic);
            }.bind(this));

        this._logger
            .info('START to crawl pages')
            .info('It can be take a long time. Please wait ...');
        this._requestQueue.add(url, { page: url });
    }

    /**
     * Makes request to given url
     * @param {String} url - link url (url that should be requested)
     * @param {Object} advanced - object with advanced data
     * @param {Number} attempt - number of request attempt
     */
    load(url, advanced, attempt = 0) {
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
                    return this.load(url, advanced, attempt);
                 } else {
                    this._statistic.getBroken().add(url, advanced, error.statusCode);
                    this._logger.error('Broken [%s] link: => %s on page: => %s',
                        error.statusCode, advanced.href, advanced.page);
                 }
            }

            this._logger.debug('[%s] [%s] Receive [%s] for url: => %s', this._requestQueue.getPendingCount(),
                this._requestQueue.getActiveCount(), res ? res.statusCode : -1, url);

            isInternal ?
                this._statistic.increaseInternalCount() :
                this._statistic.increaseExternalCount();

            isInternal ? this.processLoadedDocument(new Document(url, data)) : this._requestQueue.remove(url);
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
}
