var Url = require('url'),
    inherit = require('inherit'),
    BasedRule = require('./based-rule');

module.exports = inherit(BasedRule, {
    _initial: undefined,
    _skipRules: undefined, // cached skip rules model

    /**
     * Initialize predefined skip rules for prevent deeper crawling for given url
     * @param {String} initial - initial url
     * @returns {{skipNonAcceptableProtocols: Function, skipOuterUrls: Function, skipExcludedUrls: Function}}
     */
    initSkipRules: function (initial) {
        this._initial = initial;
        this._skipRules = (function (_this) {
            return {
                /**
                 * Check if protocol of given url satisfies acceptedSchemes criteria
                 * @param {String} url - request url
                 * @returns {boolean} — result flag
                 * @private
                 */
                skipNonAcceptableProtocols: function (url) {
                    return _this.getRule('acceptedSchemes').indexOf(Url.parse(url).protocol) < 0;
                },

                /**
                 * Checks if given url has the different hostname then initial
                 * (If 'checkExternalUrls' rule is set to true)
                 * @param {String} url — request url
                 * @param {String} initial - initial url
                 * @returns {boolean} — result flag
                 * @private
                 */
                skipOuterUrls: function (url, initial) {
                    return !_this.getRule('checkExternalUrls') && url.indexOf(_this._initial['hostname']) < 0;
                },

                /**
                 * Checks if given url has host different then host of initial url
                 * @param {String} url — request url
                 * @returns {boolean} — result flag
                 * @private
                 */
                skipExcludedUrls: function (url) {
                    return _this.getRule('excludeLinkPatterns').some(function (pattern) {
                        return !!url.match(pattern);
                    });
                }
            };
        })(this);
    },

    /**
     * Returns true if anyone of skip conditions returns true
     * @param {String} url - request url
     * @returns {boolean} — result flag
     */
    isNeedToSkipUrl: function (url) {
        return Object.keys(this._skipRules).reduce(function (prev, fName) {
            prev = prev || this._skipRules[fName](url);
            return prev;
        }.bind(this), false);
    }
});
