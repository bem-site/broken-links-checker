import moment from 'moment';
import ReporterBase from './base';

/**
 * @class ReporterJson
 * @desc Class for creating json report
 */
export default class ReporterJson extends ReporterBase {

    createReport(configurationName, statistic) {
        this._logger.info('create json report');
        var report = {
            date: moment().format('DD-MM-YYYY:hh:mm:ss'),
            internalCount: statistic.getInternalCount(),
            externalCount: statistic.getExternalCount(),
            totalCount: statistic.getAllCount(),
            brokenCount: statistic.getBrokenCount(),
            broken: statistic.getBroken().getAll()
        };

        return this.saveReportFile(configurationName, 'json', JSON.stringify(report, null, 4), report.date);
    }
}
