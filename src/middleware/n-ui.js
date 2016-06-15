'use strict';
const path = require('path');
let minorVersion = false;
try {
	minorVersion = 'v' + require(path.join(process.cwd(), 'bower_components/n-ui/.bower.json')).version.split(".").slice(0,2).join('.');
} catch (e) {}

module.exports = function(req, res, next) {
	res.locals.nUiVersion = minorVersion;
	next()
};
