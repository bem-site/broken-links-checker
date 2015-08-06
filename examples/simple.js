var BrokenLinksChecker = require('../index').BrokenLinksChecker,
    checker;

checker = new BrokenLinksChecker({
    concurrent: 100,
    logger: { level: 'info' },
    requestRetriesAmount: 5,
    requestTimeout: 10000,
    excludeLinkPatterns: [
        /\/__example/i,
        /\/forum/i,
        /\/optimizers\/svgo/i,
        /\/optimizers\/csso/i
    ],
    acceptedSchemes: ['http:', 'https:'],
    checkExternalUrls: false
    });

// checker.start('http://ru.bem.info');
// checker.start('https://legoa.test.yandex-team.ru');
checker.start('https://ru.bem.info.nodejs.test.spec.yandex.net');
