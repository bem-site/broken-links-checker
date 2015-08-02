var BasedRule = require('../../lib/based-rule');

describe('based-rule', function () {
    var basedRule;

    beforeEach(function () {
        basedRule = new BasedRule();
    });

    describe('setRule', function () {
        it('should set rule value for given option name', function () {
            basedRule.setRule({ foo: 'bar' }, 'foo', 'bar-default');
            basedRule._rules.foo.should.equal('bar');
        });

        it('should set default value if option was not set', function () {
            basedRule.setRule({}, 'foo', 'bar-default');
            basedRule._rules.foo.should.equal('bar-default');
        });
    });

    it('should get valid rule value', function () {
        basedRule.setRule({ foo: 'bar' }, 'foo', 'bar-default');
        basedRule.getRule('foo').should.equal('bar');
    });
});
