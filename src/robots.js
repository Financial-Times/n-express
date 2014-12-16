"use strict";

module.exports = function(req, res) {
	res.set({
		'Content-Type': 'text/plain',
		'Cache-Control': 'max-age:3600, public'
	});
	res.send("User-agent: *\nDisallow: /");
};
