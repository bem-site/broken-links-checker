var Url = require('url'),
    should = require('should'),
    Crawler = require('../../src/crawler');

describe('crawler', function () {
    describe('constructor', function () {
        function assertDefault(crawler) {
            crawler.getOption('concurrent').should.equal(Crawler.DEFAULT.concurrent);
            crawler.getOption('logs').should.equal(Crawler.DEFAULT.logs);
            should.deepEqual(crawler.getOption('headers'), Crawler.DEFAULT.headers);

            should.deepEqual(crawler.getOption('error'), crawler.onError.bind(crawler));
            should.deepEqual(crawler.getOption('onDone'), crawler.onDone.bind(crawler));

            should.deepEqual(crawler.getRule('protocols'), Crawler.DEFAULT.protocols);
            should.deepEqual(crawler.getRule('exclude'), Crawler.DEFAULT.exclude);
            crawler.getRule('checkOuterUrls').should.equal(Crawler.DEFAULT.checkOuterUrls);
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

        it('should override default logs option', function () {
            var crawler = new Crawler({ logs: true });
            crawler.getOption('logs').should.equal(true);
        });

        it('should override default headers option', function () {
            var crawler = new Crawler({ headers: { 'user-agent': 'custom-header' } });
            should.deepEqual(crawler.getOption('headers'), { 'user-agent': 'custom-header' });
        });

        it('should override default protocols rule', function () {
            var crawler = new Crawler({ protocols: ['mail:'] });
            should.deepEqual(crawler.getRule('protocols'), ['mail:']);
        });

        it('should override default checkOuterUrls option', function () {
            var crawler = new Crawler({ checkOuterUrls: true });
            crawler.getRule('checkOuterUrls').should.equal(true);
        });

        it('should override default exclude rule', function () {
            var reg = [/\/foo1\/bar1\//, /\/foo2\/bar2\//],
                crawler = new Crawler({ exclude: reg });
            should.deepEqual(crawler.getRule('exclude'), reg);
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
                crawler = new Crawler({ protocols: ['http:'] });
            });

            it('should return true if protocol of given url does not exist in list of acceptable protocols', function () {
                crawler.getSkipRules().skipNonAcceptableProtocols('https://url1').should.equal(true);
            });

            it('should return false if protocol of given url exists in list of acceptable protocols', function () {
                crawler.getSkipRules().skipNonAcceptableProtocols('http://url1').should.equal(false);
            });
        });

        describe('skipOuterUrls', function () {
            var crawler;

            it('should return false if checkOuterUrls option is set to true', function () {
                crawler = new Crawler({ checkOuterUrls: true });
                crawler._url = Url.parse('http://my.custom.host:80/url1');
                crawler.getSkipRules().skipOuterUrls('http://outer.host:80/url1').should.equal(false);
            });

            it('should return true if host of given url is different then host of initial url', function () {
                crawler = new Crawler({ checkOuterUrls: false });
                crawler._url = Url.parse('http://my.custom.host:80/url1');
                crawler.getSkipRules().skipOuterUrls('http://outer.host:80/url1').should.equal(true);
            });

            it('should return false if host of given url is the same as host of initial url', function () {
                crawler = new Crawler({ checkOuterUrls: false });
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
            (function () { return crawler.start(); }).should.throw('Url was not set');
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
                    brokenUrls.should.be.instanceOf(Array).and.be.have.length(1);
                    done();
                }
            });

            crawler.start('http://localhost:' + port);
        });

        it('should skip excluded page urls', function (done) {
            var crawler = new Crawler({
                exclude: [/\/not-found/],
                onDone: function (brokenUrls) {
                    brokenUrls.should.be.instanceOf(Array).and.be.have.length(0);
                    done();
                }
            });

            crawler.start('http://localhost:' + port);
        });

        it('should check outer urls', function (done) {
            var crawler = new Crawler({
                checkOuterUrls: true,
                onDone: function (brokenUrls) {
                    brokenUrls.should.be.instanceOf(Array).and.be.have.length(1);
                    done();
                }
            });

            crawler.start('http://localhost:' + port);
        });
    });
});
