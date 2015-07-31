var Url = require('url'),
    should = require('should'),
    SkipRules = require('../../src/skip-rules');

describe('skip-rules', function () {
    var skipRules;

    beforeEach(function () {
        skipRules = new SkipRules();
    });

    describe('initSkipRules', function () {
        beforeEach(function () {
            skipRules.initSkipRules('http://my.host');
        });

        it ('should fill _initial field value by argument of "initSkipRules" method', function () {
            skipRules._initial.should.equal('http://my.host');
        });

        it ('should create skip rules model and set it into _skipRules field', function () {
            skipRules._skipRules.should.be.ok;
            skipRules._skipRules.should.be.instanceOf(Object);
        });

        it ('skip rules should have skipNonAcceptableProtocols method', function () {
            skipRules._skipRules.skipNonAcceptableProtocols.should.be.and.be.instanceOf(Function);
        });

        it ('skip rules should have skipOuterUrls method', function () {
            skipRules._skipRules.skipExternalUrls.should.be.and.be.instanceOf(Function);
        });

        it ('skip rules should have skipExcludedUrls method', function () {
            skipRules._skipRules.skipExcludedUrls.should.be.and.be.instanceOf(Function);
        });
    });

    describe('_skipRules', function () {
        beforeEach(function () {
            skipRules.initSkipRules(Url.parse('http://my.host'));
        });

        it('should return true if scheme of given url does not exist in list of acceptable acceptedSchemes', function () {
            skipRules.setRule({}, 'acceptedSchemes', ['http:', 'https:']);
            skipRules._skipRules.skipNonAcceptableProtocols('mailto://url1').should.equal(true);
        });

        it('should return false if scheme of given url exists in list of acceptable acceptedSchemes', function () {
            skipRules.setRule({}, 'acceptedSchemes', ['http:', 'https:']);
            skipRules._skipRules.skipNonAcceptableProtocols('http://url1').should.equal(false);
        });

        it('should return false if checkExternalUrls option is set to true', function () {
            skipRules.setRule({}, 'checkExternalUrls', true);
            skipRules._skipRules.skipExternalUrls('http://outer.host:80/url1').should.equal(false);
        });

        it('should return true if host of given url is different then host of initial url', function () {
            skipRules.setRule({}, 'checkExternalUrls', false);
            skipRules._skipRules.skipExternalUrls('http://outer.host:80/url1').should.equal(true);
        });

        it('should return false if host of given url is the same as host of initial url', function () {
            skipRules.setRule({}, 'checkExternalUrls', false);
            skipRules._skipRules.skipExternalUrls('http://my.host/url2').should.equal(false);
        });
    });

    describe('isNeedToSkipUrl', function () {

    });
});
