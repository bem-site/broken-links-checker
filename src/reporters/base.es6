import fs from 'fs';
import path from 'path';
import moment from 'moment';
import Logger from 'bem-site-logger';
import Util from '../util';

export default class ReporterBase {

    constructor(options = {}) {
        options.logger = options.logger || {
            level: 'info'
        };
        options.logger.useDate = false;
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
     * @param  {String} configurationName - name of configuration file
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
     * @param {String} configurationName - name of configuration
     * @param {String} type - report type
     * @param {String} content - report content
     * @returns {Promise}
     */
    saveReportFile(configurationName, type, content) {
        this.createReportFolder(configurationName);
        var fileName = `${moment().format("DD-MM-YYYY:hh:mm:ss")}.${type}`,
            filePath = path.join(Util.getReportsDirectory(), configurationName, fileName);

        return new Promise((resolve, reject) => {
            fs.writeFile(filePath, content, { encoding: 'utf-8' }, error => {
                if (error) {
                    this._logger.error('Error occur while saving file: %s', filePath);
                    reject(error);
                } else {
                    this._logger.info('Report saved: %s', filePath);
                    resolve();
                }
            });
        });
    }

    createReport() {
        // TODO override in child class
    }
}
