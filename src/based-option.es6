import _ from 'lodash';
import Base from './base';

/**
 * @exports
 * @class BasedOption
 * @desc Implements options set and get logic
 */
export default class BasedOption extends Base {
    /**
     * Sets value to options model for given option field name
     * @param {Object} options      — configuration object
     * @param {String} name         - name of option field
     * @param {*}      defaultValue - option default value
     * @returns {BasedOption}
     * @public
     */
    setOption (options, name, defaultValue) {
        /**
         * Options hash
         * @type {Object}
         */
        this._options = this._options || {};
        this._options[name] = options[name] || defaultValue;
        if (!_.isFunction(this._options[name]) && !_.isObject(this._options[name])) {
            this._logger.info('Set option [%s] => %s', name, this._options[name]);
        }
        return this;
    }

    /**
     * Returns option value by given option name
     * @param {String} name of option
     * @returns {*}
     * @public
     */
    getOption (name) {
        return this._options[name];
    }
}
