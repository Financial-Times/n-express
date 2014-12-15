var dateFormat = require('dateformat');

module.exports = function(format, options) {
	if (typeof format !== 'string') {
		options = format;
		format = 'isoDateTime';
	}
	return dateFormat(options.fn(this), format);
};
