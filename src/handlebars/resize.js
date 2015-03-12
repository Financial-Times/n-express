'use strict';

module.exports = function(width, options) {
	
	// TODO swap ‘docs’ with the app name
	return '//image.webservices.ft.com/v1/images/raw/' + encodeURIComponent(options.fn(this)) + '?width=' + width + '&source=docs&fit=scale-down';
};
