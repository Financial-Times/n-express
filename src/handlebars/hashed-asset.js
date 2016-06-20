'use strict';

const logger = require('@financial-times/n-logger').default;

module.exports = app => {
	let assetHashes;

	try {
		assetHashes = require(`${app.__rootDirectory}/public/asset-hashes.json`);
	} catch(err) {
		logger.warn('./public/asset-hashes.json not found. Falling back to un-fingerprinted files.');
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
