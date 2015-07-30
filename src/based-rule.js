var inherit = require('inherit'),
    Base = require('./base'),
    Util = require('./util');

module.exports = inherit([Base, Util], {
    _rules: undefined, // rules (settings) for parsing

    /**
     * Sets value to rules model for given rule field name
     * @param {Object} rules        — rules object
     * @param {String} name         - name of rule field
     * @param {*}      defaultValue - rule default value
     * @returns {exports}
     */
    setRule: function (rules, name, defaultValue) {
        this._rules = this._rules || {};
        this._rules[name] = rules[name] || defaultValue;
        if (!this.__self.isFunction(this._rules[name])) {
            this._logger.debug('Set rule [%s] => %s', name, this._rules[name]);
        }
        return this;
    },

    /**
     * Returns rule value by given rule name
     * @param {String} name — rule name
     * @returns {*}
     */
    getRule: function (name) {
        return this._rules[name];
    }
});
