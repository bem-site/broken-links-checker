var should = require('should'),
    Crawler = require('../../src/crawler');

describe('crawler', function () {
    describe('constructor', function () {
        function assertDefault(crawler) {
            crawler.getOption('concurrent').should.equal(Crawler.DEFAULT.concurrent);
            crawler.getOption('logs').should.equal(Crawler.DEFAULT.logs);
            should.deepEqual(crawler.getOption('headers'), Crawler.DEFAULT.headers);

            should.deepEqual(crawler.getOption('error'), crawler.onError.bind(crawler));
            should.deepEqual(crawler.getOption('done'), crawler.onDone.bind(crawler));

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
});
