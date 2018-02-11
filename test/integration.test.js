var EOL = require('os').EOL,
    should = require('should'),
    nock = require('nock'),
    BrokenLinksChecker = require('../index').BrokenLinksChecker,
    SERVER_URL = 'http://localhost:3000/',
    htmlBuilder = (function () {
        var prefix = [
            '<!DOCTYPE html>',
            '<html>',
            '    <head lang="en">',
            '        <meta charset="UTF-8">',
            '        <title>Index</title>',
            '    </head>',
            '<body>'
        ].join(EOL);
        suffix = '</body></html>';

        return {
            build: function (links) {
                var result = links.reduce(function (prev, item) {
                    if(!item) {
                        return prev + '<a>' + item + '</a>';
                    }
                    return prev + '<a href = "' + item + '">' + item + '</a>';
                }, '');
                return prefix + result + suffix;
            }
        }
    })();

describe('BrokenLinksChecker', function () {
    afterEach(function () {
        nock.cleanAll();
    });

    it('should simply check given url', function (done) {
        nock(SERVER_URL)
            .get('/')
            .reply(200, 'Hello World');

        var expected = { all: 1, internal: 1, external: 0, broken: 0 };

        runTest({}, expected, function () { return done(); });
    });

    it('should simply check broken url (404)', function (done) {
        nock(SERVER_URL)
            .get('/')
            .reply(404);

        var expected = { all: 1, internal: 1, external: 0, broken: 1 };

        runTest({ requestTimeout: 200 }, expected, function (statistic) {
            statistic.getBroken().get404().should.have.length(1);
            done();
        });
    });

    it('should simply check broken url (500)', function (done) {
        nock(SERVER_URL)
            .get('/')
            .reply(500);

        var expected = { all: 1, internal: 1, external: 0, broken: 1 };

        runTest({ requestTimeout: 200 }, expected, function (statistic) {
            statistic.getBroken().get500().should.have.length(1);
            done();
        });
    });

    it('should skip links without href attributes', function (done) {
        nock(SERVER_URL)
            .get('/')
            .reply(200, htmlBuilder.build([null]));

        var expected = { all: 1, internal: 1, external: 0, broken: 0 };

        runTest({ checkExternalUrls: false }, expected, function () { return done(); });
    });

    it('should not check same url twice (absolute url)', function (done) {
        nock(SERVER_URL)
            .get('/')
            .reply(200, htmlBuilder.build([SERVER_URL]));

        var expected = { all: 1, internal: 1, external: 0, broken: 0 };

        runTest({ checkExternalUrls: false }, expected, function () { return done(); });
    });

    it('should not check same url twice (relative url)', function (done) {
        nock(SERVER_URL)
            .get('/')
            .reply(200, htmlBuilder.build(['/']));

        var expected = { all: 1, internal: 1, external: 0, broken: 0 };

        runTest({ checkExternalUrls: false }, expected, function () { return done(); });
    });

    it('should use pending queue for small concurrency', function (done) {
        var mock = nock(SERVER_URL),
            urls = [];

        for(var i=0; i<100; i++) {
            var url = '/url' + i;
            urls.push(url);
            mock.get(url).reply(200, 'Hello ' + url);
        }

        mock.get('/').reply(200, htmlBuilder.build(urls));

        var expected = { all: 101, internal: 101, external: 0, broken: 0 };

        runTest({ concurrency: 1 }, expected, function () { return done(); });
    });

    describe('custom timeout option value', function() {
        it('should mark url as broken if timeout occured', function (done) {
            nock(SERVER_URL)
                .get('/')
                .socketDelay(300)
                .reply(200, 'Hello World');

            var expected = { all: 1, internal: 1, external: 0, broken: 1 };

            runTest({ requestTimeout: 100 }, expected, function () { return done(); });
        });

        it('should mark url as valid if timeout is greater then server response time', function (done) {
            nock(SERVER_URL)
                .get('/')
                .socketDelay(200)
                .reply(200, 'Hello World');

            var expected = { all: 1, internal: 1, external: 0, broken: 0 };

            runTest({ requestTimeout: 300 }, expected, function () { return done(); });
        });
    });

    describe('custom requestRetriesAmount option value', function () {
        it('should mark url as broken if timeout was occur for all attempts', function (done) {
            nock(SERVER_URL)
                .get('/')
                .replyWithError({ 'message': 'timeout', code: 'ETIMEDOUT' });

            var expected = { all: 1, internal: 1, external: 0, broken: 1 };

            runTest({ requestRetriesAmount: 2 }, expected, function () { return done(); });
        });

        it('should mark url as valid if it was checked from second attempt', function (done) {
            nock(SERVER_URL)
                .get('/')
                .times(1)
                .replyWithError({ 'message': 'timeout', code: 'ETIMEDOUT' })
                .get('/')
                .reply(200, 'Hello World');

            var expected = { all: 1, internal: 1, external: 0, broken: 0 };

            runTest({ requestRetriesAmount: 2 }, expected, function () { return done(); });
        });
    });

    describe('custom acceptedSchemes option value', function () {
        it('should not check urls with another schemes', function (done) {
            nock(SERVER_URL)
                .get('/')
                .reply(200, htmlBuilder.build(['https://github.com']));

            var expected = { all: 1, internal: 1, external: 0, broken: 0 };

            runTest({
                acceptedSchemes: ['http:'],
                checkExternalUrls: true
            }, expected, function () { return done(); });
        });

        it('should check urls with schemes from array of acceptedSchemes', function (done) {
            nock(SERVER_URL)
                .get('/')
                .reply(200, htmlBuilder.build(['https://github.com']));

            var expected = { all: 2, internal: 1, external: 1, broken: 0 };

            runTest({
                acceptedSchemes: ['http:', 'https:'],
                checkExternalUrls: true
            }, expected, function () { return done(); });
        });
    });

    describe('custom requestHeaders option value', function () {
        it('should mark url as broken in case of not accessible request headers', function (done) {
            nock(SERVER_URL, {
                    badheaders: ['bad-header']
                })
                .get('/')
                .reply(200, htmlBuilder.build([]));

            var expected = { all: 1, internal: 1, external: 0, broken: 1 };

            runTest({
                requestHeaders: { 'bad-header': 'bad-header' }
            }, expected, function () { return done(); });
        });

        it('should check url in case of accessible request headers', function (done) {
            nock(SERVER_URL, {
                    badheaders: ['bad-header']
                })
                .get('/')
                .reply(200, htmlBuilder.build([]));

            var expected = { all: 1, internal: 1, external: 0, broken: 0 };

            runTest({
                requestTimeout: 200,
                requestHeaders: { 'user-agent': 'custom-user-agent' }
            }, expected, function () { return done(); });
        });
    });

    describe('custom excludeLinkPatterns option', function () {
        it('should not check excluded urls', function () {
            nock(SERVER_URL)
                .get('/')
                .reply(200, htmlBuilder.build(['/foo1', '/foo2', '/foo2/foo3']));

            var expected = { all: 2, internal: 2, external: 0, broken: 0 };

            runTest({
                excludeLinkPatterns: [/\foo2/]
            }, expected, function () { return done(); });
        });
    });

    describe('check external urls', function () {
        it('should not check external link', function (done) {
            nock(SERVER_URL)
                .get('/')
                .reply(200, htmlBuilder.build(['https://yandex.ru']));

            var expected = { all: 1, internal: 1, external: 0, broken: 0 };

            runTest({ checkExternalUrls: false }, expected, function () { return done(); });
        });

        it('should check external link', function (done) {
            nock(SERVER_URL)
                .get('/')
                .reply(200, htmlBuilder.build(['https://yandex.ru']));

            var expected = { all: 2, internal: 1, external: 1, broken: 0 };

            runTest({ checkExternalUrls: true }, expected, function () { return done(); });
        });

        it('should check and mark broken external link', function (done) {
            nock(SERVER_URL)
                .get('/')
                .reply(200, htmlBuilder.build(['https://broken-link']));

            nock('https://broken-link')
                .head('/')
                .reply(500);

            var expected = { all: 2, internal: 1, external: 1, broken: 1 };

            runTest({ checkExternalUrls: true }, expected, function () { return done(); });
        });

        it('should not mark url as broken if timeout was occur for all attempts', function (done) {
            nock(SERVER_URL)
                .get('/')
                .reply(200, htmlBuilder.build(['http://my.external.source']));

            nock('http://my.external.source')
                .get('/')
                .replyWithError({ 'message': 'timeout', code: 'ETIMEDOUT' });

            var expected = { all: 2, internal: 1, external: 1, broken: 0 };

            runTest({
                requestRetriesAmount: 2,
                checkExternalUrls: true
            }, expected, function () { return done(); });
        });

        it('should mark url as valid if it was checked from second attempt', function (done) {
            nock(SERVER_URL)
                .get('/')
                .reply(200, htmlBuilder.build(['http://my.external.source']));

            nock('http://my.external.source')
                .head('/')
                .times(1)
                .replyWithError({ 'message': 'timeout', code: 'ETIMEDOUT' })
                .head('/')
                .reply(200, 'Hello World');

            var expected = { all: 2, internal: 1, external: 1, broken: 0 };

            runTest({
                requestRetriesAmount: 2,
                checkExternalUrls: true
            }, expected, function () { return done(); });
        });
    });
});

function runTest(options, expected, done) {
    options = options || {};
    options.onDone = function (statistic) {
        statistic.getAllCount().should.equal(expected.all);
        statistic.getInternalCount().should.equal(expected.internal);
        statistic.getExternalCount().should.equal(expected.external);
        statistic.getBrokenCount().should.equal(expected.broken);
        done.length ? done(statistic) : done();
    };
    (new BrokenLinksChecker(options)).start(SERVER_URL);
}
