var Url = require('url'),
    should = require('should'),
    Crawler = require('../../src/crawler');

describe('crawler', function () {
    describe('constructor', function () {
        function assertDefault(crawler) {
            crawler.getOption('concurrent').should.equal(Crawler.DEFAULT.concurrent);
            should.deepEqual(crawler.getOption('requestHeaders'), Crawler.DEFAULT.requestHeaders);
            should.deepEqual(crawler.getOption('requestRetriesAmount'), Crawler.DEFAULT.requestRetriesAmount);
            should.deepEqual(crawler.getOption('requestMaxRedirectsAmount'), Crawler.DEFAULT.requestMaxRedirectsAmount);
            should.deepEqual(crawler.getOption('requestTimeout'), Crawler.DEFAULT.requestTimeout);
            
            should.deepEqual(crawler.getOption('onDone'), crawler.onDone.bind(crawler));

            should.deepEqual(crawler.getRule('acceptedSchemes'), Crawler.DEFAULT.acceptedSchemes);
            should.deepEqual(crawler.getRule('excludeLinkPatterns'), Crawler.DEFAULT.excludeLinkPatterns);
            crawler.getRule('checkExternalUrls').should.equal(Crawler.DEFAULT.checkExternalUrls);
        }

        it('should be initialized with default params if options were not set', function () {
            assertDefault(new Crawler());
        });

        it('should be initialized with default params if options are empty', function () {
            assertDefault(new Crawler({}));
        });

        it('should override default concurrent option', function () {
            var crawler = new Crawler({ concurrent: 3 });
            crawler.getOption('concurrent').should.equal(3);
        });

        it('should override default requestHeaders option', function () {
            var crawler = new Crawler({ requestHeaders: { 'user-agent': 'custom-header' } });
            should.deepEqual(crawler.getOption('requestHeaders'), { 'user-agent': 'custom-header' });
        });

        it('should override default requestRetriesAmount option', function () {
            var crawler = new Crawler({ requestRetriesAmount: 3 });
            crawler.getOption('requestRetriesAmount').should.equal(3);
        });

        it('should override default requestMaxRedirectsAmount option', function () {
            var crawler = new Crawler({ requestMaxRedirectsAmount: 5 });
            crawler.getOption('requestMaxRedirectsAmount').should.equal(5);
        });

        it('should override default requestTimeout option', function () {
            var crawler = new Crawler({ requestTimeout: 2000 });
            crawler.getOption('requestTimeout').should.equal(2000);
        });

        it('should override default acceptedSchemes rule', function () {
            var crawler = new Crawler({ acceptedSchemes: ['mail:'] });
            should.deepEqual(crawler.getRule('acceptedSchemes'), ['mail:']);
        });

        it('should override default checkExternalUrls option', function () {
            var crawler = new Crawler({ checkExternalUrls: true });
            crawler.getRule('checkExternalUrls').should.equal(true);
        });

        it('should override default excludeLinkPatterns rule', function () {
            var reg = [/\/foo1\/bar1\//, /\/foo2\/bar2\//],
                crawler = new Crawler({ excludeLinkPatterns: reg });
            should.deepEqual(crawler.getRule('excludeLinkPatterns'), reg);
        });
    });

    describe('setOption', function () {
        var crawler;

        beforeEach(function () {
            crawler = new Crawler();
        });

        it('should set option value for given option name', function () {
            crawler.setOption({ foo: 'bar' }, 'foo', 'bar-default');
            crawler._options.foo.should.equal('bar');
        });

        it('should set default value if option was not set', function () {
            crawler.setOption({}, 'foo', 'bar-default');
            crawler._options.foo.should.equal('bar-default');
        });
    });

    it('should get valid option value', function () {
        var crawler = new Crawler();
        crawler.setOption({ foo: 'bar' }, 'foo', 'bar-default');
        crawler.getOption('foo').should.equal('bar');
    });

    describe('setRule', function () {
        var crawler;

        beforeEach(function () {
            crawler = new Crawler();
        });

        it('should set rule value for given option name', function () {
            crawler.setRule({ foo: 'bar' }, 'foo', 'bar-default');
            crawler._rules.foo.should.equal('bar');
        });

        it('should set default value if option was not set', function () {
            crawler.setRule({}, 'foo', 'bar-default');
            crawler._rules.foo.should.equal('bar-default');
        });
    });

    it('should get valid rule value', function () {
        var crawler = new Crawler();
        crawler.setRule({ foo: 'bar' }, 'foo', 'bar-default');
        crawler.getRule('foo').should.equal('bar');
    });

    describe('getSkipRules', function () {
        describe('skipNonAcceptableProtocols', function () {
            var crawler;

            beforeEach(function () {
                crawler = new Crawler({ acceptedSchemes: ['http:'] });
            });

            it('should return true if protocol of given url does not exist in list of acceptable acceptedSchemes', function () {
                crawler.getSkipRules().skipNonAcceptableProtocols('https://url1').should.equal(true);
            });

            it('should return false if protocol of given url exists in list of acceptable acceptedSchemes', function () {
                crawler.getSkipRules().skipNonAcceptableProtocols('http://url1').should.equal(false);
            });
        });

        describe('skipOuterUrls', function () {
            var crawler;

            it('should return false if checkExternalUrls option is set to true', function () {
                crawler = new Crawler({ checkExternalUrls: true });
                crawler._url = Url.parse('http://my.custom.host:80/url1');
                crawler.getSkipRules().skipOuterUrls('http://outer.host:80/url1').should.equal(false);
            });

            it('should return true if host of given url is different then host of initial url', function () {
                crawler = new Crawler({ checkExternalUrls: false });
                crawler._url = Url.parse('http://my.custom.host:80/url1');
                crawler.getSkipRules().skipOuterUrls('http://outer.host:80/url1').should.equal(true);
            });

            it('should return false if host of given url is the same as host of initial url', function () {
                crawler = new Crawler({ checkExternalUrls: false });
                crawler._url = Url.parse('http://my.custom.host:80/url1');
                crawler.getSkipRules().skipOuterUrls('http://my.custom.host:80/url2').should.equal(false);
            });
        });

        describe('skipExcludedUrls', function () {

        });
    });

    describe('isNeedToSkipUrl', function () {

    });

    describe('start', function () {
        it('should throw error if url param was not set', function () {
            var crawler = new Crawler();
            (function () { return crawler.start(null); }).should.throw('Url was not set');
        });

        it('should throw error if url param has invalid format', function () {
            var crawler = new Crawler();
            (function () { return crawler.start('bla-bla'); }).should.throw('Urls is not valid');
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
            var crawler = new Crawler({
                onDone: function (brokenUrls) {
                    brokenUrls.getAll().should.be.instanceOf(Array).and.be.have.length(1);
                    done();
                }
            });

            crawler.start('http://localhost:' + port);
        });

        it('should skip excluded page urls', function (done) {
            var crawler = new Crawler({
                excludeLinkPatterns: [/\/not-found/],
                onDone: function (brokenUrls) {
                    brokenUrls.getAll().should.be.instanceOf(Array).and.be.have.length(0);
                    done();
                }
            });

            crawler.start('http://localhost:' + port);
        });

        it('should check outer urls', function (done) {
            var crawler = new Crawler({
                checkExternalUrls: true,
                onDone: function (brokenUrls) {
                    brokenUrls.getAll().should.be.instanceOf(Array).and.be.have.length(1);
                    done();
                }
            });

            crawler.start('http://localhost:' + port);
        });
    });
});
