'use strict';
const exists = require('fs').existsSync;
const join = require('path').join;
const logger = require('@financial-times/n-logger').default;

module.exports = {
	verify: app => {
		let nMakefileAssets;

		try {
			nMakefileAssets = require(`${app.__rootDirectory}/n-makefile.json`);
		} catch(err) {
			throw new Error('n-makefile.json must exist for n-express to start');
		}

		if (nMakefileAssets && nMakefileAssets.assets && nMakefileAssets.assets.entry) {
			Object.keys(nMakefileAssets.assets.entry).forEach(key => {
					if (!exists(join(app.__rootDirectory, key))) {
						throw new Error(`${key} must exist otherwise this app will not be allowed to start`);
					}
					logger.info({ event: 'ASSERTED_EXISTS', file: key });
				});
		}
	}
}
