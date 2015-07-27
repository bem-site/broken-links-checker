var Crawler = require('./src/crawler'),
    crawler;

crawler = new Crawler({
    concurrent: 20,
    logger: { level: 'debug' },
    exclude: [
        /\/__example\//i,
        /\/forum\//i
    ],
    checkOuterUrls: true
});

crawler.start('https://ru.bem.info');
