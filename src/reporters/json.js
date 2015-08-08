import ReporterBase from './base';

export default class ReporterJson extends ReporterBase {

    createReport(configurationName, statistic) {
        this._logger.info('create json report');
        var report = {
            internalCount: statistic.getInternalCount(),
            externalCount: statistic.getExternalCount(),
            totalCount: statistic.getAllCount(),
            brokenCount: statistic.getBrokenCount(),
            broken: statistic.getBroken().getAll()
        };

        return this.saveReportFile(configurationName, 'json', JSON.stringify(report, null, 4));
    }
}
