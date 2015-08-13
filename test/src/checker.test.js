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
