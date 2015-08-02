var Url = require('url'),
    should = require('should'),
    SkipRules = require('../../lib/skip-rules');

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

        it ('should return true if scheme of given url does not exist in list of acceptable acceptedSchemes', function () {
            skipRules.setRule({}, 'acceptedSchemes', ['http:', 'https:']);
            skipRules._skipRules.skipNonAcceptableProtocols('mailto://my.host/url1').should.equal(true);
        });

        it ('should return false if scheme of given url exists in list of acceptable acceptedSchemes', function () {
            skipRules.setRule({}, 'acceptedSchemes', ['http:', 'https:']);
            skipRules._skipRules.skipNonAcceptableProtocols('http://my.host/url1').should.equal(false);
        });

        it ('should return false if checkExternalUrls option is set to true', function () {
            skipRules.setRule({}, 'checkExternalUrls', true);
            skipRules._skipRules.skipExternalUrls('http://outer.host:80/url1').should.equal(false);
        });

        it ('should return true if host of given url is different then host of initial url', function () {
            skipRules.setRule({}, 'checkExternalUrls', false);
            skipRules._skipRules.skipExternalUrls('http://outer.host:80/url1').should.equal(true);
        });

        it ('should return false if host of given url is the same as host of initial url', function () {
            skipRules.setRule({}, 'checkExternalUrls', false);
            skipRules._skipRules.skipExternalUrls('http://my.host/url2').should.equal(false);
        });

        it ('should return false in case of empty "excludeLinkPatterns" array', function () {
            skipRules.setRule({}, 'excludeLinkPatterns', []);
            skipRules._skipRules.skipExcludedUrls('http://my.host/url1').should.be.equal(false);
        });

        it ('should return false if any of excluded patterns does not match given url', function () {
            skipRules.setRule({}, 'excludeLinkPatterns', [/\/foo1/i, /\/foo2/i]);
            skipRules._skipRules.skipExcludedUrls('http://my.host/url1').should.be.equal(false);
        });

        it ('should return true if any excluded patterns matches on given url', function () {
            skipRules.setRule({}, 'excludeLinkPatterns', [/\/foo1/i, /\/foo2/i]);
            skipRules._skipRules.skipExcludedUrls('http://my.host/foo1').should.be.equal(true);
        });
    });

    describe('isNeedToSkipUrl', function () {
        function assert(item) {
            it ('"isNeedToSkipUrl" should return "'+ item.result + '" for url: "' + item.url + '"', function () {
                    skipRules.isNeedToSkipUrl(item.url).should.be.equal(item.result);
            });
        }

        beforeEach(function () {
            skipRules.initSkipRules(Url.parse('http://my.host'));
            skipRules.setRule({}, 'acceptedSchemes', ['http:', 'https:']);
            skipRules.setRule({}, 'checkExternalUrls', false);
            skipRules.setRule({}, 'excludeLinkPatterns', [/\/foo1/i, /\/foo2/i]);
        });

        [
            { url: 'mailto://my.host/url1', result: true },
            { url: 'http://google.com', result: true },
            { url: 'http://my.host/url1', result: false },
            { url: 'http://my.host/foo1', result: true },
            { url: 'http://my.host/url1/foo2', result: true },
            { url: 'http://my.host/foo1/foo2', result: true },
            { url: 'https://my.host/url2/', result: false },
            { url: 'mailto://my.host/foo2', result: true }
        ].forEach(assert);
    });
});
