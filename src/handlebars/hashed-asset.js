/*jshint node:true*/
'use strict';

module.exports = function(options) {
	var assetHash;
	var file = options.fn(this);
	var fallback = '/' + options.data.root.__name+'/' + file;
	if (!options.data.root.flags.assetHashing) {
		return fallback;
	}

	try {
		assetHash = require(options.data.root.__rootDirectory + '/public/assets-hashes.json')[file];
	} catch(err) {
		console.warn("./public/asset-hashes.json not found.  Falling back to un-fingerprinted files.");
	}

	if (assetHash) {
		return '//financial-times.github.io/next-hashed-assets/' + options.data.root.__name + '/' + assetHash;
	}
	return fallback;
};
