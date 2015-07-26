var connect = require('connect'),
    static = require('serve-static'),
    directory = __dirname,
    port = process.env.PORT || 3000;

(function startServer() {
    connect()
        .use(static(directory))
        .listen(port);

    console.log('Listening on port ' + port);
})();
