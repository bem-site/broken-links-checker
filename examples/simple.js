var BrokenLinksChecker = require('../index').BrokenLinksChecker,
    checker;

checker = new BrokenLinksChecker({
    "url": "http://tadatuta.ru",
    "logger": {
        "level": "debug"
    },
    "concurrent": 50,
    "requestHeaders": {
        "user-agent": "node-spider"
    },
    "requestRetriesAmount": 5,
    "requestTimeout": 5000,
    "acceptedSchemes": [
        "http:",
        "https:"
    ],
    "checkExternalUrls": true,
    "excludeLinkPatterns": []
});

checker.start('http://tadatuta.ru');
