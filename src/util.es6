var inherit = require('inherit');

module.exports = inherit({}, {
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
    }
});
