var path = require('path'),
    fs = require('fs'),
    should = require('should'),
    mockFs = require('mock-fs'),
    run = require('../../../lib/acts/run');

describe('acts/run', function () {
	beforeEach(function () {
		mockFs({
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

	afterEach(function() {
		mockFs.restore();
	});
});