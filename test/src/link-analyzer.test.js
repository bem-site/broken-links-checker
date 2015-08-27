var Url = require('url'),
    should = require('should'),
    BasedOption = require('../../lib/based-option'),
    LinkAnalyzer = require('../../lib/link-analyzer');

describe('LinkAnalyzer', function () {
    describe('constructor', function () {
        var la;

        beforeEach(function () {
            la = new LinkAnalyzer('http://my.site.com', { foo: 'bar' });
        });

        it('should have valid _url field value after initialization', function () {
            should.deepEqual(la._url, Url.parse('http://my.site.com'));
        });

        it('should have valid _options field value after initialization', function () {
            should.deepEqual(la._options, { foo: 'bar' });
        });
    });

    describe('_skipNonAcceptableProtocols', function () {
        var linkAnalyzer;

        beforeEach(function () {
            linkAnalyzer = new LinkAnalyzer('http://my.site.com', new BasedOption());
        });

        it ('should return true if scheme of given url does not exist in list of acceptable acceptedSchemes', function () {
            linkAnalyzer._options.setOption({}, 'acceptedSchemes', ['http:', 'https:']);
            linkAnalyzer._skipNonAcceptableProtocols('mailto://my.host/url1').should.equal(true);
        });

        it ('should return false if scheme of given url exists in list of acceptable acceptedSchemes', function () {
            linkAnalyzer._options.setOption({}, 'acceptedSchemes', ['http:', 'https:']);
            linkAnalyzer._skipNonAcceptableProtocols('http://my.host/url1').should.equal(false);
        });
    });

    describe('_skipExternalUrls', function () {
        var linkAnalyzer;

        beforeEach(function () {
            linkAnalyzer = new LinkAnalyzer('http://my.site.com', new BasedOption());
        });

        it ('should return false if checkExternalUrls option is set to true', function () {
            linkAnalyzer._options.setOption({}, 'checkExternalUrls', true);
            linkAnalyzer._skipExternalUrls('http://outer.host:80/url1').should.equal(false);
        });

        it ('should return true if host of given url is different then host of initial url', function () {
            linkAnalyzer._options.setOption({}, 'checkExternalUrls', false);
            linkAnalyzer._skipExternalUrls('http://outer.host:80/url1').should.equal(true);
        });

        it ('should return false if host of given url is the same as host of initial url', function () {
            linkAnalyzer._options.setOption({}, 'checkExternalUrls', false);
            linkAnalyzer._skipExternalUrls('http://my.site.com/url2').should.equal(false);
        });

    });

    describe('_skipExcludedUrls', function () {
        var linkAnalyzer;

        function assert(url, expected, options) {
            linkAnalyzer._options.setOption({}, 'excludeLinkPatterns', options);
            linkAnalyzer._skipExcludedUrls(url).should.be.equal(expected);
        }

        function assertStringPattern(url, pattern, expected) {
            it ('should match ' + url + ' to ' + pattern, function () {
                assert(url, expected, [pattern]);
            });
        }

        beforeEach(function () {
            linkAnalyzer = new LinkAnalyzer('http://my.site.com', new BasedOption());
        });

        it ('should return false in case of empty "excludeLinkPatterns" array', function () {
            assert('http://my.site.com/url1', false, []);
        });

        describe('regular expressions', function () {
            it ('should return false if any of excluded patterns does not match given url', function () {
                assert('http://my.site.com/url1', false, [/\/foo1/i, /\/foo2/i]);
            });

            it ('should return true if any excluded patterns matches on given url', function () {
                assert('http://my.site.com/foo1', true, [/\/foo1/i, /\/foo2/i]);
            });
        });

        describe('string patterns', function () {
            assertStringPattern('http://my.site.com/foo/bar', 'http://my.site.com/foo/bar', true);
            assertStringPattern('http://my.site.com/foo/bar', 'http://my.site.com/foo/*', true);
            assertStringPattern('http://my.site.com/foo/bar', 'http://my.site.com/*/bar', true);
            assertStringPattern('http://my.site.com/foo/bar', 'http://my.site.com/*', true);
            assertStringPattern('http://my.site.com/foo/bar', '*/foo/bar', true);

            assertStringPattern('http://my.site.com/foo/bar#anchor', 'http://my.site.com/foo/bar#anchor', true);
            assertStringPattern('http://my.site.com/foo/bar#anchor', 'http://my.site.com/foo/*#anchor', true);
            assertStringPattern('http://my.site.com/foo/bar#anchor', 'http://my.site.com/*/bar#anchor', true);

            assertStringPattern('http://my.site.com/foo/bar', '/foo/bar', false);
        });
    });

    describe('_skipOnMode', function () {
        var linkAnalyzer;

        beforeEach(function () {
            linkAnalyzer = new LinkAnalyzer('http://my.site.com', new BasedOption());
        });

        it('should return false for mode "page" and direct links of target page', function () {
           linkAnalyzer._options.setOption({}, 'mode', 'page');
           linkAnalyzer._skipOnMode('http://my.site.com/foo1', 'http://my.site.com').should.be.equal(false);
        });

        it('should return true for mode "page" and non-direct links of target page', function () {
           linkAnalyzer._options.setOption({}, 'mode', 'page');
           linkAnalyzer._skipOnMode('http://my.site.com/foo2', 'http://my.site.com/foo1').should.be.equal(true);
        });

        it('should return false for mode "section" and sub-links of initial link', function() {
           linkAnalyzer = new LinkAnalyzer('http://my.site.com/foo1', new BasedOption());
           linkAnalyzer._options.setOption({}, 'mode', 'section');
           linkAnalyzer._skipOnMode('http://my.site.com/foo1/foo2', 'http://my.site.com/foo1').should.be.equal(false);
        });

        it('should return false for mode "section" and sibling of initial link', function() {
           linkAnalyzer = new LinkAnalyzer('http://my.site.com/foo1', new BasedOption());
           linkAnalyzer._options.setOption({}, 'mode', 'section');
           linkAnalyzer._skipOnMode('http://my.site.com/foo21', 'http://my.site.com/foo1').should.be.equal(false);
        });

        it('should return false for mode "section" and parent of initial link', function() {
           linkAnalyzer = new LinkAnalyzer('http://my.site.com/foo1', new BasedOption());
           linkAnalyzer._options.setOption({}, 'mode', 'section');
           linkAnalyzer._skipOnMode('http://my.site.com', 'http://my.site.com/foo1').should.be.equal(false);
        });

        it('should return true for mode "section" and page outside of section', function() {
           linkAnalyzer = new LinkAnalyzer('http://my.site.com/foo2', new BasedOption());
           linkAnalyzer._options.setOption({}, 'mode', 'section');
           linkAnalyzer._skipOnMode('http://my.site.com/foo3', 'http://my.site.com/foo1').should.be.equal(true);
        });
    });

    describe('isNeedToSkipUrl', function () {
        var linkAnalyzer;

        beforeEach(function () {
            linkAnalyzer = new LinkAnalyzer('http://my.site.com', new BasedOption());
            linkAnalyzer._options.setOption({}, 'acceptedSchemes', ['http:', 'https:']);
            linkAnalyzer._options.setOption({}, 'checkExternalUrls', false);
            linkAnalyzer._options.setOption({}, 'excludeLinkPatterns', [/\/foo1/i, /\/foo2/i]);
        });

        [
            { url: 'mailto://my.site.com/url1', result: true },
            { url: 'http://google.com', result: true },
            { url: 'http://my.site.com/url1', result: false },
            { url: 'http://my.site.com/foo1', result: true },
            { url: 'http://my.site.com/url1/foo2', result: true },
            { url: 'http://my.site.com/foo1/foo2', result: true },
            { url: 'https://my.site.com/url2/', result: false },
            { url: 'mailto://my.site.com/foo2', result: true },
        ].forEach(function (item) {
            it ('"isNeedToSkipUrl" should return "'+ item.result + '" for url: "' + item.url + '"', function () {
                linkAnalyzer.isNeedToSkipUrl(item.url, 'http://my.site.com').should.be.equal(item.result);
            });
        });
    });
})
