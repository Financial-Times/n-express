const proxyquire = require('proxyquire');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');
const chai = require('chai');
const expect = chai.expect;
chai.use(sinonChai);

const nHealthStub = {
	runCheck: sinon.stub()
};

const subject = proxyquire('../../src/lib/app-restart-check', {
	'n-health': nHealthStub
});

describe('Default app restart check', () => {
	let env;

	before(() => {
		env = Object.assign({}, process.env);
	});

	after(() => {
		process.env = env;
	});

	it('uses sensible defaults when the region is unavailable', () => {
		delete process.env.REGION;

		subject('app-name');
		expect(nHealthStub.runCheck).calledWithMatch({
			name: 'app-name restart rate is normal (unknown region)',
			metric: "transformNull(summarize(next.heroku.app-name.*.express.start, '1h'), 0)",
			threshold: 2,
			samplePeriod: '6hours',
			severity: 2,
		})
	});

	it('queries restarts in a specific region if REGION is specified in the environment', () => {
		process.env.REGION = 'eu';

		subject('app-name');
		expect(nHealthStub.runCheck).calledWithMatch({
			name: 'app-name restart rate is normal (EU)',
			metric: "transformNull(summarize(next.heroku.app-name.*_EU.express.start, '1h'), 0)",
		})
	});

	it('allows severity to be customised with options', () => {
		subject('app-name', {
			severity: 3,
		});
		expect(nHealthStub.runCheck).calledWithMatch({
			severity: 3,
		})
	});
});
