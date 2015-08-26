var Url = require('url'),
    should = require('should'),
    Model = require('../../lib/model/model'),
    Statistic = require('../../lib/model/statistic'),
    Checker = require('../../lib/checker');

describe('checker', function () {
    describe('constructor', function () {
        function assertDefault(checker) {
            var options = checker.options;

            options.getOption('concurrent').should.equal(Checker.DEFAULT.concurrent);
            options.getOption('checkExternalUrls').should.equal(Checker.DEFAULT.checkExternalUrls);
            options.getOption('requestRetriesAmount').should.equal(Checker.DEFAULT.requestRetriesAmount);
            options.getOption('requestTimeout').should.equal(Checker.DEFAULT.requestTimeout);
            options.getOption('mode').should.equal(Checker.DEFAULT.mode)

            should.deepEqual(options.getOption('requestHeaders'), Checker.DEFAULT.requestHeaders);
            should.deepEqual(options.getOption('onDone'), checker.onDone.bind(checker));
            should.deepEqual(options.getOption('acceptedSchemes'), Checker.DEFAULT.acceptedSchemes);
            should.deepEqual(options.getOption('excludeLinkPatterns'), Checker.DEFAULT.excludeLinkPatterns);
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

    describe('_getRequestOptions', function () {
        it('should return valid request options object', function () {
            var checker = new Checker();
            should.deepEqual(checker._getRequestOptions(), {
                encoding: 'utf-8',
                headers: { 'user-agent': 'node-spider' },
                timeout: 5000
            });
        });
    });

    describe('_checkExternalLink', function () {
        var checker;

        beforeEach(function () {
            checker = new Checker();
            checker.initStatistic(new Statistic());
            checker.initModel(new Model());
        });

        it('should check existed existed external link', function () {
            var item = ['http://yandex.ru', { href: 'http://yandex.ru', page: 'http://my.site.com' }];
            return checker._checkExternalLink(item).then(function () {
                checker.statistic.getExternalCount().should.equal(1);
            });
        });

        it('should check existed non-existed external link', function () {
            var item = ['http://invlid-url', { href: 'http://invlid-url', page: 'http://my.site.com' }];
            return checker._checkExternalLink(item).then(function () {
                checker.statistic.getExternalCount().should.equal(1);
                checker.statistic.getBrokenCount().should.equal(1);
            });
        });
    });
});
