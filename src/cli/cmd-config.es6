import fs  from 'fs';
import path  from 'path';
import Logger from 'bem-site-logger';
import Checker  from '../checker';
import Util  from '../util';

const logger = Logger.setOptions({ level: 'info', useDate: false }).createLogger(module);

export default function () {
    return this
        .title('Config initialization command')
        .helpful()
        .opt()
            .name('name')
            .title('Name of configuration file')
            .short('n').long('name')
            .req()
            .end()
        .act(opts => {
            var fileName = opts.name.replace(/\//g, '') + '.json';
            try {
                fs.mkdirSync(Util.getConfigurationDirectory());
            } catch (error) {}

            var config = [
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

            try {
                fs.writeFileSync(path.join(Util.getConfigurationDirectory(), fileName),
                    JSON.stringify(config, null, 4), 'utf-8');
                logger.info('Configuration file: => %s has been generated successfully', fileName);
            } catch (error) {
                logger.error('Error occur while saving configuration file: %s', fileName);
                logger.error(error.message);
            }
            return void 0;
        });
};
