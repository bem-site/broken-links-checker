var should = require('should'),
    Util = require('../../lib/util');

describe('Util', function () {
    it('should can be initialized', function () {
        var util = new Util();
        util.should.be.instanceOf(Util);
    });

    it ('should return valid path to configuration folder', function () {
        Util.getConfigurationDirectory().should.match(/\/configs$/);
    });

    it ('should return valid path to reports folder', function () {
        Util.getReportsDirectory().should.match(/\/reports$/);
    });
});
