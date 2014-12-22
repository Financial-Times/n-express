"use strict";

module.exports = function(options) {
	console.log(options.fn(this));
	return options.fn(this).replace(/<img[^>]+>/g, '');
};
