var inherit = require('inherit'),
    BrokenUrls = module.exports = inherit({
        _urls: undefined,

        /**
         * Constructor function
         * @private
         */
        __constructor: function () {
            this._urls = [];
        },

        /**
         * Add url with given response status code to model of broken links
         * @param {String} url - link url
         * @param {String} baseUrl - page url where links was discovered
         * @param {Number} code - response status code
         * @returns {exports}
         */
        add: function (url, baseUrl, code) {
            this._urls.push({ url: url, baseUrl: baseUrl, code: code });
            return this;
        },

        /**
         * Return all broken url items
         * @returns {Object[]}
         */
        getAll: function () {
            return this._urls;
        },

        /**
         * Return broken url items with given status code
         * @param {Number} code - response status code
         * @returns {Object[]}
         */
        getByCode: function (code) {
            return this.getAll().filter(function (item) {
                return item.code === code;
            });
        },

        /**
         * Returns broken urls with response status equals to 404. Page not found error
         * @returns {Object[]}
         */
        get404: function () {
            return this.getByCode(404);
        },

        /**
         * Returns broken urls with response status equals to 500. Server error
         * @returns {Object[]}
         */
        get500: function () {
            return this.getByCode(500);
        },

        /**
         * Clears broken links model
         * @returns {exports}
         */
        clear: function () {
            this._urls = [];
            return this;
        }
    }, {
        /**
         * Static initializer for BrokenLinks instance
         * @returns {BrokenLinks}
         * @static
         */
        create: function () {
            return new BrokenUrls();
        }
    });
