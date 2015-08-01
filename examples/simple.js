var Crawler = require('../index').Crawler,
    crawler;

crawler = new Crawler({
    concurrent: 100,
    logger: { level: 'info' },
    excludeLinkPatterns: [
        /\/__example/i,
        /\/forum/i
    ],
    checkExternalUrls: false
});

crawler.start('https://ru.bem.info');
