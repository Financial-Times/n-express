'use strict';

const shellpromise = require('shellpromise');
const expect = require('chai').expect;
const join = require('path').join;
const appPath = join(__dirname, '../fixtures/bad-assets');

describe('built asset expectations', () => {
	let initialEnv;

	function appStart () {
		return shellpromise(
			`node --harmony -e "require('${appPath}/main').listen.then(() => { process.exit(); },	err => {process.exit(2); });"`,
			{
				env: {
					NODE_ENV: 'production'
				},
				// verbose: true // to debug tests, uncomment this line
			}
		);
	}

	function createGitignore () {
		require('fs').writeFileSync(`${appPath}/.gitignore`, [].slice.call(arguments).join('\n'));
	}

	before(() => shellpromise(`mkdir -p ${appPath}/public`, { verbose: true }));

	// otherwise fails linting
	after(() => shellpromise(`rm ${appPath}/.gitignore`, { verbose: true }));

	beforeEach(() => Promise.all([
		shellpromise(`touch ${appPath}/public/main.js`),
		shellpromise(`touch ${appPath}/public/main.css`)
	]))

	it.only('should fail to start if there is a missing asset', () => {
		createGitignore('/public/main.js', '/public/main.css');
		return shellpromise(`rm -rf ${appPath}/public/main.js`, { verbose: true })
			.then(appStart)
			.then(() => {
				throw new Error('app should not have successfully started');
			}, err => {
				expect(err.toString()).to.contain('main.js');
			})

	});

	it('should start if assets and gitignore match', () => {
		createGitignore('/public/main.js', '/public/main.css', '/public/about.json');
		return shellpromise(`touch ${appPath}/public/about.json`)
			.then(appStart);
	});

	it('should start if public directory in gitignore', () => {
		createGitignore('/public/');
		return shellpromise(`touch ${appPath}/public/about.json`)
			.then(appStart);
	});

	it('should start if wildcarded public directory in gitignore', () => {
		createGitignore('/public/*');
		return shellpromise(`touch ${appPath}/public/about.json`)
			.then(appStart);
	});

	it('should start if no mention of public in gitignore', () => {
		createGitignore('cat', 'dog');
		return shellpromise(`touch ${appPath}/public/about.json`)
			.then(appStart);
	});


});
