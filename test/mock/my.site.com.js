module.exports = {
    "url": "http://localhost:3000",
    "logger": {
        "level": "info"
    },
    "concurrent": 10,
    "requestHeaders": {
        "user-agent": "node-spider"
    },
    "requestRetriesAmount": 2,
    "requestTimeout": 200,
    "acceptedSchemes": [
        "http:"
    ],
    "checkExternalUrls": false,
    "excludeLinkPatterns": []
};
