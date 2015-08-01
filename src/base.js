var inherit = require('inherit'),
    Logger = require('bem-site-logger');

module.exports = inherit({
    _logger: undefined, // logger instance

    __constructor: function (options, module) {
        options = options || {};

        var loggerOptions = options['logger'] || { level: 'debug' };
        loggerOptions.useDate = false;
        this._logger = Logger.setOptions(loggerOptions).createLogger(module);
    }
});
