var should = require('should'),
    Broken = require('../../../src/model/broken'),
    Statistic = require('../../../src/model/statistic');

describe('statistic', function () {
    var statistic;

    beforeEach(function () {
        statistic = new Statistic();
    });

    describe('__constructor', function () {
        it ('should have zero _countExternal value after initialization', function () {
            statistic._countExternal.should.equal(0);
        });

        it ('should have zero _countInternal value after initialization', function () {
            statistic._countInternal.should.equal(0);
        });

        it ('should have empty broken links model after initialization', function () {
            statistic._broken.getAll().should.have.length(0);
        });
    });

    it('should increase internal count', function() {
        statistic.increaseInternalCount();
        statistic.getInternalCount().should.equal(1);
    });

    it('should increase external count', function() {
        statistic.increaseExternalCount();
        statistic.getExternalCount().should.equal(1);
    });

    it('should return valid internal count value', function () {
        statistic.getInternalCount().should.equal(0);
        statistic.increaseInternalCount();
        statistic.getInternalCount().should.equal(1);
    });

    it('should return valid external count value', function () {
        statistic.getExternalCount().should.equal(0);
        statistic.increaseExternalCount();
        statistic.getExternalCount().should.equal(1);
    });

    it ('should return valid count of all processed urls', function () {
        statistic.increaseExternalCount();
        statistic.increaseExternalCount();
        statistic.increaseInternalCount();
        statistic.getAllCount().should.equal(3);
    });

    it('should return broken links model', function () {
        statistic.getBroken().should.be.instanceOf(Broken);
    });

    it('should return valid result of getBrokenCount method', function () {
        statistic.getBrokenCount().should.equal(0);
    });

    it('should return instance of Statistic class by create static method', function () {
        Statistic.create().should.be.instanceOf(Statistic);
    });
});
