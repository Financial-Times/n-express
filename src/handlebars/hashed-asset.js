/*jshint node:true*/
'use strict';

module.exports = function(options) {
	var assetHash;
	var file = options.fn(this);
	try {
		assetHash = require(options.data.root.__rootDirectory + '/public/' + file + '-asset-hash.json')[file];
	} catch(err) {
		if (process.env.NODE_ENV === 'production') {
			throw new Error("./public/" + file + "-asset-hash.json not found, required for proper working of the application in production");
		} else {
			console.warn("./public/" + file + "-asset-hash.json not found.  Falling back to un-fingerprinted files.");
		}
	}
	if (assetHash) {
		file = assetHash;
	}
	return '/' + options.data.root.__name+'/' + file;
};
