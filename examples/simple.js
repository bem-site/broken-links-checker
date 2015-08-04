var BrokenLinksChecker = require('../index').BrokenLinksChecker,
    checker;

checker = new BrokenLinksChecker({
    concurrent: 100,
    logger: { level: 'info' },
    requestRetriesAmount: 5,
    requestTimeout: 10000,
    excludeLinkPatterns: [
        // /\/__example/i,
        /\/forum/i,
        /\/optimizers\/svgo/i,
        /\/optimizers\/csso/i
    ],
    checkExternalUrls: false
    });

checker.start('https://ru.bem.info');
