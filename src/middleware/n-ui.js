'use strict';
const path = require('path');
let version = false;
try {
	version = require(path.join(process.cwd(), 'bower_components/n-ui/.bower.json')).version;

	if (!/(beta|rc)/.test(version)) {
		version = version.split(".").slice(0,2).join('.');
	}

	version = 'v' + version;

} catch (e) {}

module.exports = function(req, res, next) {
	res.locals.nUiVersion = version;
	if (res.locals.flags.externalNUiBundle) {
		res.locals.assetsDirectory = 'external-n-ui/';
	}
	next()
};
