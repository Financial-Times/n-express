'use strict';

const logger = require('@financial-times/n-logger').default;
const exists = require('fs').existsSync;
const join = require('path').join;

module.exports = app => {
	let assetHashes;
	let nMakefileAssets;

	try {
		assetHashes = require(`${app.__rootDirectory}/public/asset-hashes.json`);
	} catch(err) {
		logger.warn('./public/asset-hashes.json not found. Falling back to un-fingerprinted files.');
	}

	try {
		nMakefileAssets = require(`${app.__rootDirectory}/n-makefile.json`);
	} catch(err) {
		throw new Error('n-makefile.json must exist for @n-express to start');
	}

	if (nMakefileAssets && nMakefileAssets.assets && nMakefileAssets.assets.entry) {
		Object.keys(nMakefileAssets.assets.entry).forEach(key => {
				if (!exists(join(app.__rootDirectory, key))) {
					throw new Error(`${key} must exist otherwise this app will not be allowed to start`);

					if (process.env.NODE_ENV !== 'production') {
						logger.warn('if you\'re running in development mode please ensure "make build" has run successfully');
					}
				}
				logger.info({ event: 'ASSERTED_EXISTS', file: key });
			});
	}

	return function(options) {
		const file = options.fn(this);
		const fallback = `/${app.__name}/${file}`;
		const hash = assetHashes && assetHashes[file];

		if (!app.__isProduction || !hash) {
			return fallback;
		}

		return `https://next-geebee.ft.com/hashed-assets/${app.__name}/${hash}`;
	}
};
