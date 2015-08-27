var path = require('path'),
    fs = require('fs'),
    nock = require('nock'),
    should = require('should'),
    mockFs = require('mock-fs'),
    run = require('../../../lib/acts/run');

describe('acts/run', function () {
    beforeEach(function () {
        mockFs({
            src: {
                assets: {
                    'report.html': fs.readFileSync('./src/assets/report.html')
                }
            },
            configs: {
                'my.site.com.js': fs.readFileSync('./test/mock/my.site.com.js', { encoding: 'utf-8' })
            }
        });
    });

    it('should throw error if config param was not set', function () {
        (function () { return run.run({}); }).should.throw('Configuration file not found');
    });

    it('should throw error if config file is missed', function () {
        (function () { return run.run({ config: './configs/invalid.js' }); }).should.throw('Configuration file not found');
    });

    describe('execute run action', function () {
        beforeEach(function () {
            nock('http://localhost:3000')
                .get('/')
                .reply(200, 'Hello World');
        });

        it('with default params', function (done) {
            runTest({ config: './configs/my.site.com.js' }, done);
        });

        it('with custom params', function (done) {
            runTest({
                config: './configs/my.site.com.js',
                concurrent: 1,
                requestRetriesAmount: 1,
                requestTimeout: 500,
                checkExternalUrls: true
            }, done);
        });
    });

    afterEach(function() {
        mockFs.restore();
    });
});

function runTest(options, callback) {
    run.run(options);
    setTimeout(function () {
        fs.existsSync('./reports').should.equal(true);
        fs.existsSync('./reports/my.site.com').should.equal(true);
        callback();
    }, 2000);
}
