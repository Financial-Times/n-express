'use strict';

const logger = require('@financial-times/n-logger').default;

let assetHashes;
let appLocals;

module.exports.init = locals => {
	try {
		assetHashes = require(`${locals.__rootDirectory}/public/asset-hashes.json`);
	} catch(err) {
		assetHashes = {};
		logger.warn('./public/asset-hashes.json not found. Falling back to un-fingerprinted files.');
	}

	appLocals = locals;
}

module.exports.get = file => {
	const fallback = `/${appLocals.__name}/${file}`;
	const hash = assetHashes[file];
	return (!appLocals.__isProduction || !hash) ? fallback : `//www.ft.com/__assets/hashed/${appLocals.__name}/${hash}`;
}
