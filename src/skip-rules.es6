import Url  from 'url';
import BasedRule  from './based-rule';

export default class SkipRules extends BasedRule {
    /**
     * Initialize predefined skip rules for prevent deeper crawling for given url
     * @param {String} initial - initial url
     * @returns {{skipNonAcceptableProtocols: Function, skipOuterUrls: Function, skipExcludedUrls: Function}}
     */
    initSkipRules(initial) {
        this._initial = initial;
        this._skipRules = {
            /**
             * Check if protocol of given url satisfies acceptedSchemes criteria
             * @param {String} url - request url
             * @returns {boolean} — result flag
             * @private
             */
            skipNonAcceptableProtocols: url => {
                return this.getRule('acceptedSchemes').indexOf(Url.parse(url).protocol) < 0;
            },

            /**
             * Checks if given url has the different hostname then initial
             * (If 'checkExternalUrls' rule is set to true)
             * @param {String} url — request url
             * @returns {boolean} — result flag
             * @private
             */
            skipExternalUrls: url => {
                return !this.getRule('checkExternalUrls') && url.indexOf(this._initial['hostname']) < 0;
            },

            /**
             * Checks if given url has host different then host of initial url
             * @param {String} url — request url
             * @returns {boolean} — result flag
             * @private
             */
            skipExcludedUrls: url => {
                return this.getRule('excludeLinkPatterns').some(pattern => {
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
}
