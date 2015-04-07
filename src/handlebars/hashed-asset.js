/*jshint node:true*/
'use strict';

module.exports = function(options) {
	var assetHash;
	var file = options.fn(this);
	var fallback = '/' + options.data.root.__name+'/' + file;
	var prefix = (options.data.root.flags.s3.isSwitchedOn ? 'next-' : '') + 'hashed-assets';
	if (process.env.NODE_ENV !== 'production') {
		console.log("Asset hashing is only switched on when NODE_ENV is production");
		return fallback;
	}

	if (!options.data.root.flags.assetHashing.isSwitchedOn) {
		console.warn("Asset Hashing flag off, falling back to un-fingerprinted files");
		return fallback;
	}

	try {
		assetHash = require(options.data.root.__rootDirectory + '/public/asset-hashes.json')[file];
	} catch(err) {
		console.warn("./public/asset-hashes.json not found.  Falling back to un-fingerprinted files.");
	}
	if (assetHash) {
		return '/' + prefix + '/' + options.data.root.__name + '/' + assetHash;
	}
	return fallback;
};
