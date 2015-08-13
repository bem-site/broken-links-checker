import fs from 'fs';
import _ from 'lodash';
import ReporterBase from './base';

export default class ReporterHtml extends ReporterBase {

    createReport(configurationName, statistic) {
        this._logger.info('create html report');
        var report = {
                internalCount: statistic.getInternalCount(),
                externalCount: statistic.getExternalCount(),
                totalCount: statistic.getAllCount(),
                brokenCount: statistic.getBrokenCount(),
                broken: statistic.getBroken().getAll()
            },
            htmlTemplate = fs.readFileSync('./src/assets/report.html', { encoding: 'utf-8' }),
            compiled = _.template(htmlTemplate);

        return this.saveReportFile(configurationName, 'html', compiled({ report: report }));
    }
}
