'use strict';
const fs = require('fs');
const exists = fs.existsSync;
const join = require('path').join;
const logger = require('@financial-times/n-logger').default;

module.exports = {
	verify: app => {
		const gitignore = fs.readFileSync(`${app.__rootDirectory}/.gitignore`, 'utf8')
			.split('\n');

		// if there's a wildcard pattern for public assume don't need to check for
		// built assets existence
		if (gitignore.some(pattern => {
			return /^\/?public\/(.*\/\*|\*|$)/.test(pattern);
		})) {
			return;
		}

		// no gitignore rules relating to /public at all, so no need to check built assets
		if (!gitignore.some(pattern => {
			return /^\/?public/.test(pattern);
		})) {
			return;
		}
		if (process.env.NODE_ENV && (process.env.NODE_ENV !== 'production')) {
			logger.info("skipping asset verification as NODE_ENV is not production");
			return;
		}
		// check each ignored /public file has been built
		gitignore.forEach(pattern => {
			if (/^\/?public.*(css|js)$/.test(pattern)) {
				if (!exists(join(app.__rootDirectory, pattern))) {
					throw new Error(`${pattern} must exist otherwise this app will not be allowed to start`);
				}
				logger.info({ event: 'ASSERTED_EXISTS', file: pattern });
				return pattern;
			}
		});
	}
}
