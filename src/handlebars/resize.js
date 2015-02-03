'use strict';

module.exports = function(width, options) {
	return '//imageservice.glb.ft.com/v1/images/raw/' + encodeURIComponent(options.fn(this)) + '?width=' + width + '&source=docs&fit=scale-down';
};
