import Base  from './base';
import Util  from './util';

/**
 * @exports
 * @class BasedOption
 * @desc Implements rules set and get logic
 */
export default class BasedRule extends Base {
    /**
     * Sets value to rules model for given rule field name
     * @param {Object} rules        — rules object
     * @param {String} name         - name of rule field
     * @param {*}      defaultValue - rule default value
     * @returns {BasedRule}
     * @public
     */
    setRule(rules, name, defaultValue) {
        this._rules = this._rules || {};
        this._rules[name] = rules[name] || defaultValue;
        if (!Util.isFunction(this._rules[name])) {
            this._logger.info('Set rule [%s] => %s', name, this._rules[name]);
        }
        return this;
    }

    /**
     * Returns rule value by given rule name
     * @param {String} name — rule name
     * @returns {*}
     * @public
     */
    getRule(name) {
        return this._rules[name];
    }
}
