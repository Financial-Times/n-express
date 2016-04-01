'use strict';

const shellpromise = require('shellpromise');
const expect = require('chai').expect;
const join = require('path').join;
const appPath = join(__dirname, '../fixtures/bad-assets');

function appStart () {
	return shellpromise(`node -e "require('${appPath}/main').listen.then(() => { console.log('event=SUCCESS'); process.exit(); });"`, { verbose: true });
}

describe('bad assets app', () => {

	before(() => shellpromise(`rm -rf ${appPath}/public/main.js`, { verbose: true }));

	it('should fail to start if there is a missing asset', () => {
		return appStart()
			.then(() => {
				throw new Error('app should not have successfully started');
			}, err => {
				expect(err.toString()).to.contain('./public/main.js');
			});
	});

});

describe('good assets app', () => {

	before(() => shellpromise(`mkdir -p ${appPath}/public && touch ${appPath}/public/main.js`, { verbose: true }));

	it('should start if there is a no missing asset', appStart);

});
