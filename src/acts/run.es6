import fs  from 'fs';
import path  from 'path';
import Logger from 'bem-site-logger';
import Table  from 'easy-table';
import Checker  from '../checker';
import Util  from '../util';

const logger = Logger.setOptions({ level: 'info', useDate: false }).createLogger(module);

export function run (options) {
    var configFileName = path.join(Util.getConfigurationDirectory(), options.config),
        config;

    try {
        config = fs.readFileSync(configFileName, { encoding: 'utf-8' });
    } catch (error) {
        throw new Error('Configuration file not found');
    }

    try {
        config = JSON.parse(config);
    } catch (error) {
        throw new Error('Configuration file has syntax errors');
    }

    config.onDone = (statistic) => {
        logger.info('FINISH to analyze pages');

        var table = new Table();
        statistic.getBroken().getAll().forEach((item, index) => {
            table.cell('#', index);
            table.cell('Code', item.code);
            table.cell('href', item.advanced.href);
            table.cell('page', item.advanced.page);
            table.newRow();
        });
        console.log(table.toString());

        logger
            .info('-- Internal urls: [%s]', statistic.getInternalCount())
            .info('-- External urls: [%s]', statistic.getExternalCount())
            .info('-- Broken urls: [%s]', statistic.getBrokenCount())
            .info('-- Total urls: [%s]', statistic.getAllCount())
            .info('-- Broken urls percentage: [%s] %', (statistic.getBrokenCount() * 100) / statistic.getAllCount());
    };

    // TODO allow to override params from configuration file here
    //
    (new Checker(config)).start(config.url);
}
