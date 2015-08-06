'use strict';

import commandConfig from './cmd-config';
import commandRun from './cmd-run';
import commandVersion from './cmd-version';

function command() {
    return require('coa').Cmd()
        .name(process.argv[1])
        .title('Broken links checker tool')
        .helpful()
        .cmd().name('config').apply(commandConfig).end()
        .cmd().name('run').apply(commandRun).end()
        .cmd().name('version').apply(commandVersion).end()
        .completable();
}

export default command();
