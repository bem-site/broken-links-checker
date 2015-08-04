var fs = require('fs'),
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

    it('should create configuration file', function () {
        config.createConfigFile('test').should.equal(true);
        fs.existsSync('./configs/test.json').should.equal(true);
        fs.readFileSync('./configs/test.json', 'utf-8').should.equal(JSON.stringify(configMock, null, 4));
    });

    afterEach(function () {
        mockFs.restore();
    });
});
