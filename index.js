var Crawler = require('./src/crawler'),
    Crawler2 = require('./src/crawler2'),
    crawler,
    crawler2;

crawler = new Crawler({
    concurrent: 100,
    logger: { level: 'verbose' },
    exclude: [
        /\/__example/i,
        /\/forum/i,
        // /\/libs/i,
        /2\-10/i,
        /st\.yandex\-team\.ru/i
    ],
    checkOuterUrls: false
});

/*
crawler2 = new Crawler2({
    logger: { level: 'verbose' },
    excludeExternalLinks: true,
    excludeLinkPatterns: [
        /\/__example\//i,
        /\/libs/i,
        /\/forum/i,
        /2\-10/i,
        /st\.yandex\-team\.ru/i
    ],
    maxSocketsPerHost: 50
});
*/
//crawler2.start('https://ru.bem.info');

crawler.start('https://lego.yandex-team.ru');
