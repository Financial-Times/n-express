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
				}
				logger.info({ event: 'ASSERTED_EXISTS', file: key });
			});
	}

	return function(options) {
		const file = options.fn(this);
		const fallback = `/${app.__name}/${file}`;
		const hash = assetHashes && assetHashes[file];

		// Use fallback if the environment is not production AND not a branch build OR if there is no hash available.
		if ((!app.__isProduction && !app.__isBranch) || !hash) {
			return fallback;
		}

		return `https://next-geebee.ft.com/hashed-assets/${app.__name}/${hash}`;
	}
};
