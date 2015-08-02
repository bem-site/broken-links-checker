var inherit = require('inherit'),
    Broken = require('./broken'),
    Statistic;

module.exports = Statistic = inherit({
    _broken: undefined,

    _countInternal: undefined,
    _countExternal: undefined,

    __constructor: function () {
        this._broken = Broken.create();

        this._countExternal = 0;
        this._countInternal = 0;
    },

    /**
     * Increase count of processed internal website links
     */
    increaseInternalCount: function () {
        this._countInternal++;
    },

    /**
     * Increase count of processed external website links
     */
    increaseExternalCount: function () {
        this._countExternal++;
    },

    /**
     * Returns amount of processed internal website links
     * @returns {Number}
     */
    getInternalCount: function () {
        return this._countInternal;
    },

    /**
     * Returns amount of processed external website links
     * @returns {Number}
     */
    getExternalCount: function () {
        return this._countExternal;
    },

    /**
     * Returns total amount of processed links (internal and external)
     * @returns {Number}
     */
    getAllCount: function () {
        return this.getExternalCount() + this.getInternalCount();
    },

    /**
     * Returns model of broken links
     * @returns {Broken}
     */
    getBroken: function () {
        return this._broken;
    },

    /**
     * Returns amount of founded broken links
     * @returns {Number}
     */
    getBrokenCount: function () {
        return this.getBroken().getAll().length;
    }
}, {
    create: function () {
        return new Statistic();
    }
});
