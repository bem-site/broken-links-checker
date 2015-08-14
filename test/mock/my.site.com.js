module.exports = {
    "url": "http://localhost:3000",
    "logger": {
        "level": "info"
    },
    "concurrent": 10,
    "requestHeaders": {
        "user-agent": "node-spider"
    },
    "requestRetriesAmount": 5,
    "requestTimeout": 5000,
    "acceptedSchemes": [
        "http:"
    ],
    "checkExternalUrls": false,
    "excludeLinkPatterns": []
}
