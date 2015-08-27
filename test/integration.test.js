var EOL = require('os').EOL,
    should = require('should'),
    nock = require('nock'),
    BrokenLinksChecker = require('../index').BrokenLinksChecker,
    SERVER_URL = 'http://localhost:3000',
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
    it('should simply check given url', function (done) {
        nock(SERVER_URL)
            .get('/')
            .reply(200, 'Hello World');
        runTest({}, 1, 1, 0, 0, function () { return done(); });
    });

    it('should simply check broken url (404)', function (done) {
        nock(SERVER_URL)
            .get('/')
            .reply(404);
        runTest({ requestTimeout: 200 }, 1, 1, 0, 1, function (statistic) {
            statistic.getBroken().get404().should.have.length(1);
            done();
        });
    });

    it('should simply check broken url (500)', function (done) {
        nock(SERVER_URL)
            .get('/')
            .reply(500);
        runTest({ requestTimeout: 200 }, 1, 1, 0, 1, function (statistic) {
            statistic.getBroken().get500().should.have.length(1);
            done();
        });
    });

    it('should skip links without href attributes', function (done) {
        nock(SERVER_URL)
            .get('/')
            .reply(200, htmlBuilder.build([null]));
        runTest({ checkExternalUrls: false }, 1, 1, 0, 0, function () { return done(); });
    });

    it('should not check same url twice (absolute url)', function (done) {
        nock(SERVER_URL)
            .get('/')
            .reply(200, htmlBuilder.build([SERVER_URL]));
        runTest({ checkExternalUrls: false }, 1, 1, 0, 0, function () { return done(); });
    });

    it('should not check same url twice (relative url)', function (done) {
        nock(SERVER_URL)
            .get('/')
            .reply(200, htmlBuilder.build(['/']));
        runTest({ checkExternalUrls: false }, 1, 1, 0, 0, function () { return done(); });
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
        runTest({ concurrency: 1 }, 101, 101, 0, 0, function () { return done(); });
    });

    describe('custom timeout option value', function() {
        it('should mark url as broken if timeout was occur', function (done) {
            nock(SERVER_URL)
                .get('/')
                .socketDelay(300)
                .reply(200, 'Hello World');
            runTest({ requestTimeout: 100 }, 1, 1, 0, 1, function () { return done(); });
        });

        it('should mark url as valid if timeout is greater then server response time', function (done) {
            nock(SERVER_URL)
                .get('/')
                .socketDelay(200)
                .reply(200, 'Hello World');
            runTest({ requestTimeout: 300 }, 1, 1, 0, 0, function () { return done(); });
        });
    });

    describe('custom requestRetriesAmount option value', function () {
        it('should mark url as broken if timeout was occur for all attempts', function (done) {
            nock(SERVER_URL)
                .get('/')
                .socketDelay(300)
                .reply(200, 'Hello World');
            runTest({
                requestTimeout: 200,
                requestRetriesAmount: 2
            }, 1, 1, 0, 1, function () { return done(); });
        });

        it('should mark url as valid if it was checked from second attempt', function (done) {
            nock(SERVER_URL)
                .get('/')
                .socketDelay(300)
                .times(1)
                .reply(200, 'Hello World')
                .get('/')
                .socketDelay(100)
                .reply(200, 'Hello World');
            runTest({
                requestTimeout: 200,
                requestRetriesAmount: 2
            }, 1, 1, 0, 1, function () { return done(); });
        });
    });

    describe('custom acceptedSchemes option value', function () {
        it('should not check urls with another schemes', function (done) {
            nock(SERVER_URL)
                .get('/')
                .reply(200, htmlBuilder.build(['https://github.com']));
            runTest({
                acceptedSchemes: ['http:'],
                checkExternalUrls: true
            }, 1, 1, 0, 0, function () { return done(); });
        });

        it('should check urls with schemes from array of acceptedSchemes', function (done) {
            nock(SERVER_URL)
                .get('/')
                .reply(200, htmlBuilder.build(['https://github.com']));
            runTest({
                acceptedSchemes: ['http:', 'https:'],
                checkExternalUrls: true
            }, 2, 1, 1, 0, function () { return done(); });
        });
    });

    describe('custom requestHeaders option value', function () {
        it('should mark url as broken in case of not accessible request headers', function (done) {
            nock(SERVER_URL, {
                    badheaders: ['bad-header']
                })
                .get('/')
                .reply(200, htmlBuilder.build([]));
            runTest({
                requestHeaders: { 'bad-header': 'bad-header' }
            }, 1, 1, 0, 1, function () { return done(); });
        });

        it('should check url in case of accessible request headers', function (done) {
            nock(SERVER_URL, {
                    badheaders: ['bad-header']
                })
                .get('/')
                .reply(200, htmlBuilder.build([]));
            runTest({
                requestTimeout: 200,
                requestHeaders: { 'user-agent': 'custom-user-agent' }
            }, 1, 1, 0, 0, function () { return done(); });
        });
    });

    describe('custom excludeLinkPatterns option', function () {
        it('should not check excluded urls', function () {
            nock(SERVER_URL)
                .get('/')
                .reply(200, htmlBuilder.build(['/foo1', '/foo2', '/foo2/foo3']));
            runTest({
                excludeLinkPatterns: [/\foo2/]
            }, 2, 2, 0, 0, function () { return done(); });
        });
    });

    describe('check external urls', function (done) {
        it('should not check external link', function () {
            nock(SERVER_URL)
                .get('/')
                .reply(200, htmlBuilder.build(['https://yandex.ru']));
            runTest({ checkExternalUrls: false }, 1, 1, 0, 0, function () { return done(); });
        });

        it('should check external link', function (done) {
            nock(SERVER_URL)
                .get('/')
                .reply(200, htmlBuilder.build(['https://yandex.ru']));
            runTest({ checkExternalUrls: true }, 2, 1, 1, 0, function () { return done(); });
        });

        it('should check and mark broken external link', function (done) {
            nock(SERVER_URL)
                .get('/')
                .reply(200, htmlBuilder.build(['https://broken-link']));
            runTest({ checkExternalUrls: true, requestTimeout: 200 }, 2, 1, 1, 1, function () { return done(); });
        });
    });
});

function runTest(options, all, internal, external, broken, done) {
    options = options || {};
    options.onDone = function (statistic) {
        statistic.getAllCount().should.equal(all);
        statistic.getInternalCount().should.equal(internal);
        statistic.getExternalCount().should.equal(external);
        statistic.getBrokenCount().should.equal(broken);
        done.length ? done(statistic) : done();
    };
    (new BrokenLinksChecker(options)).start(SERVER_URL);
}
