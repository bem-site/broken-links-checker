import Url from 'url';
import Checker from './checker';

export default class LinkAnalyzer {
    /**
     * Initialize predefined skip rules for prevent deeper crawling for given url
     * @param {String} initial - initial url
     * @param {Object} options - options object
     * @constructor
     */
    constructor(initial, options) {
        this._url = Url.parse(initial);
        this._options = options;
    }

    /**
     * Returns true if anyone of skip conditions returns true
     * @param {String} url - url of link
     * @param {String} baseUrl - url of page where link is
     * @returns {boolean} — result flag
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

    get url() {
        return this._url;
    }

    /**
     * Check if protocol of given url satisfies acceptedSchemes criteria
     * @param {String} url - request url
     * @returns {boolean} — result flag
     * @private
     */
    _skipNonAcceptableProtocols(url) {
        return this._options.getOption('acceptedSchemes').indexOf(Url.parse(url).protocol) < 0;
    }

    /**
     * Checks if given url has the different hostname then initial
     * (If 'checkExternalUrls' rule is set to true)
     * @param {String} url — request url
     * @returns {boolean} — result flag
     * @private
     */
    _skipExternalUrls(url) {
        return !this._options.getOption('checkExternalUrls') && url.indexOf(this._url['hostname']) < 0;
    }

    /**
     * Checks if given url has host different then host of initial url
     * @param {String} url — request url
     * @returns {boolean} — result flag
     * @private
     */
    _skipExcludedUrls(url) {
        return this._options.getOption('excludeLinkPatterns').some(pattern => {
            return !!url.match(pattern);
        });
    }

    /**
     * Checks if given url is need to be check depending on mode configuration option
     * @type {boolean} - result flag
     * @private
     */
    _skipOnMode(url, baseUrl) {
        var mode = this._options.getOption('mode');
        const MODES = Checker.CONSTANTS.MODE;

        if (mode === MODES.PAGE) {
            return Url.parse(baseUrl).path !== this._url.path;
        } else if (mode === MODES.SECTION) {
            return url.indexOf(this._url.path) === -1;
        } else {
            return false;
        }
    }
}
