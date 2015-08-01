var cheerio = require('cheerio'),
    inherit = require('inherit'),
    Url = require('url');

module.exports = inherit({
    _res: undefined,
    _url: undefined,
    _$: undefined,

    /**
     * Constructor function
     * @param {String} url - request url
     * @param {HttpResponse} res - response object
     * @private
     */
    __constructor: function (url, res) {
        this._res = res;
        this._url = url;
        this._$ = cheerio.load(res);
    },

    /**
     * Returns response object
     * @returns {HttpResponse|HttpsResponse}
     */
    get res() {
        return this._res;
    },

    /**
     * Returns document url
     * @returns {String}
     */
    get url() {
        return this._url;
    },

    /**
     * Parses response body parsed by cheerio
     * @returns {*|any|Object|undefined}
     */
    get $() {
        return this._$;
    },

    /**
     * Resolves parsed link against document url
     * @param {String} link - document link
     */
    resolve: function (link) {
        return Url.resolve(this._url, link);
    }
});
