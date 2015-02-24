'use strict';

var handlebars = require('handlebars');

module.exports = function(name, opts) {
	return handlebars.partials[name] ? handlebars.partials[name](this, opts) : '';
};
