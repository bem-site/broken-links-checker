import _ from 'lodash';
import RoutePattern from 'route-pattern';
import Url from 'url';
import Checker from './checker';

/**
 * @class LinkAnalyzer
 * @desc Hold logic about recursive links processing
 */
export default class LinkAnalyzer {
    /**
     * Initialize predefined skip rules for prevent deeper crawling for given url
     * @param {String} initial url
     * @param {Object} options object
     * @constructor
     */
    constructor(initial, options) {
        /**
         * Parsed url object from Url.parse
         * @param  {Object} initial url - base (root) url where analyze started from
         * @return {Object} options object
         */
        this._url = Url.parse(initial);
        this._options = options;
    }

    /**
     * Returns options model
     * @returns {BasedOption}
     */
    get options() {
        return this._options;
    }

    /**
     * Returns initial url as parsed url string via Url module
     * @returns {Object}
     */
    get url() {
        return this._url;
    }

    /**
     * Returns true if anyone of skip conditions returns true
     * @param {String} url url of link
     * @param {String} baseUrl url of page where link is
     * @returns {boolean} result flag
     * @public
     */
    isNeedToSkipUrl(url, baseUrl) {
        return [
            '_skipNonAcceptableProtocols',
            '_skipExternalUrls',
            '_skipExcludedUrls',
            '_skipOnMode'
        ].some(fName => {
            return this[fName](url, baseUrl);
        });
    }

    /**
     * Checks if given url is external
     * @param  {String}  url request url
     * @return {boolean} true if url is external. false otherwise
     * @public
     */
    isExternal(url) {
        return url.indexOf(this._url['hostname']) < 0;
    }

    /**
     * Check if protocol of given url satisfies acceptedSchemes criteria
     * @param {String} url request url
     * @returns {boolean} result flag
     * @private
     */
    _skipNonAcceptableProtocols(url) {
        return this._options.getOption('acceptedSchemes').indexOf(Url.parse(url).protocol) < 0;
    }

    /**
     * Checks if given url has the different hostname then initial
     * (If 'checkExternalUrls'rule is set to true)
     * @param {String} url request url
     * @returns {boolean} result flag
     * @private
     */
    _skipExternalUrls(url) {
        return !this._options.getOption('checkExternalUrls') && url.indexOf(this._url['hostname']) < 0;
    }

    /**
     * Checks if given url has host different then host of initial url
     * @param {String} url request
     * @returns {boolean} result flag
     * @private
     */
    _skipExcludedUrls(url) {
        return this._options.getOption('excludeLinkPatterns').some(pattern => {
            return _.isRegExp(pattern) ?
                !!url.match(pattern) : RoutePattern.fromString(pattern).matches(url);
        });
    }

    /**
     * Checks if given url is need to be check depending on mode configuration option
     * @type {boolean} result flag
     * @private
     */
    _skipOnMode(url, baseUrl) {
        var mode = this._options.getOption('mode'),
            baseUrlParsed = Url.parse(baseUrl);

        const MODES = Checker.CONSTANTS.MODE;
        if (mode === MODES.PAGE) {
            return baseUrlParsed.path !== this._url.path;
        } else if (mode === MODES.SECTION) {
            return baseUrlParsed.path.indexOf(this._url.path) === -1;
        } else {
            return false;
        }
    }
}
