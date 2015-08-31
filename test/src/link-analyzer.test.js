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

        it('should have valid _url field value after initialization', function () {
            should.deepEqual(la._url, Url.parse('http://my.site.com'));
        });

        it('should have valid _options field value after initialization', function () {
            should.deepEqual(la._options, { foo: 'bar' });
        });
    });

    describe('isNeedToSkipUrl', function () {
        function assert(url, expected, options, baseUrl, hostUrl) {
            var testName = Object.keys(options).reduce(function (prev, item) {
                    return prev + Util.format(' and %s = %s', item, options[item ]);
                }, Util.format('"isNeedToSkipUrl" should return "%s" for url: "%s"', expected, url));

            var hostUrl = hostUrl || 'http://my.site.com',
                analyzer = new LinkAnalyzer(hostUrl, new BasedOption());

            analyzer._options.setOption({}, 'acceptedSchemes', []);
            analyzer._options.setOption({}, 'excludeLinkPatterns', []);

            Object.keys(options).forEach(function(key) {
                analyzer._options.setOption({}, key, options[key]);
            });

            return it(testName, function () {
                analyzer.isNeedToSkipUrl(url, baseUrl || hostUrl).should.be.equal(expected);
            });
        }

        describe('protocols criteria', function () {
            var options = { acceptedSchemes: ['http:', 'https:'] };

            assert('mailto://my.site.com/url1', true, options);
            assert('https://my.site.com/url1', false, options);
            assert('http://my.site.com/url1', false, options);
        });

        describe('external criteria', function () {
            assert('http://outer.host:80/url1', false, { checkExternalUrls: true, acceptedSchemes: ['http:'] });
            assert('http://outer.host:80/url1', true, { checkExternalUrls: false, acceptedSchemes: ['http:'] });
            assert('http://my.site.com/url2', false, { checkExternalUrls: false, acceptedSchemes: ['http:'] });
        });

        describe('excluded urls criteria', function () {
            function getOptions(patterns) {
                return {
                    acceptedSchemes: ['http:'],
                    excludeLinkPatterns: patterns
                };
            }

            assert('http://my.site.com/url1', false, getOptions([/\/foo1/i, /\/foo2/i]));
            assert('http://my.site.com/foo1', true, getOptions([/\/foo1/i]));

            assert('http://my.site.com/foo/bar', true, getOptions(['http://my.site.com/foo/bar']));
            assert('http://my.site.com/foo/bar', true, getOptions(['http://my.site.com/foo/*']));
            assert('http://my.site.com/foo/bar', true, getOptions(['http://my.site.com/*/bar']));
            assert('http://my.site.com/foo/bar', true, getOptions(['http://my.site.com/*']));
            assert('http://my.site.com/foo/bar', true, getOptions(['*/foo/bar']));

            assert('http://my.site.com/foo/bar#a', true, getOptions(['http://my.site.com/foo/bar#a']));
            assert('http://my.site.com/foo/bar#a', true, getOptions(['http://my.site.com/foo/*#a']));
            assert('http://my.site.com/foo/bar#a', true, getOptions(['http://my.site.com/*/bar#a']));

            assert('http://my.site.com/foo/bar', false, getOptions(['/foo/bar']));
        });

        describe('mode criteria', function () {
            function getOptions(mode) {
                return {
                    acceptedSchemes: ['http:'],
                    mode: mode
                };
            }

            assert('http://my.site.com/foo1', false, getOptions('page'));
            assert('http://my.site.com/foo2', true, getOptions('page'), 'http://my.site.com/foo1');

            assert('http://my.site.com/foo1/foo2', false,
                getOptions('section'), 'http://my.site.com/foo1', 'http://my.site.com/foo1');
            assert('http://my.site.com/foo21', false,
                getOptions('section'), 'http://my.site.com/foo1', 'http://my.site.com/foo1');
            assert('http://my.site.com', false,
                getOptions('section'), 'http://my.site.com/foo1', 'http://my.site.com/foo1');
            assert('http://my.site.com/foo3', true,
                getOptions('section'), 'http://my.site.com/foo1', 'http://my.site.com/foo2');
        });

        describe('complex', function () {
            var options1 = {
                acceptedSchemes: ['http:', 'https:'],
                checkExternalUrls: false,
                excludeLinkPatterns: [/\/foo1/i, /\/foo2/i]
            };

            assert('mailto://my.site.com/url1', true, options1);
            assert('http://google.com', true, options1);
            assert('http://my.site.com/url1', false, options1);
            assert('http://my.site.com/foo1', true, options1);
            assert('http://my.site.com/url1/foo2', true, options1);
            assert('http://my.site.com/foo1/foo2', true, options1);
            assert('https://my.site.com/url2/', false, options1);
            assert('mailto://my.site.com/foo2', true, options1);
        });
    });
});
