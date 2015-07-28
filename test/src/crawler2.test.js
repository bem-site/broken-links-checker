var Url = require('url'),
    should = require('should'),
    Crawler = require('../../src/crawler2');

describe('crawler', function () {
    describe('constructor', function () {
        function assertDefault(crawler) {
            should.deepEqual(crawler.getOption('acceptedSchemes'), Crawler.DEFAULT.acceptedSchemes);
            should.deepEqual(crawler.getOption('excludedSchemes'), Crawler.DEFAULT.excludedSchemes);
            crawler.getOption('excludeExternalLinks').should.equal(Crawler.DEFAULT.excludeExtrnalLinks);
            crawler.getOption('excludeInternalLinks').should.equal(Crawler.DEFAULT.excludeInternalLinks);
            crawler.getOption('filterLevel').should.equal(Crawler.DEFAULT.filterLevel);
            crawler.getOption('maxSocketsPerHost').should.equal(Crawler.DEFAULT.maxSocketsPerHost);
        }

        it('should be initialized with default params if options were not set', function () {
            assertDefault(new Crawler());
        });

        it('should be initialized with default params if options are empty', function () {
            assertDefault(new Crawler({}));
        });

        it('should set acceptedSchemes option', function () {
            var crawler = new Crawler({ acceptedSchemes: ['http'] });
            should.deepEqual(crawler.getOption('acceptedSchemes'), ['http']);
        });

        it('should set excludedSchemes option', function () {
            var crawler = new Crawler({ excludedSchemes: ['mail'] });
            should.deepEqual(crawler.getOption('excludedSchemes'), ['mail']);
        });

        it('should set excludeExternalLinks option', function () {
            var crawler = new Crawler({ excludeExternalLinks: false });
            crawler.getOption('excludeExternalLinks').should.equal(false);
        });

        it('should set excludeInternalLinks option', function () {
            var crawler = new Crawler({ excludeInternalLinks: true });
            crawler.getOption('excludeInternalLinks').should.equal(true);
        });

        it('should set filterLevel option', function () {
            var crawler = new Crawler({ filterLevel: 2 });
            crawler.getOption('filterLevel').should.equal(2);
        });

        it('should set maxSocketsPerHost option', function () {
            var crawler = new Crawler({ maxSocketsPerHost: 100 });
            crawler.getOption('maxSocketsPerHost').should.equal(100);
        });

        it('should set excludeLinkPatterns rule', function () {
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

    /*
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
                exclude: [/\/not-found/],
                onDone: function (brokenUrls) {
                    brokenUrls.getAll().should.be.instanceOf(Array).and.be.have.length(0);
                    done();
                }
            });

            crawler.start('http://localhost:' + port);
        });

        it('should check outer urls', function (done) {
            var crawler = new Crawler({
                checkOuterUrls: true,
                onDone: function (brokenUrls) {
                    brokenUrls.getAll().should.be.instanceOf(Array).and.be.have.length(1);
                    done();
                }
            });

            crawler.start('http://localhost:' + port);
        });
    });
    */
});

