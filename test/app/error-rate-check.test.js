const proxyquire = require('proxyquire');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');
const chai = require('chai');
const expect = chai.expect;
chai.use(sinonChai);

const nHealthStub = {
	runCheck: sinon.stub()
};

const subject = proxyquire('../../src/lib/error-rate-check', {
	'n-health': nHealthStub
});

describe('Default error rate check', () => {

	let env;

	before(() => {
		env = Object.assign({}, process.env);
	});

	after(() => {
		process.env = env;
	});

	it('should compose correct graphite metric with region', () => {
		process.env.REGION = 'US';

		const expectedNumerator = 'next.heroku.app-name.web_*_US.express.*_GET.res.status.500.count';
		const expectedDivisor = 'next.heroku.app-name.web_*_US.express.*_GET.res.status.*.count';

		subject('app-name');
		expect(nHealthStub.runCheck).calledWithMatch({
			numerator: expectedNumerator,
			divisor: expectedDivisor
		});
	});

	it('should compose correct graphite metric without region', () => {
		delete process.env.REGION;

		const expectedNumerator = 'next.heroku.app-name.web_*.express.*_GET.res.status.500.count';
		const expectedDivisor = 'next.heroku.app-name.web_*.express.*_GET.res.status.*.count';

		subject('app-name');

		expect(nHealthStub.runCheck).calledWithMatch({
			numerator: expectedNumerator,
			divisor: expectedDivisor
		});
	});

});
