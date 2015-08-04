import Logger  from 'bem-site-logger'

/**
 * @exports
 * @class Base
 * @desc Base class for application modules
 */
export default class Base {
    /**
     * Constructor function
     * @param  {Object} options object
     * @param  {Module} module - nodejs module instance
     * @return {Base}
     */
    constructor (options, module) {
        options = options || {};
        var logOpts = options['logger'] || { level: 'debug' };
        logOpts.useDate = false;

        /**
         * Instance of class logger
         * @param {Object} loggerOptions - log settings
         */
        this._logger = Logger.setOptions(logOpts).createLogger(module);
    }
}
