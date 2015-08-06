import fs  from 'fs';
import path  from 'path';
import Logger from 'bem-site-logger';
import Checker  from '../checker';
import Util  from '../util';

const logger = Logger.setOptions({ level: 'info', useDate: false }).createLogger(module);

/**
 * Creates configuration directory inside process.cwd() folder
 */
export function createConfigsDir() {
    try {
        fs.mkdirSync(Util.getConfigurationDirectory());
    } catch (error) {}
}

/**
 * Creates stub configuration file with default params
 * @return {Object} - stub config object
 */
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

/**
 * Generates stub configuration file inside configuration folder
 * @param  {String} fileName - name of file
 * @return {Boolean} returns true if success, false otherwise
 */
export function createConfigFile(fileName) {
    fileName = fileName.replace(/\//g, '') + '.js';

    createConfigsDir();
    try {
        fs.writeFileSync(path.join(Util.getConfigurationDirectory(), fileName),
            'module.exports = ' + JSON.stringify(createConfigStub(), null, 4), 'utf-8');
        logger.info('Configuration file: => %s has been generated successfully', fileName);
        return true;
    } catch (error) {
        logger
            .error('Error occur while saving configuration file: %s', fileName)
            .error(error.message);
        return false;
    }
}
