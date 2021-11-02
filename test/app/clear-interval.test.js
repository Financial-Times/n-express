const express = require('express');
const nextExpress = require('../../main');
const InstrumentListen = require('../../src/lib/instrument-listen');
const expect = require('chai').expect;
const healthChecks = require('../../src/lib/health-checks');
const serviceMetrics = require('../../src/lib/service-metrics');
const sinon = require('sinon');

describe('clears intervals', () => {
	it('should return object with stop function in service-metrics', () => {
		const result = serviceMetrics.init();
		expect(result.stop).to.not.be.undefined;
		result.stop();
	});

	it('should return object with stop function in health-checks', () => {
		const app = express();

		const result = healthChecks(app, {healthChecks: []}, {});
		expect(result.stop).to.not.be.undefined;

		//ensure the start() function is called before the stop(),
		//because healthChecks(...) eventually calls n-health runCheck(), but runCheck() doesn't await on start()
		setTimeout(() => {
			result.stop();
		}, 0);
	});

	it('should call stop() which clears all intervals if a metric is added to instrumentListen', () => {
		const app = express();
		const instrumentListen = new InstrumentListen(app, {}, []);
		const spy = sinon.spy();
		const stub = sinon.stub(serviceMetrics, 'init');
		stub.returns({
			stop: spy
		});
		instrumentListen.addMetrics(serviceMetrics.init());

		app.close();

		expect(spy.called).to.be.true;
	});

	it('should close server in app.close if there is a live server', () => {
		const app = express();
		const instrumentListen = new InstrumentListen(app, {}, [Promise.resolve()]);
		const spy = sinon.spy();
		instrumentListen.server = {
			close: spy
		};

		app.close();

		expect(spy.called).to.be.true;
	});

	it('should cause this test to not hang as the cleanup is done', () => {
		const app = nextExpress({
			name: 'noflags',
			directory: __dirname,
			systemCode: 'test-app',
			withFlags: false,
			demo: false, // adds health check that sets interval
			withServiceMetrics: true // adds service check that sets interval
		});


		setTimeout(() => {
			app.close(); // if you comment this line out, the test will hang when running mocha with --no-exit
		}, 0);
	});
});
