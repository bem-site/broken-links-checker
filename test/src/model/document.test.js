var fs = require('fs'),
    should = require('should'),
    Document = require('../../../src/model/document');

describe('document', function () {
    var document,
        body;

    before(function () {
        body = fs.readFileSync('./test/mock/index.html');
    });

    beforeEach(function () {
        document = new Document('http://my.host/url1', { body: body });
    });

    describe('constructor', function () {
        it('should set value to _res field', function () {
            should.deepEqual(document._res, { body: body });
        });

        it('should set value to _url field', function () {
            document._url.should.equal('http://my.host/url1');
        });

        it('should set value to _$ field', function () {
            document._$.should.be.ok;
        });
    });

    it('should have res getter', function () {
        should.deepEqual(document.res, { body: body });
    });

    it('should have url getter', function () {
        document._url.should.equal('http://my.host/url1');
    });

    it('should have $ getter', function () {
        document.$.should.be.ok;
    });

    it('should resolve link url based on _url', function () {
        document.resolve('/url2').should.equal('http://my.host/url2');
    });
});
