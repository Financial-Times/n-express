/*global it, describe*/
const exec = require('node:child_process').exec;
const expect = require('chai').expect;
const { join } = require('node:path');

describe('app with missing fetch', function () {
	it('logs a fatal error and exits the process', function (done) {
		const appPath = join(__dirname, '..', 'fixtures', 'app', 'main.js');
		exec(`node --no-experimental-fetch ${appPath}`, (error, stdout) => {
			expect(error).to.be.instanceOf(Error);
			expect(error.code).to.equal(1);
			expect(stdout).to.contain('UNHANDLED_ERROR');
			done();
		});
	});
});
