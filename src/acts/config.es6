import fs  from 'fs';
import path  from 'path';
import Logger from 'bem-site-logger';
import Checker  from '../checker';
import Util  from '../util';

const logger = Logger.setOptions({ level: 'info', useDate: false }).createLogger(module);

export function createConfigsDir() {
    try {
        fs.mkdirSync(Util.getConfigurationDirectory());
    } catch (error) {}
}

export function createConfigStub() {
    return [
        'concurrent',
        'requestHeaders',
        'requestRetriesAmount',
        'requestTimeout',
        'acceptedSchemes',
        'checkExternalUrls',
        'excludeLinkPatterns'
    ].reduce((prev, item) => {
        prev[item] = Checker.DEFAULT[item];
        return prev;
    }, {
        url: 'http://my.site.com',
        logger: { level: 'info' }
    });
}

export function createConfigFile(fileName) {
    fileName = fileName.replace(/\//g, '') + '.json';

    createConfigsDir();
    try {
        fs.writeFileSync(path.join(Util.getConfigurationDirectory(), fileName),
            JSON.stringify(createConfigStub(), null, 4), 'utf-8');
        logger.info('Configuration file: => %s has been generated successfully', fileName);
        return true;
    } catch (error) {
        logger
            .error('Error occur while saving configuration file: %s', fileName)
            .error(error.message);
        return false;
    }
}
