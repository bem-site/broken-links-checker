var Url = require('url'),
    curl = require('curlrequest'),
    request = require('request'),
    parser = require('http-string-parser'),
    inherit = require('inherit'),
    Logger = require('bem-site-logger'),
    Document = require('./document'),
    BrokenLinks = require('./broken');

module.exports = inherit({
    _url: undefined,  // initial url

    _logger: undefined, // logger instance
    _options: undefined, // application options

    _rules: undefined, // rules (settings) for parsing

    _brokenUrls: undefined, // broken links(urls) model instance
    _skipRules: undefined, // cached skip rules model

    _pending: undefined, // array of items which should be checking for availability but later
    _active: undefined, // array of items which are checking now
    _processed: undefined, // hash of already processed urls for preventing infinite loops

    /**
     * Constructor
     * @param {Object}    [options]                — configuration object
     * @param {Number}    [options.concurrent]     — number of concurrent requests
     * @param {Object}    [options.headers]        — set custom request headers for crawler requests
     * @param {Function}  [options.onError]        - set custom error handler function
     * @param {Function}  [options.onDone]         - set custom done handler function
     * @param {String[]}  [options.protocols]      — set array of accepted request protocols
     * @param {Boolean}   [options.checkOuterUrls] — set `true` for check outer links
     * @param {RegExp[]}  [options.exclude]        - array of regular expressions. Urls that matches
     * for this regular expressions would be excluded from verification
     * @private
     */
    __constructor: function (options) {
        options = options || {};

        var loggerOptions = options['logger'] || { level: 'debug' };
        this._logger = Logger.setOptions(loggerOptions).createLogger(module);

        this
            .setOption(options, 'concurrent', this.__self.DEFAULT.concurrent)
            .setOption(options, 'headers', this.__self.DEFAULT.headers)
            .setOption(options, 'onDone', this.onDone.bind(this))
            .setOption(options, 'onError', this.onError.bind(this))
            .setRule(options, 'protocols', this.__self.DEFAULT.protocols)
            .setRule(options, 'checkOuterUrls', this.__self.DEFAULT.checkOuterUrls)
            .setRule(options, 'exclude', this.__self.DEFAULT.exclude);

        this._options.error = function (url, error) {
            this.getOption('onError').call(this, url, error);
        }.bind(this);

        this._options.done = function () {
            this.getOption('onDone').call(this, this._brokenUrls);
        }.bind(this);

        this._pending = [];
        this._active = [];
        this._processed = {};
    },

    /**
     * Sets value to options model for given option field name
     * @param {Object} options      — configuration object
     * @param {String} name         - name of option field
     * @param {*}      defaultValue - option default value
     * @returns {exports}
     */
    setOption: function (options, name, defaultValue) {
        this._options = this._options || {};
        this._options[name] = options[name] || defaultValue;
        if (!this.__self.isFunction(this._options[name])) {
            this._logger.debug('Set option [%s] => %s', name,
                this.__self.isObject(this._options[name]) ? JSON.stringify(this._options[name]) : this._options[name]);
        }
        return this;
    },

    /**
     * Returns option value by given option name
     * @param {String} name — option name
     * @returns {*}
     */
    getOption: function (name) {
        return this._options[name];
    },

    /**
     * Sets value to rules model for given rule field name
     * @param {Object} rules        — rules object
     * @param {String} name         - name of rule field
     * @param {*}      defaultValue - rule default value
     * @returns {exports}
     */
    setRule: function (rules, name, defaultValue) {
        this._rules = this._rules || {};
        this._rules[name] = rules[name] || defaultValue;
        if (!this.__self.isFunction(this._rules[name])) {
            this._logger.debug('Set rule [%s] => %s', name, this._rules[name]);
        }
        return this;
    },

    /**
     * Returns rule value by given rule name
     * @param {String} name — rule name
     * @returns {*}
     */
    getRule: function (name) {
        return this._rules[name];
    },

    /**
     * Returns predefined skip rules for prevent deeper crawling for given url
     * @returns {{skipNonAcceptableProtocols: Function, skipOuterUrls: Function, skipExcludedUrls: Function}}
     */
    getSkipRules: function () {
        if (this._skipRules) {
            return this._skipRules;
        }

        this._skipRules = (function (_this) {
            return {
                /**
                 * Check if protocol of given url satisfies protocols criteria
                 * @param {String} url - request url
                 * @returns {boolean} — result flag
                 * @private
                 */
                skipNonAcceptableProtocols: function (url) {
                    return _this.getRule('protocols').indexOf(Url.parse(url).protocol) < 0;
                },

                /**
                 * Checks if given url has the different hostname then initial
                 * (If 'checkOuterUrls' rule is set to true)
                 * @param {String} url — request url
                 * @returns {boolean} — result flag
                 * @private
                 */
                skipOuterUrls: function (url) {
                    return !_this.getRule('checkOuterUrls') && url.indexOf(_this._url.hostname) < 0;
                },

                /**
                 * Checks if given url has host different then host of initial url
                 * @param {String} url — request url
                 * @returns {boolean} — result flag
                 * @private
                 */
                skipExcludedUrls: function (url) {
                    return _this.getRule('exclude').some(function (pattern) {
                        return !!url.match(pattern);
                    });
                }
            };
        })(this);

        return this.getSkipRules();
    },

    /**
     * Returns true if anyone of skip conditions returns true
     * @param {String} url - request url
     * @returns {boolean} — result flag
     */
    isNeedToSkipUrl: function (url) {
        return Object.keys(this.getSkipRules()).reduce(function (prev, fName) {
            prev = prev || this.getSkipRules()[fName](url);
            return prev;
        }.bind(this), false);
    },

    /**
     * Handle request callback
     * @param {Document}                   document - document model
     * @param {String}                     document.url - request url
     * @param {HttpResponse|HttpsResponse} document.res - response object
     */
    onHandleRequest: function (document) {
        var _this = this,
            documentUrl = document.url,
            statusCode = +document.res.statusCode;

        if (statusCode >= 400) {
            this._logger.error('Broken [%s] url: => %s', statusCode, documentUrl);
            this._brokenUrls.add(documentUrl, statusCode);
            this._onFinishLoad(documentUrl);
            return;
        }

        this._logger.verbose('Receive [%s] for url: => %s', statusCode, documentUrl);

        if (documentUrl.indexOf(this._url.hostname) < 0) {
            this._onFinishLoad(documentUrl);
            return;
        }

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

            _this._addToQueue(url, _this.onHandleRequest.bind(_this));
        });
        this._onFinishLoad(documentUrl);
    },

    /**
     * General request error handler function
     * @param {String} url   — broken url
     * @param {Error}  error — error instance
     * @protected
     */
    onError: function (url, error) {
        this._logger.error('Error occur for url: => %s. Error: => %s', url, error);
    },

    /**
     * onDone callback function
     * @protected
     */
    onDone: function (brokenUrls) {
        this._logger
            .info('FINISH to crawl pages')
            .warn(brokenUrls.getAll());
        return brokenUrls;
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

        this._brokenUrls = BrokenLinks.create();

        this._url = Url.parse(url);
        this._logger
            .info('START to crawl pages')
            .info('It can be take a long time. Please wait ...');
        this._addToQueue(url, this.onHandleRequest.bind(this));
    },

    /**
     * Checks if loading queue is full
     * @returns {boolean}
     * @private
     */
    _isQueueFull: function () {
        return this._active.length >= this.getOption('concurrent');
    },

    /**
     * Adds item to check queue
     * @param {String} url - request url
     * @param {Function} done callback function
     * @private
     */
    _addToQueue: function (url, done) {
        url = url.replace(/\/$/, '');

        if (this._processed[url]) {
            return;
        }

        this._processed[url] = true;

        if (this._isQueueFull()) {
            this._pending.push({ u: url, d: done });
        } else {
            this.load(url, done);
        }
    },

    _onFinishLoad: function (url) {
        var i = this._active.indexOf(url);
        this._active.splice(i, 1);

        if (!this._isQueueFull()) {
            var next = this._pending.shift();
            if (next) {
                this.load(next.u, next.d);
            } else if (!this._active.length) {
                this.getOption('done').call(this);
            }
        }
    },

    /**
     * Loads data from given url with help of request module
     * @param {String} url - request url
     * @param {Function} done - function for parsing and processing response body
     */

    load1: function (url, done) {
        this._active.push(url);

        /**
         * Callback function for process results of request
         * @param {Error} error - error object
         * @param {HttpResponse} res - response object
         * @returns {*}
         */
        function callback (error, res) {
            if (error) {
                return this.getOption('error')(url, error);
            }

            done.call(this, new Document(url, res));
            this._onFinishLoad(url);
        }

        request({ url: url, headers: this.getOption('headers') }, callback.bind(this));
    },

    load: function (url, done) {
        this._active.push(url);
        curl.request({
            url: url,
            headers: this.getOption('headers'),
            retries: 1,
            timeout: 5000,
            scope: this,
            include: true,
            redirects: 10
        }, function (error, data) {
            if (error) {
                return this.getOption('error')(url, error);
            }

            var res = parser.parseResponse(data);
            if (+res.statusCode === 301 || +res.statusCode === 302) {
                if (res.headers['Location'] && this.__self.isString(res.headers['Location'])) {
                    return this.load(Url.resolve(this._url.href, res.headers[ 'Location' ]), done);
                } else {
                    return;
                }
            }

            done.call(this, new Document(url, res));
        });
    }
}, {
    /**
     * Checks if given object is instance of Object
     * @param {Object|*} obj
     * @returns {boolean} true if obj is instance of Object class
     */
    isObject: function (obj) {
        return !!obj && typeof obj === 'object';
    },

    /**
     * Checks if given object is instance of Function
     * @param {Object|*} obj
     * @returns {boolean} true if obj is Function
     */
    isFunction: function (obj) {
        return !!(obj && obj.constructor && obj.call && obj.apply);
    },

    /**
     * Checks if given object is instance of String
     * @param {Object|*} obj
     * @returns {boolean} true if obj is String
     */
    isString: function (obj) {
        return typeof obj === 'string' || obj instanceof String;
    },

    DEFAULT: {
        concurrent: 5,
        logs: false,
        headers: { 'user-agent': 'node-spider' },
        protocols: ['http:', 'https:'],
        checkOuterUrls: false,
        exclude: []
    },
    CONSTANTS: {
        URL_REGEXP: /https?\:\/\/\w+((\:\d+)?\/\S*)?/
    }
});
