'use strict';

module.exports = function(options) {
	return options.fn(this).toUpperCase();
};
