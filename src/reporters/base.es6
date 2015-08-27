import fs from 'fs';
import path from 'path';
import Logger from 'bem-site-logger';
import Util from '../util';

/**
 * @class ReporterBase
 * @desc Base reporter class
 */
export default class ReporterBase {

    /**
     * constructor
     * @param  {Object} reporter options
     */
    constructor(options = {}) {
        options.logger = options.logger || {
            level: 'info'
        };
        options.logger.useDate = false;

        /**
         * Logger instance
         * @param {Logger} options.logger
         */
        this._logger = Logger.setOptions(options.logger).createLogger(module);
    }

    /**
     * Creates reports folder in current work directory
     * @return void 0
     * @protected
     */
    createReportsFolder() {
        try {
            fs.mkdirSync(Util.getReportsDirectory());
        } catch (error) {}
    }

    /**
     * Creates folder named as given configurationName inside reports folder
     * @param  {String} configurationName name of configuration file
     * @return void 0
     * @protected
     */
    createReportFolder(configurationName) {
        this.createReportsFolder();
        try {
            fs.mkdirSync(path.join(Util.getReportsDirectory(), configurationName));
        } catch (error) {}
    }

    /**
     * Saves report to file
     * @param {String} configurationName name of configuration
     * @param {String} type of report
     * @param {String} content of report
     * @param {String} date formatted
     * @returns {Promise}
     */
    saveReportFile(configurationName, type, content, date) {
        this.createReportFolder(configurationName);
        var fileName = `${date}.${type}`,
            filePath = path.join(Util.getReportsDirectory(), configurationName, fileName);

        fs.writeFileSync(filePath, content, { encoding: 'utf-8' });
        this._logger.info('Report saved: %s', filePath);
    }
}
