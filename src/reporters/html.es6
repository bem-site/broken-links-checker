import fs from 'fs';
import _ from 'lodash';
import moment from 'moment';
import ReporterBase from './base';

export default class ReporterHtml extends ReporterBase {

    createReport(configurationName, statistic, options) {
        this._logger.info('create html report');
        var report = {
                name: options.url,
                date: moment().format("DD-MM-YYYY:hh:mm:ss"),
                internalCount: statistic.getInternalCount(),
                externalCount: statistic.getExternalCount(),
                totalCount: statistic.getAllCount(),
                brokenCount: statistic.getBrokenCount(),
                broken: statistic.getBroken().getAll(),
                options: options
            },
            htmlTemplate,
            compiled;

        htmlTemplate = fs.readFileSync('./src/assets/report.html', { encoding: 'utf-8' });
        compiled = _.template(htmlTemplate);

        return this.saveReportFile(configurationName, 'html', compiled({ report: report }));
    }
}
