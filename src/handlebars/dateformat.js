'use strict';

var dateFormat = require('dateformat');

module.exports = function(format, options) {
	if (typeof format !== 'string') {
		options = format;
		format = 'isoUtcDateTime';
	}
	if (format === 'isoDateTime' || format === 'isoUtcDateTime') {
		format = 'isoUtcDateTime';
		return dateFormat(options.fn(this), format, true);
	}
	return dateFormat(options.fn(this), format);
};
