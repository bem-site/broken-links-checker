var Url = require('url'),
    should = require('should'),
    Checker = require('../../lib/checker');

describe('checker', function () {
    describe('constructor', function () {
        function assertDefault(checker) {
            var options = checker.options,
                rules = checker.rules;

            options.getOption('concurrent').should.equal(Checker.DEFAULT.concurrent);
            should.deepEqual(options.getOption('requestHeaders'), Checker.DEFAULT.requestHeaders);
            should.deepEqual(options.getOption('requestRetriesAmount'), Checker.DEFAULT.requestRetriesAmount);
            should.deepEqual(options.getOption('requestTimeout'), Checker.DEFAULT.requestTimeout);

            should.deepEqual(options.getOption('onDone'), checker.onDone.bind(checker));

            should.deepEqual(options.getOption('acceptedSchemes'), Checker.DEFAULT.acceptedSchemes);
            should.deepEqual(options.getOption('excludeLinkPatterns'), Checker.DEFAULT.excludeLinkPatterns);
            options.getOption('checkExternalUrls').should.equal(Checker.DEFAULT.checkExternalUrls);
        }

        it('should be initialized with default params if options were not set', function () {
            assertDefault(new Checker());
        });

        it('should be initialized with default params if options are empty', function () {
            assertDefault(new Checker({}));
        });

        it('should override default concurrent option', function () {
            var checker = new Checker({ concurrent: 3 });
            checker.options.getOption('concurrent').should.equal(3);
        });

        it('should override default requestHeaders option', function () {
            var checker = new Checker({ requestHeaders: { 'user-agent': 'custom-header' } });
            should.deepEqual(checker.options.getOption('requestHeaders'), { 'user-agent': 'custom-header' });
        });

        it('should override default requestRetriesAmount option', function () {
            var checker = new Checker({ requestRetriesAmount: 3 });
            checker.options.getOption('requestRetriesAmount').should.equal(3);
        });

        it('should override default requestTimeout option', function () {
            var checker = new Checker({ requestTimeout: 2000 });
            checker.options.getOption('requestTimeout').should.equal(2000);
        });

        it('should override default acceptedSchemes rule', function () {
            var checker = new Checker({ acceptedSchemes: ['mail:'] });
            should.deepEqual(checker.options.getOption('acceptedSchemes'), ['mail:']);
        });

        it('should override default checkExternalUrls option', function () {
            var checker = new Checker({ checkExternalUrls: true });
            checker.options.getOption('checkExternalUrls').should.equal(true);
        });

        it('should override default excludeLinkPatterns rule', function () {
            var reg = [/\/foo1\/bar1\//, /\/foo2\/bar2\//],
                checker = new Checker({ excludeLinkPatterns: reg });
            should.deepEqual(checker.options.getOption('excludeLinkPatterns'), reg);
        });
    });

    describe('initSkipRules', function () {
        var checker;

        beforeEach(function () {
            checker = new Checker();
            checker.initSkipRules('http://my.host');
        });

        it ('should fill _initial field value by argument of "initSkipRules" method', function () {
            checker._url.should.be.instanceOf(Object);
            checker._url['hostname'].should.be.equal('my.host');
            checker._url['href'].should.be.equal('http://my.host/');
        });

        it ('should create skip rules model and set it into _skipRules field', function () {
            checker._skipRules.should.be.ok;
            checker._skipRules.should.be.instanceOf(Object);
        });

        it ('skip rules should have skipNonAcceptableProtocols method', function () {
            checker._skipRules.skipNonAcceptableProtocols.should.be.and.be.instanceOf(Function);
        });

        it ('skip rules should have skipOuterUrls method', function () {
            checker._skipRules.skipExternalUrls.should.be.and.be.instanceOf(Function);
        });

        it ('skip rules should have skipExcludedUrls method', function () {
            checker._skipRules.skipExcludedUrls.should.be.and.be.instanceOf(Function);
        });
    });

    describe('_skipRules', function () {
        var checker;

        beforeEach(function () {
            checker = new Checker();
            checker.initSkipRules(Url.parse('http://my.host'));
        });

        it ('should return true if scheme of given url does not exist in list of acceptable acceptedSchemes', function () {
            checker.options.setOption({}, 'acceptedSchemes', ['http:', 'https:']);
            checker._skipRules.skipNonAcceptableProtocols('mailto://my.host/url1').should.equal(true);
        });

        it ('should return false if scheme of given url exists in list of acceptable acceptedSchemes', function () {
            checker.options.setOption({}, 'acceptedSchemes', ['http:', 'https:']);
            checker._skipRules.skipNonAcceptableProtocols('http://my.host/url1').should.equal(false);
        });

        it ('should return false if checkExternalUrls option is set to true', function () {
            checker.options.setOption({}, 'checkExternalUrls', true);
            checker._skipRules.skipExternalUrls('http://outer.host:80/url1').should.equal(false);
        });

        it ('should return true if host of given url is different then host of initial url', function () {
            checker.options.setOption({}, 'checkExternalUrls', false);
            checker._skipRules.skipExternalUrls('http://outer.host:80/url1').should.equal(true);
        });

        it ('should return false if host of given url is the same as host of initial url', function () {
            checker.options.setOption({}, 'checkExternalUrls', false);
            checker._skipRules.skipExternalUrls('http://my.host/url2').should.equal(false);
        });

        it ('should return false in case of empty "excludeLinkPatterns" array', function () {
            checker.options.setOption({}, 'excludeLinkPatterns', []);
            checker._skipRules.skipExcludedUrls('http://my.host/url1').should.be.equal(false);
        });

        it ('should return false if any of excluded patterns does not match given url', function () {
            checker.options.setOption({}, 'excludeLinkPatterns', [/\/foo1/i, /\/foo2/i]);
            checker._skipRules.skipExcludedUrls('http://my.host/url1').should.be.equal(false);
        });

        it ('should return true if any excluded patterns matches on given url', function () {
            checker.options.setOption({}, 'excludeLinkPatterns', [/\/foo1/i, /\/foo2/i]);
            checker._skipRules.skipExcludedUrls('http://my.host/foo1').should.be.equal(true);
        });
    });

    describe('isNeedToSkipUrl', function () {
        var checker;

        function assert(item) {
            it ('"isNeedToSkipUrl" should return "'+ item.result + '" for url: "' + item.url + '"', function () {
                checker.isNeedToSkipUrl(item.url).should.be.equal(item.result);
            });
        }

        beforeEach(function () {
            checker = new Checker();
            checker.initSkipRules(Url.parse('http://my.host'));
            checker.options.setOption({}, 'acceptedSchemes', ['http:', 'https:']);
            checker.options.setOption({}, 'checkExternalUrls', false);
            checker.options.setOption({}, 'excludeLinkPatterns', [/\/foo1/i, /\/foo2/i]);
        });

        [
            { url: 'mailto://my.host/url1', result: true },
            { url: 'http://google.com', result: true },
            { url: 'http://my.host/url1', result: false },
            { url: 'http://my.host/foo1', result: true },
            { url: 'http://my.host/url1/foo2', result: true },
            { url: 'http://my.host/foo1/foo2', result: true },
            { url: 'https://my.host/url2/', result: false },
            { url: 'mailto://my.host/foo2', result: true }
        ].forEach(assert);
    });

    describe('start', function () {
        it('should throw error if url param was not set', function () {
            var checker = new Checker();
            (function () { return checker.start(null); }).should.throw('Url was not set');
        });

        it('should throw error if url param has invalid format', function () {
            var checker = new Checker();
            (function () { return checker.start('bla-bla'); }).should.throw('Urls is not valid');
        });
    });

    describe('crawl mock server', function () {
        var server, port;

        before(function (done) {
            try {
                port = process.env.PORT || 3000,
                server = require('../mock/server');
                setTimeout(function () {
                    done();
                }, 1000);
            } catch(error) {
                done();
            }
        });

        it('should crawl pages', function (done) {
            var checker = new Checker({
                onDone: function (statistic) {
                    statistic.getBroken().getAll().should.be.instanceOf(Array).and.have.length(1);
                    done();
                }
            });

            checker.start('http://localhost:' + port);
        });

        it('should skip excluded page urls', function (done) {
            var checker = new Checker({
                excludeLinkPatterns: [/\/not-found/],
                onDone: function (statistic) {
                    statistic.getBroken().getAll().should.be.instanceOf(Array).and.have.length(0);
                    done();
                }
            });

            checker.start('http://localhost:' + port);
        });

        /*
        it('should check outer urls', function (done) {
            var checker = new Checker({
                checkExternalUrls: true,
                onDone: function (statistic) {
                    statistic.getBroken().getAll().should.be.instanceOf(Array).and.have.length(1);
                    done();
                }
            });

            checker.start('http://localhost:' + port);
        });
        */
    });
});
