var fs = require('fs'),
    should = require('should'),
    mockFs = require('mock-fs'),
    moment = require('moment'),
    ReporterBase = require('../../../lib/reporters/base');

describe('Reporters', function () {
    describe('Base', function () {
        var reporterBase;

        beforeEach(function () {
            reporterBase = new ReporterBase();
            mockFs({});
        });

        afterEach(function () {
            mockFs.restore();
        });

        it('should create reports folder', function () {
            reporterBase.createReportsFolder();
            fs.existsSync('./reports').should.equal(true);
        });

        it('should create report folder for given config name', function () {
            reporterBase.createReportFolder('my.site');
            fs.existsSync('./reports/my.site').should.equal(true);
        });

        it('should save report file', function () {
            var date = moment().format('DD-MM-YYYY:hh:mm:ss');
            reporterBase.saveReportFile('my.site', 'json', 'hello world', date);

            fs.existsSync('./reports/my.site/' + date + '.json').should.equal(true);
            fs.readFileSync('./reports/my.site/' + date + '.json', 'utf-8').should.equal('hello world');
        });
    });
});
