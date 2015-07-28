var Crawler = require('./src/crawler'),
    Crawler2 = require('./src/crawler2'),
    crawler,
    crawler2;

crawler = new Crawler({
    concurrent: 20,
    logger: { level: 'debug' },
    exclude: [
        /\/__example\//i,
        /\/forum\//i,
        /2\-10/i,
        /st\.yandex\-team\.ru/i
    ],
    checkOuterUrls: false
});

crawler2 = new Crawler2({
    logger: { level: 'debug' }
});

crawler2.start('https://ru.bem.info');

// crawler.start('https://ru.bem.info');
