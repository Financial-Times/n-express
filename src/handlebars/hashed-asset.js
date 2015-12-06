/*jshint node:true*/
'use strict';

var logger = require('ft-next-logger').logger;

module.exports = function(options) {
	var assetHash;
	var file = options.fn(this);
	var fallback = '/' + options.data.root.__name+'/' + file;
	if (process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'branch') {
		logger.info("Asset hashing is only switched on when NODE_ENV is production or branch");
		return fallback;
	}

	try {
		assetHash = require(options.data.root.__rootDirectory + '/public/asset-hashes.json')[file];
	} catch(err) {
		logger.warn("./public/asset-hashes.json not found.  Falling back to un-fingerprinted files.");
	}
	if (assetHash) {
		return 'https://next-geebee.ft.com/hashed-assets/' + options.data.root.__name + '/' + assetHash;
	}
	return fallback;
};
