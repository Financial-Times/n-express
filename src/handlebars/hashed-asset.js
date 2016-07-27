'use strict';

const logger = require('@financial-times/n-logger').default;
let assetHashes;

try {
	assetHashes = require(`${app.__rootDirectory}/public/asset-hashes.json`);
} catch(err) {
	assetHashes = {};
	logger.warn('./public/asset-hashes.json not found. Falling back to un-fingerprinted files.');
}

module.exports = app => {

	app.locals.hashedAssets = {};
	app.locals.hashedAssetPaths = [];

	const slice = [].slice;

	return function(options) {
		const file = options.fn(this);
		let url = app.locals.hashedAssets[file];
		if (!url) {
			const fallback = `/${app.__name}/${file}`;
			const hash = assetHashes[file];
			url = app.locals.hashedAssets[file] =(!app.locals.__isProduction || !hash) ? fallback : `https://next-geebee.ft.com/hashed-assets/${app.locals.__name}/${hash}`;
			app.locals.hashedAssetPaths = Object.keys(app.locals.hashedAssets).map(k => app.locals.hashedAssets[k]);
		}
		return url;
	}
};
