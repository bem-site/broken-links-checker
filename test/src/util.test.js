var should = require('should'),
    Util = require('../../lib/util');

describe('Util', function () {
    it ('should return valid path to configuration folder', function () {
        Util.getConfigurationDirectory().should.match(/\/configs$/);
    });

    it ('should return valid path to reports folder', function () {
        Util.getReportsDirectory().should.match(/\/reports$/);
    });
});
