import path from 'path';
import Logger from 'bem-site-logger';
import Checker  from '../checker';
import ReporterJson from '../reporters/json';
import ReporterHtml from '../reporters/html';

const logger = Logger.setOptions({ level: 'info', useDate: false }).createLogger(module);

/**
 * Runs application from cli interface
 * @param {Object}    [options]                            configuration object
 * @param {String}    [options.mode]                       mode of checking ("website", "section" or "page")
 * @param {Number}    [options.concurrent]                 number of concurrent requests
 * @param {Number}    [options.requestRetriesAmount]       number of attempts for request if it fails at first
 * @param {Number}    [options.requestTimeout]             request timeout (in milliseconds)
 * @param {Boolean}   [options.checkExternalUrls]          set `true` for check outer links
 * @trows Error
 */
export function run (options) {
    var configFileName = options.config,
        config;

    try {
        config = require(path.join(process.cwd(), configFileName));
    } catch (error) {
        throw new Error('Configuration file not found');
    }

    ['concurrent', 'requestRetriesAmount', 'requestTimeout', 'checkExternalUrls', 'mode'].forEach(item => {
        if (options[item]) {
            config[item] = options[item];
        }
    });

    config.onDone = (statistic) => {
        logger.info('finish to analyze pages');

        logger
            .info('-- Time: [%s] seconds', statistic.getTime()/1000)
            .info('-- Internal urls: [%s]', statistic.getInternalCount())
            .info('-- External urls: [%s]', statistic.getExternalCount())
            .info('-- Broken urls: [%s]', statistic.getBrokenCount())
            .info('-- Total urls: [%s]', statistic.getAllCount())
            .info('-- Broken urls percentage: [%s] %', (statistic.getBrokenCount() * 100) / statistic.getAllCount());

        var reporters = [
            new ReporterJson(options),
            new ReporterHtml(options)
        ];

        reporters.map(item => {
            return item.createReport(path.basename(configFileName, '.js'), statistic, config);
        });
    };
    
    (new Checker(config)).start(options.url || config.url);
}
