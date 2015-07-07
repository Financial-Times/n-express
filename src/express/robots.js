"use strict";

var fs = require('fs');
var robots = fs.readFileSync(__dirname + '/robots.txt', { encoding: 'utf8' });

module.exports = function(req, res) {
	res.set({
		'Content-Type': 'text/plain',
		'Cache-Control': 'max-age:3600, public'
	});
	res.send(robots);
};
