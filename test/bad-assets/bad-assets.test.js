'use strict';

const shellpromise = require('shellpromise');
const expect = require('chai').expect;
const join = require('path').join;
const appPath = join(__dirname, '../fixtures/bad-assets');

function appStart () {
	return shellpromise(`node -e "require('${appPath}/main').listen.then(() => { console.log('event=SUCCESS'); process.exit(); });"`
		//, { verbose: true } // to debug tests, uncomment this line
	);
}

function createGitignore () {
	require('fs').writeFileSync(`${appPath}/.gitignore`, [].slice.call(arguments).join('\n'));
}

describe('built asset expectations', () => {
	before(() => shellpromise(`mkdir -p ${appPath}/public`, { verbose: true }));

	beforeEach(() => Promise.all([
		shellpromise(`touch ${appPath}/public/main.js`),
		shellpromise(`touch ${appPath}/public/main.css`)
	]))

	describe('should fail to start if gitignore contains wildcards', () => {
		['/public/', '/public/*', '/public/place/*']
			.forEach(pattern => {
				it(`should fail to start if the wildcard pattern ${pattern} is in .gitignore`, () => {
					createGitignore(pattern);
					return appStart()
						.then(() => {
							throw new Error('app should not have successfully started');
						}, err => {
							expect(err.toString()).to.contain('Wildcard pattern for public assets not allowed');
						});
				});
			})
	});

	it('should fail to start if there is an unignored asset', () => {
		createGitignore('/public/main.js');
		return appStart()
			.then(() => {
				throw new Error('app should not have successfully started');
			}, err => {
				expect(err.toString()).to.contain('main.css');
			});
	});

	it('should fail to start if there is a missing asset', () => {
		createGitignore('/public/main.js', '/public/main.css');
		return shellpromise(`rm -rf ${appPath}/public/main.js`, { verbose: true })
		.then(() => {
			return appStart()
			.then(() => {
				throw new Error('app should not have successfully started');
			}, err => {
				expect(err.toString()).to.contain('main.js');
			});
		})

	});




	it('should start if assets and gitignore match', () => {
		createGitignore('/public/main.js', '/public/main.css');
		return appStart();
	});

	it('shouldn\'t give a monkey\'s about non css or js files (for now)', () => {
		createGitignore('/public/main.js', '/public/main.css', '/public/hat.json');
		return shellpromise(`touch ${appPath}/public/coat.svg`, { verbose: true })
			.then(appStart);
	});
});
