var Url = require('url'),
    should = require('should'),
    Crawler = require('../../lib/crawler');

describe('crawler', function () {
    describe('constructor', function () {
        function assertDefault(crawler) {
            crawler.getOption('concurrent').should.equal(Crawler.DEFAULT.concurrent);
            should.deepEqual(crawler.getOption('requestHeaders'), Crawler.DEFAULT.requestHeaders);
            should.deepEqual(crawler.getOption('requestRetriesAmount'), Crawler.DEFAULT.requestRetriesAmount);
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
                onDone: function (statistic) {
                    statistic.getBroken().getAll().should.be.instanceOf(Array).and.be.have.length(1);
                    done();
                }
            });

            crawler.start('http://localhost:' + port);
        });

        it('should skip excluded page urls', function (done) {
            var crawler = new Crawler({
                excludeLinkPatterns: [/\/not-found/],
                onDone: function (statistic) {
                    statistic.getBroken().getAll().should.be.instanceOf(Array).and.be.have.length(0);
                    done();
                }
            });

            crawler.start('http://localhost:' + port);
        });

        /*
        it('should check outer urls', function (done) {
            var crawler = new Crawler({
                checkExternalUrls: true,
                onDone: function (statistic) {
                    statistic.getBroken().getAll().should.be.instanceOf(Array).and.be.have.length(1);
                    done();
                }
            });

            crawler.start('http://localhost:' + port);
        });
        */
    });
});
