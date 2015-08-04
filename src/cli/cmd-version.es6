import Logger from 'bem-site-logger';
const logger = Logger.setOptions({ level: 'info', useDate: false }).createLogger(module);

export default function () {
    return this
        .title('Show tool version command')
        .act(() => {
            var p = require('../../package.json');
            logger
                .info('Application name: => %s', p['name'])
                .info('Application version: => %s', p.version);
            return void 0;
        });
}
