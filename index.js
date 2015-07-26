var Crawler = require('./src/crawler'),
    crawler;

crawler = new Crawler({
    concurrent: 5,
    logger: { level: 'verbose' },
    exclude: [
        /\/__example\//i,
        /\/forum\//i
    ]
});

crawler.start('http://127.0.0.1:3000');
