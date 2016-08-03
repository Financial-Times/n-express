'use strict';

const logger = require('@financial-times/n-logger').default;

module.exports = locals => {
	let assetHashes;

	try {
		assetHashes = require(`${locals.__rootDirectory}/public/asset-hashes.json`);
	} catch(err) {
		assetHashes = {};
		logger.warn('./public/asset-hashes.json not found. Falling back to un-fingerprinted files.');
	}

	function getPath (file) {
		const fallback = `/${locals.__name}/${file}`;
		const hash = assetHashes[file];
		return (!locals.__isProduction || !hash) ? fallback : `https://next-geebee.ft.com/hashed-assets/${locals.__name}/${hash}`;
	}

	return {
		helper: function(options) {
			return getPath(options.fn(this));
		},
		getPath: getPath
	}
}
