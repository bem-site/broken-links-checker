var Crawler = require('./src/crawler'),
    crawler;

crawler = new Crawler({
    concurrent: 100,
    logger: { level: 'debug' },
    excludeLinkPatterns: [
        /\/__example/i,
        /\/forum/i,
        // /\/libs/i,
        /2\-10/i,
        /st\.yandex\-team\.ru/i
    ],
    checkExternalUrls: false
});

crawler.start('https://en.bem.info');
