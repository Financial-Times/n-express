const { expect } = require('chai');

const supportedNodeJsVersionCheck = require('../../src/lib/supported-node-js-version-check');

describe('Supported Node.js version check', () => {

	let subject;
	let healthCheckResponse;

	context('when the `REGION` environment variable is absent', () => {

		beforeEach(() => {
			delete process.env.REGION;
			subject = supportedNodeJsVersionCheck('foo-app');
			healthCheckResponse = subject.getStatus();
		});

		it('suffixes the check ID with "eu"', () => {
			expect(healthCheckResponse.id).to.equal('supported-node-js-version-eu');
		});

		it('suffixes the check name with "(EU)"', () => {
			expect(healthCheckResponse.name).to.equal('Long-term supported (LTS) Node.js version used for foo-app (EU)');
		});

	});

	context('when the `REGION` environment variable is set to "EU"', () => {

		beforeEach(() => {
			process.env.REGION = 'EU';
			subject = supportedNodeJsVersionCheck('foo-app');
			healthCheckResponse = subject.getStatus();
		});

		it('suffixes the check ID with "eu"', () => {
			expect(healthCheckResponse.id).to.equal('supported-node-js-version-eu');
		});

		it('suffixes the check name with "(EU)"', () => {
			expect(healthCheckResponse.name).to.equal('Long-term supported (LTS) Node.js version used for foo-app (EU)');
		});

	});


	context('when the `REGION` environment variable is set to "US"', () => {

		beforeEach(() => {
			process.env.REGION = 'US';
			subject = supportedNodeJsVersionCheck('foo-app');
			healthCheckResponse = subject.getStatus();
		});

		it('suffixes the check ID with "us"', () => {
			expect(healthCheckResponse.id).to.equal('supported-node-js-version-us');
		});

		it('suffixes the check name with "(US)"', () => {
			expect(healthCheckResponse.name).to.equal('Long-term supported (LTS) Node.js version used for foo-app (US)');
		});

	});

});
