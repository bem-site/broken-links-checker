import _ from 'lodash';
import got  from 'got';
import Base  from './base';
import BasedOptions  from './based-option';
import Model from './model/model';
import Document  from './model/document';
import Statistic  from './model/statistic';
import LinkAnalyzer from './link-analyzer';

require('http').globalAgent.maxSockets = Infinity;
require('https').globalAgent.maxSockets = Infinity;
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

export default class Checker extends Base {
    /**
     * Constructor
     * @param {Object}    [options]                            — configuration object
     * @param {String}    [options.mode]                       - mode of checking ("website", "section" or "page")
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

        this.logger.info('Initialize crawler instance');

        /**
         * Checker options
         * @type {BasedOptions}
         */
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
     * Returns logger instance
     * @return {Logger} logger
     */
    get logger() {
        return this._logger;
    }

    /**
     * Returns model instance
     * @return {Model} model
     */
    get model() {
        return this._model;
    }

    /**
     * Returns instance of LinkAnalyzer class
     * @return {LinkAnalyzer} linkAnalyzer
     */
    get linkAnalyzer() {
        return this._linkAnalyzer;
    }

    /**
     * Returns instance of Statistic class
     * @return {Statistic} statistic
     */
    get statistic() {
        return this._statistic;
    }

    /**
     * Sets model instance
     * @param {Model} model instance
     * @return {Checker}
     */
    initModel(model) {
        this._model = model;
        return this;
    }

    /**
     * Sets linkAnalyzer instance
     * @param {LinkAnalyzer} linkAnalyzer
     * @return {Checker}
     */
    initLinkAnalyzer(linkAnalyzer) {
        this._linkAnalyzer = linkAnalyzer;
        return this;
    }

    /**
     * Sets Statistic instance
     * @param  {Statistic} statistic
     * @return {Checker}
     */
    initStatistic(statistic) {
        this._statistic = statistic;
        return this;
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
     * Processes loaded document
     * @param {Document}                   document - document model
     * @param {String}                     document.url - request url
     * @param {HttpResponse|HttpsResponse} document.res - response object
     * @protected
     */
    processLoadedDocument(document) {
        var _this = this,
            documentUrl = document.url,
            $ = document.$;

        $('a').each(function () {
            var href = $(this).attr('href');

            if (href) {
                let url = document.resolve(href.split('#')[0]);

                if (_this.linkAnalyzer.isNeedToSkipUrl(url, documentUrl)) {
                    return;
                }

                if(_this.linkAnalyzer.isExternal(url)) {
                    _this.model.addToExternal(url, documentUrl, href);
                } else {
                    _this._addToQueue(url, { page: documentUrl, href: href });
                }
            }
        });
        this._onFinishLoad(documentUrl);
    }

    /**
     * Start to crawl pages for given url
     * @param {String} url - initial site url for start
     * @throws Error
     * @public
     */
    start(url) {
        if (!url) {
            throw new Error('Url was not set');
        }

        if (!url.match(this.constructor.CONSTANTS.URL_REGEXP)) {
            throw new Error('Urls is not valid');
        }

        this
            .initStatistic(new Statistic())
            .initModel(new Model())
            .initLinkAnalyzer(new LinkAnalyzer(url, this.options))
            .logger
            .info('Start to analyze pages for: => %s', url)
            .info('It can be take a long time. Please wait ...');
        this._addToQueue(url, { page: url });
    }

    /**
     * onDone callback function
     * @param {Statistic} statistic model instance
     * @protected
     */
    onDone(statistic) {
        return statistic;
    }

    /**
     * Makes request to given url
     * @param {String} url - link url (url that should be requested)
     * @param {Object} advanced - object with advanced data
     * @param {Number} attempt - number of request attempt
     * @private
     */
    _checkInternalLink(url, advanced, attempt = 0) {
        if (attempt === 0) {
            this.model.addToActive(url);
        }

        got.get(url, this._getRequestOptions(), (error, data, res) => {
            if (error) {
                 if (!error.statusCode && attempt < this.options.getOption('requestRetriesAmount')) {
                     return this._checkInternalLink(url, advanced, ++attempt);
                 } else {
                     this.statistic.getBroken().add(url, advanced, error.statusCode);
                     this.logger.warn('Broken [%s] link: => %s on page: => %s',
                         error.statusCode, advanced.href, advanced.page);
                 }
                 return this._onFinishLoad(url);
            }

            this.logger.debug('[%s] [%s] Receive [%s] for url: => %s',
                this.model.getPendingLength(), this.model.getActiveLength(), res ? res.statusCode : -1, url);

            this.statistic.increaseInternalCount();
            this.processLoadedDocument(new Document(url, data));
        });
    }

    /**
     * Checks given external link item
     * @param {Object[]} item - external link item object
     * @param {String} item.url - external link url
     * @param {Object} item.advanced - external link advanced meta data object
     * @returns {Promise}
     * @private
     */
    _checkExternalLink(item) {
        var url = item[0],
            advanced = item[1];

        return new Promise(resolve => {
            got.head(url, this._getRequestOptions(), (error, data, res) => {
                if (error) {
                    this.statistic.getBroken().add(url, advanced, error.statusCode);
                    this.logger.warn('Broken [%s] link: => %s on page: => %s',
                        error.statusCode, advanced.href, advanced.page);
                }

                this.logger.debug('[%s] [%s] Receive [%s] for url: => %s',
                    this.model.getPendingLength(), this.model.getActiveLength(), res ? res.statusCode : -1, url);

                this.statistic.increaseExternalCount();
                resolve();
            });
        });
    }

    /**
     * Check all collected external links
     * @returns {Promise}
     * @private
     */
    _checkExternalLinks() {
        if (!this.model.areExternal()) {
            return Promise.resolve();
        }

        this.logger.info('Start to verify external links ...');

        var portions = _.chunk(Array.from(this.model.external), 100);
        return portions.reduce((prev, portion) => {
            return prev.then(() => {
                return Promise.all(portion.map(this._checkExternalLink.bind(this)));
            });
        }, Promise.resolve());
    }

    /**
     * Adds item to check queue
     * @param {String} url - link url
     * @param {Object} advanced - object with advanced data
     * @private
     */
    _addToQueue(url, advanced) {
        url = url.replace(/\/$/, '');

        if (this.model.addToProcessed(url)) {
            this.model.isQueueFull(this.options.getOption('concurrent')) ?
                this.model.addToPending(url, advanced) :
                this._checkInternalLink(url, advanced);
        }
    }

    /**
     * Function which called after request to given url will be finished
     * @param  {String} url which was requested
     * @return {*}
     * @private
     */
    _onFinishLoad(url) {
        this.model.removeFromActive(url);
        if (!this.model.isQueueFull(this.options.getOption('concurrent'))) {
            var next = this.model.removeFromPending();
            if (next) {
                this._checkInternalLink(next.url, next.advanced);
            } else if (!this.model.areActive()) {
                return this._checkExternalLinks().then(() => {
                    this.options.getOption('onDone')(this.statistic);
                });
            }
        }
    }

    /**
     * Returns request options hash
     * @returns {{encoding: string, headers: *, timeout: *}}
     * @private
     */
    _getRequestOptions() {
        return {
            encoding: 'utf-8',
            headers: this.options.getOption('requestHeaders'),
            timeout: this.options.getOption('requestTimeout')
        };
    }
}
