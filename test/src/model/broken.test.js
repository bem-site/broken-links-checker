var should = require('should'),
    BrokenLinks = require('../../../src/model/broken');

describe('broken', function () {
    var brokenLinks;

    beforeEach(function () {
        brokenLinks = new BrokenLinks();
    });

    describe('constructor', function () {
       it ('should initialize empty broken urls model after initialization', function () {
           brokenLinks._urls.should.be.instanceOf(Array).and.be.empty;
       });
    });

    describe('add', function () {
        it ('should return instance of BrokenLinks class', function () {
            brokenLinks.add('http://my.host/url1', { page: 'http://my.host' }, 404).should.be.instanceOf(BrokenLinks);
        });

        it ('should add broken links model item to list of broken links', function () {
            brokenLinks.getAll().should.have.length(0);
            brokenLinks.add('http://my.host/url1', { page: 'http://my.host' }, 404);
            brokenLinks.getAll().should.have.length(1);
            should.deepEqual(brokenLinks.getAll()[0],  {
                url: 'http://my.host/url1',
                advanced: { page: 'http://my.host' },
                code: 404
            });
        });
    });

    describe('getAll', function () {
        it ('should return all broke link items from model', function () {
            brokenLinks.getAll().should.have.length(0);
            brokenLinks.add('http://my.host/url1', { page: 'http://my.host' }, 404);
            brokenLinks.add('http://my.host/url2', { page: 'http://my.host' }, 500);
            brokenLinks.getAll().should.have.length(2);
        });
    });

    describe('getByCode', function () {
        beforeEach(function () {
            brokenLinks.add('http://my.host/url1', { page: 'http://my.host' }, 404);
            brokenLinks.add('http://my.host/url2', { page: 'http://my.host' }, 500);
            brokenLinks.add('http://my.host/url3', { page: 'http://my.host' }, 404);
        });

        it ('should return valid set of broken link items by given status code', function () {
            brokenLinks.getByCode(404).should.be.instanceOf(Array).and.have.length(2);
            brokenLinks.getByCode(500).should.be.instanceOf(Array).and.have.length(1);

            should.deepEqual(brokenLinks.getByCode(404), [
                { url: 'http://my.host/url1', advanced: { page: 'http://my.host' }, code: 404 },
                { url: 'http://my.host/url3', advanced: { page: 'http://my.host' }, code: 404 }
            ]);

            should.deepEqual(brokenLinks.getByCode(500), [
                { url: 'http://my.host/url2', advanced: { page: 'http://my.host' }, code: 500 }
            ]);
        });

        it ('should return valid set of broken link items by status code 404', function () {
            should.deepEqual(brokenLinks.get404(), brokenLinks.getByCode(404));
        });

        it ('should return valid set of broken link items by status code 500', function () {
            should.deepEqual(brokenLinks.get500(), brokenLinks.getByCode(500));
        });

    });

    describe('clear', function () {
        it('should return instance of BrokenLinks class', function () {
            brokenLinks.clear().should.be.instanceOf(BrokenLinks);
        })

        it ('should clear broken link items model', function () {
            brokenLinks.add('http://my.host/url1', { page: 'http://my.host' }, 404);
            brokenLinks.add('http://my.host/url2', { page: 'http://my.host' }, 500);

            brokenLinks.getAll().should.be.instanceOf(Array).and.have.length(2);
            brokenLinks.clear();
            brokenLinks.getAll().should.be.empty;
        });
    });

    describe('create', function () {
        it ('should create BrokenLinks instance by static method', function () {
            BrokenLinks.create().should.be.instanceOf(BrokenLinks);
        })
    });
});
