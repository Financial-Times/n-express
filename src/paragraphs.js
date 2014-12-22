'use strict';

module.exports = function(start, end, options) {
	var pars = options.fn(this).split('</p>');
	start = start || 0;
	end = end || pars.length;
	return pars.slice(start, end).filter(function(p) {
		return p.length > 0;
	}).concat(['']).join('</p>');
};
