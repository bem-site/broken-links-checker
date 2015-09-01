var Util = require('util'),
    Url = require('url'),
    should = require('should'),
    BasedOption = require('../../lib/based-option'),
    LinkAnalyzer = require('../../lib/link-analyzer');

describe('LinkAnalyzer', function () {
    describe('constructor', function () {
        var la;

        beforeEach(function () {
            la = new LinkAnalyzer('http://my.site.com', { foo: 'bar' });
        });

        it('should have valid url field value after initialization', function () {
            should.deepEqual(la.url, Url.parse('http://my.site.com'));
        });

        it('should have valid options field value after initialization', function () {
            should.deepEqual(la.options, { foo: 'bar' });
        });
    });

    describe('isNeedToSkipUrl', function () {
        var analyzer;

        describe('protocols criteria', function () {
            beforeEach(function () {
                analyzer = new LinkAnalyzer('http://my.site.com', new BasedOption());
                analyzer.options.setOption({}, 'acceptedSchemes', ['http:']);
                analyzer.options.setOption({}, 'excludeLinkPatterns', []);
            });

            it('should skip url with non-accepted schema', function () {
                analyzer.isNeedToSkipUrl('mailto://my.site.com/url1', 'http://my.site.com').should.equal(true);
            });

            it('should pass url with accepted schema', function () {
                analyzer.isNeedToSkipUrl('http://my.site.com/url1', 'http://my.site.com').should.equal(false);
            });
        });

        describe('external criteria', function () {
            beforeEach(function () {
                analyzer = new LinkAnalyzer('http://my.site.com', new BasedOption());
                analyzer.options.setOption({}, 'acceptedSchemes', ['http:']);
                analyzer.options.setOption({}, 'excludeLinkPatterns', []);
            });

            it('should pass external url if "checkExternalUrls" is set to true', function () {
                analyzer.options.setOption({}, 'checkExternalUrls', true);
                analyzer.isNeedToSkipUrl('http://outer.host/url1', 'http://my.site.com').should.equal(false);
            });

            it('should skip external url if "checkExternalUrls" is set to false', function () {
                analyzer.options.setOption({}, 'checkExternalUrls', false);
                analyzer.isNeedToSkipUrl('http://outer.host/url1', 'http://my.site.com').should.equal(true);
            });

            it('should pass internal url if "checkExternalUrls" is set to true', function () {
                analyzer.options.setOption({}, 'checkExternalUrls', true);
                analyzer.isNeedToSkipUrl('http://my.site.com/url1', 'http://my.site.com').should.equal(false);
            });

            it('should pass internal url if "checkExternalUrls" is set to false', function () {
                analyzer.options.setOption({}, 'checkExternalUrls', false);
                analyzer.isNeedToSkipUrl('http://my.site.com/url1', 'http://my.site.com').should.equal(false);
            });
        });

        describe('excluded urls criteria', function () {
            beforeEach(function () {
                analyzer = new LinkAnalyzer('http://my.site.com', new BasedOption());
                analyzer.options.setOption({}, 'acceptedSchemes', ['http:']);
                analyzer.options.setOption({}, 'excludeLinkPatterns', []);
            });

            it('should pass url if it does not matches any regular expression', function () {
                analyzer.options.setOption({}, 'excludeLinkPatterns', [/\/foo1/i, /\/foo2/i]);
                analyzer.isNeedToSkipUrl('http://my.site.com/url1', 'http://my.site.com').should.equal(false);
            });

            it('should skip url if it does matches at least one of regular expressions', function () {
                analyzer.options.setOption({}, 'excludeLinkPatterns', [/\/foo1/i, /\/foo2/i]);
                analyzer.isNeedToSkipUrl('http://my.site.com/foo1', 'http://my.site.com').should.equal(true);
            });

            it('should skip url if it equal to one of blacklisted urls', function () {
                analyzer.options.setOption({}, 'excludeLinkPatterns', ['http://my.site.com/foo/bar']);
                analyzer.isNeedToSkipUrl('http://my.site.com/foo/bar', 'http://my.site.com').should.equal(true);
            });

            it('should skip url if it matches to "http://my.site.com/foo/*"', function () {
                analyzer.options.setOption({}, 'excludeLinkPatterns', ['http://my.site.com/foo/*']);
                analyzer.isNeedToSkipUrl('http://my.site.com/foo/bar', 'http://my.site.com').should.equal(true);
            });

            it('should skip url if it matches to "http://my.site.com/*/bar"', function () {
                analyzer.options.setOption({}, 'excludeLinkPatterns', ['http://my.site.com/*/bar']);
                analyzer.isNeedToSkipUrl('http://my.site.com/foo/bar', 'http://my.site.com').should.equal(true);
            });

            it('should skip url if it matches to "http://my.site.com/*"', function () {
                analyzer.options.setOption({}, 'excludeLinkPatterns', ['http://my.site.com/*']);
                analyzer.isNeedToSkipUrl('http://my.site.com/foo/bar', 'http://my.site.com').should.equal(true);
            });

            it('should skip url if it matches to "*/foo/bar"', function () {
                analyzer.options.setOption({}, 'excludeLinkPatterns', ['*/foo/bar']);
                analyzer.isNeedToSkipUrl('http://my.site.com/foo/bar', 'http://my.site.com').should.equal(true);
            });

            it ('should skip url with anchor if it equal to one of to one of blacklisted urls', function () {
                analyzer.options.setOption({}, 'excludeLinkPatterns', ['http://my.site.com/foo/bar#a']);
                analyzer.isNeedToSkipUrl('http://my.site.com/foo/bar#a', 'http://my.site.com').should.equal(true);
            });

            it ('should skip url with anchor if it matches to "http://my.site.com/foo/*#a"', function () {
                analyzer.options.setOption({}, 'excludeLinkPatterns', ['http://my.site.com/foo/*#a']);
                analyzer.isNeedToSkipUrl('http://my.site.com/foo/bar#a', 'http://my.site.com').should.equal(true);
            });

            it ('should skip url with anchor if it matches to "http://my.site.com/*/bar#a"', function () {
                analyzer.options.setOption({}, 'excludeLinkPatterns', ['http://my.site.com/*/bar#a']);
                analyzer.isNeedToSkipUrl('http://my.site.com/foo/bar#a', 'http://my.site.com').should.equal(true);
            });

            it ('should pass url if it does not matches on any blacklisted urls', function () {
                analyzer.options.setOption({}, 'excludeLinkPatterns', ['/foo/bar']);
                analyzer.isNeedToSkipUrl('http://my.site.com/foo/bar', 'http://my.site.com').should.equal(false);
            });
        });

        describe('mode criteria', function () {
            describe('mode "page"', function () {
                beforeEach(function () {
                    analyzer = new LinkAnalyzer('http://my.site.com', new BasedOption());
                    analyzer.options.setOption({}, 'acceptedSchemes', ['http:']);
                    analyzer.options.setOption({}, 'excludeLinkPatterns', []);
                    analyzer.options.setOption({}, 'mode', 'page');
                });

                it('should pass url if url of page where it is equals to root page (for mode "page")', function () {
                    analyzer.isNeedToSkipUrl('http://my.site.com/foo1', 'http://my.site.com').should.equal(false);
                });

                it('should skip url if url of page where it does not equal to root page (for mode "page")', function () {
                    analyzer.isNeedToSkipUrl('http://my.site.com/foo2', 'http://my.site.com/foo1').should.equal(true);
                });
            });

            describe('mode "section"', function () {
                beforeEach(function () {
                    analyzer = new LinkAnalyzer('http://my.site.com/foo1', new BasedOption());
                    analyzer.options.setOption({}, 'acceptedSchemes', ['http:']);
                    analyzer.options.setOption({}, 'excludeLinkPatterns', []);
                    analyzer.options.setOption({}, 'mode', 'section');
                });

                it ('should pass url it is child against to root page (for mode section)', function () {
                    analyzer.isNeedToSkipUrl('http://my.site.com/foo1/foo2', 'http://my.site.com/foo1').should.equal(false);
                });

                it ('should pass url it is sibling to root page (for mode section)', function () {
                    analyzer.isNeedToSkipUrl('http://my.site.com/foo2', 'http://my.site.com/foo1').should.equal(false);
                });

                it ('should pass url it is parent to root page (for mode section)', function () {
                    analyzer.isNeedToSkipUrl('http://my.site.com', 'http://my.site.com/foo1').should.equal(false);
                });

                it ('should skip url it from another section of website (for mode section)', function () {
                    analyzer.isNeedToSkipUrl('http://my.site.com/foo3', 'http://my.site.com/foo2').should.equal(true);
                });
            });
        });

        describe('complex', function () {
            beforeEach(function () {
                analyzer = new LinkAnalyzer('http://my.site.com', new BasedOption());
                analyzer.options.setOption({}, 'acceptedSchemes', ['http:', 'https:']);
                analyzer.options.setOption({}, 'excludeLinkPatterns', [/\/foo1/i, /\/foo2/i]);
            });

            it('should skip "mailto://my.site.com/url1"', function () {
                analyzer.isNeedToSkipUrl('mailto://my.site.com/url1', 'http://my.site.com').should.equal(true);
            });

            it('should skip "http://google.com"', function () {
                analyzer.isNeedToSkipUrl('http://google.com', 'http://my.site.com').should.equal(true);
            });

            it('should pass "http://my.site.com/url1"', function () {
                analyzer.isNeedToSkipUrl('http://my.site.com/url1', 'http://my.site.com').should.equal(false);
            });

            it('should skip "http://my.site.com/foo1"', function () {
                analyzer.isNeedToSkipUrl('http://my.site.com/foo1', 'http://my.site.com').should.equal(true);
            });

            it('should pass "https://my.site.com/url1"', function () {
                analyzer.isNeedToSkipUrl('https://my.site.com/url1', 'http://my.site.com').should.equal(false);
            });

            it('should skip "mailto://my.site.com/foo2"', function () {
                analyzer.isNeedToSkipUrl('mailto://my.site.com/foo2', 'http://my.site.com').should.equal(true);
            });
        });
    });
});
