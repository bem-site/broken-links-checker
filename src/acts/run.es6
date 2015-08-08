import path from 'path';
import Logger from 'bem-site-logger';
import Checker  from '../checker';
import ReporterJson from '../reporters/json';

const logger = Logger.setOptions({ level: 'info', useDate: false }).createLogger(module);

export function run (options) {
    var configFileName = options.config,
        config;

    try {
        config = require(path.join(process.cwd(), configFileName));
    } catch (error) {
        console.log(error);
        throw new Error('Configuration file not found');
    }

    config.onDone = (statistic) => {
        logger.info('finish to analyze pages');

        logger
            .info('-- Internal urls: [%s]', statistic.getInternalCount())
            .info('-- External urls: [%s]', statistic.getExternalCount())
            .info('-- Broken urls: [%s]', statistic.getBrokenCount())
            .info('-- Total urls: [%s]', statistic.getAllCount())
            .info('-- Broken urls percentage: [%s] %', (statistic.getBrokenCount() * 100) / statistic.getAllCount());

        var reportDirName = path.basename(configFileName, '.js');
        return (new ReporterJson(options)).createReport(reportDirName, statistic);
    };

    // TODO allow to override params from configuration file here
    (new Checker(config)).start(config.url);
}
