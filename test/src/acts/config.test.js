var path = require('path'),
    fs = require('fs'),
    should = require('should'),
    mockFs = require('mock-fs'),
    config = require('../../../lib/acts/config');

describe('acts/config', function () {
    var configMock = {
        'url': 'http://my.site.com',
        'logger': {
            'level': 'info'
        },
        'concurrent': 100,
        'requestHeaders': {
            'user-agent': 'node-spider'
        },
        'requestRetriesAmount': 5,
        'requestTimeout': 5000,
        'acceptedSchemes': [
            'http:',
            'https:'
        ],
        'checkExternalUrls': false,
        'excludeLinkPatterns': []
    };

    beforeEach(function () {
        mockFs({});
    });

    it('should create configuration directory', function () {
        config.createConfigsDir();
        fs.existsSync('./configs').should.equal(true);
    });

    it('should create configuration stub', function () {
        should.deepEqual(config.createConfigStub(), configMock);
    });

    it.skip('should create configuration file', function () {
        config.createConfigFile('test').should.equal(true);
        fs.existsSync('./configs/test.js').should.equal(true);
        should.deepEqual(require(path.resolve('./configs/test.js')), configMock);
    });

    afterEach(function () {
        mockFs.restore();
    });
});
