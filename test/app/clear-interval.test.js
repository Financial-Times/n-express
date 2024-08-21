const express = require('express');
const nextExpress = require('../../main');
const InstrumentListen = require('../../src/lib/instrument-listen');
const expect = require('chai').expect;
const sinon = require('sinon');

describe('clears intervals', () => {
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
