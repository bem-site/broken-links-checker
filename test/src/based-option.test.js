var BasedOption = require('../../src/based-option');

describe('based-option', function () {
    var basedOption;
    
    beforeEach(function () {
        basedOption = new BasedOption();
    });

    describe('setOption', function () {
        it('should set option value for given option name', function () {
            basedOption.setOption({ foo: 'bar' }, 'foo', 'bar-default');
            basedOption._options.foo.should.equal('bar');
        });

        it('should set default value if option was not set', function () {
            basedOption.setOption({}, 'foo', 'bar-default');
            basedOption._options.foo.should.equal('bar-default');
        });
    });

    it('should get valid option value', function () {
        basedOption.setOption({ foo: 'bar' }, 'foo', 'bar-default');
        basedOption.getOption('foo').should.equal('bar');
    });
});
