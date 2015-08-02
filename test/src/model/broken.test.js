var should = require('should'),
    BrokenUrls = require('../../../lib/model/broken');

describe('broken', function () {
    var brokenUrls;

    beforeEach(function () {
        brokenUrls = new BrokenUrls();
    });

    describe('constructor', function () {
       it ('should initialize empty broken urls model after initialization', function () {
           brokenUrls._urls.should.be.instanceOf(Array).and.be.empty;
       });
    });

    describe('add', function () {
        it ('should add broken links model item to list of broken links', function () {
            brokenUrls.getAll().should.have.length(0);
            brokenUrls.add('http://my.host/url1', { page: 'http://my.host' }, 404);
            brokenUrls.getAll().should.have.length(1);
            should.deepEqual(brokenUrls.getAll()[0],  {
                url: 'http://my.host/url1',
                advanced: { page: 'http://my.host' },
                code: 404
            });
        });
    });

    describe('getAll', function () {
        it ('should return all broke link items from model', function () {
            brokenUrls.getAll().should.have.length(0);
            brokenUrls.add('http://my.host/url1', { page: 'http://my.host' }, 404);
            brokenUrls.add('http://my.host/url2', { page: 'http://my.host' }, 500);
            brokenUrls.getAll().should.have.length(2);
        });
    });

    describe('getByCode', function () {
        beforeEach(function () {
            brokenUrls.add('http://my.host/url1', { page: 'http://my.host' }, 404);
            brokenUrls.add('http://my.host/url2', { page: 'http://my.host' }, 500);
            brokenUrls.add('http://my.host/url3', { page: 'http://my.host' }, 404);
        });

        it ('should return valid set of broken link items by given status code', function () {
            brokenUrls.getByCode(404).should.be.instanceOf(Array).and.have.length(2);
            brokenUrls.getByCode(500).should.be.instanceOf(Array).and.have.length(1);

            should.deepEqual(brokenUrls.getByCode(404), [
                { url: 'http://my.host/url1', advanced: { page: 'http://my.host' }, code: 404 },
                { url: 'http://my.host/url3', advanced: { page: 'http://my.host' }, code: 404 }
            ]);

            should.deepEqual(brokenUrls.getByCode(500), [
                { url: 'http://my.host/url2', advanced: { page: 'http://my.host' }, code: 500 }
            ]);
        });

        it ('should return valid set of broken link items by status code 404', function () {
            should.deepEqual(brokenUrls.get404(), brokenUrls.getByCode(404));
        });

        it ('should return valid set of broken link items by status code 500', function () {
            should.deepEqual(brokenUrls.get500(), brokenUrls.getByCode(500));
        });

    });

    describe('clear', function () {
        it('should return instance of BrokenUrls class', function () {
            brokenUrls.clear().should.be.instanceOf(BrokenUrls);
        })

        it ('should clear broken link items model', function () {
            brokenUrls.add('http://my.host/url1', { page: 'http://my.host' }, 404);
            brokenUrls.add('http://my.host/url2', { page: 'http://my.host' }, 500);

            brokenUrls.getAll().should.be.instanceOf(Array).and.have.length(2);
            brokenUrls.clear();
            brokenUrls.getAll().should.be.empty;
        });
    });

    describe('create', function () {
        it ('should create BrokenUrls instance by static method', function () {
            BrokenUrls.create().should.be.instanceOf(BrokenUrls);
        })
    });
});
