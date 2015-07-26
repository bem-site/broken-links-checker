/* jshint ignore:start */
var cheerio = require('cheerio'),
    inherit = require('inherit'),
    Url = require('url'),

    Document = module.exports = inherit({
        /**
         * Constructor function
         * @param {String} url - request url
         * @param {HttpResponse} res - request object
         * @private
         */
        __constructor: function (url, res) {
            this.res = res;
            this.url = url;
        },

        /**
         * Parses response body by cheerio
         * @returns {*|any|Object|undefined}
         */
        get $() {
            return this.$ = cheerio.load(this.res.body);
        },

        /**
         * Resolves parsed link against document url
         * @param {String} link - document link
         */
        resolve: function (link) {
            return Url.resolve(this.url, link);
        }
    });
/* jshint ignore:end */
