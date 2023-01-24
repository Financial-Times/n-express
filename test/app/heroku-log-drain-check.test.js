const {expect} = require('chai');
const proxyquire = require('proxyquire');
const sinon = require('sinon');

const nHealth = {
	runCheck: sinon.stub().returns('mock-check')
};

const herokuLogDrainCheck = proxyquire('../../src/lib/heroku-log-drain-check', {
	'n-health': nHealth
});

describe('Heroku log drain check', () => {
	let originalEnv;

	beforeEach(() => {
		originalEnv = Object.assign({}, process.env);
		herokuLogDrainCheck();
	});

	afterEach(() => {
		process.env = originalEnv;
	});

	it('runs a Heroku log drain check', () => {
		expect(nHealth.runCheck.callCount).to.equal(1);
		expect(nHealth.runCheck.firstCall.args.length).to.equal(1);
		expect(nHealth.runCheck.firstCall.args[0].id).to.equal('heroku-log-drain-eu');
		expect(nHealth.runCheck.firstCall.args[0].type).to.equal('json');
		expect(nHealth.runCheck.firstCall.args[0].interval).to.equal('1hour');
	});

	describe('when the `REGION` environment variable is set to "US"', () => {

		beforeEach(() => {
			nHealth.runCheck.resetHistory();
			process.env.REGION = 'US';
			herokuLogDrainCheck();
		});

		it('suffixes the check ID with "us"', () => {
			expect(nHealth.runCheck.firstCall.args[0].id).to.equal('heroku-log-drain-us');
		});

		it('suffixes the check name with "(US)"', () => {
			expect(nHealth.runCheck.firstCall.args[0].name).to.equal('Heroku log drain configured (US)');
		});

	});

});
