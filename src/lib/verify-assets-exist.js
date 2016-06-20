'use strict';
const fs = require('fs');
const exists = fs.existsSync;
const join = require('path').join;
const logger = require('@financial-times/n-logger').default;

module.exports = {
	verify: app => {
		const gitignore = fs.readFileSync(`${app.__rootDirectory}/.gitignore`, 'utf8')
			.split('\n');

		const expectedFiles = gitignore.filter(pattern => {
			if (/^\/public\/(.*\/\*|\*|$)/.test(pattern)) {
				throw new Error(`Wildcard pattern for public assets not allowed in your .gitignore. Please specify a path for each file`);
			}
			if (/^\/?public.*(css|js)$/.test(pattern)) {
				if (!exists(join(app.__rootDirectory, pattern))) {
					throw new Error(`${pattern} must exist otherwise this app will not be allowed to start`);
				}
				logger.info({ event: 'ASSERTED_EXISTS', file: pattern });
				return pattern;
			}
		});

		fs.readdirSync(`${app.__rootDirectory}/public`)
			.forEach(file => {
				console.log(file, expectedFiles)
				if (/(css|js)$/.test(file)) {
					if (expectedFiles.indexOf(`/public/${file}`) === -1) {
						throw new Error(`Built file ${file} exists but is not in your .gitignore. Please add it or the app will not start`);
					}
				}
			})
	}
}
