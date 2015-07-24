var inherit = require('inherit'),
    BrokenUrls = module.exports = inherit({
        _urls: undefined,

        __constructor: function () {
            this._urls = [];
        },

        add: function (url, code) {
            this._urls.push({ url: url, code: code });
            return this;
        },

        getAll: function () {
            return this._urls;
        },

        getByCode: function (code) {
            return this.getAll().filter(function (item) {
                return item.code === code;
            });
        },

        get404: function () {
            return this.getByCode(404);
        },

        get500: function () {
            return this.getByCode(500);
        },

        clear: function () {
            this._urls = [];
            return this;
        }
    }, {
        create: function () {
            return new BrokenUrls();
        }
    });
