import path from 'path';
import fs from 'fs';
import _ from 'lodash';
import moment from 'moment';
import ReporterBase from './base';

/**
 * @class ReporterHtml
 * @desc Class for creating html report
 */
export default class ReporterHtml extends ReporterBase {

    createReport(configurationName, statistic, options) {
        this._logger.info('create html report');
        var report = {
                name: options.url,
                date: moment().format('DD-MM-YYYY:hh:mm:ss'),
                internalCount: statistic.getInternalCount(),
                externalCount: statistic.getExternalCount(),
                totalCount: statistic.getAllCount(),
                brokenCount: statistic.getBrokenCount(),
                broken: statistic.getBroken().getAll(),
                options: options
            },
            htmlTemplate = fs.readFileSync(path.resolve(__dirname, '../../src/assets/report.html'), { encoding: 'utf-8' }),
            compiled = _.template(htmlTemplate);

        return this.saveReportFile(configurationName, 'html', compiled({ report: report }, report.date));
    }
}
