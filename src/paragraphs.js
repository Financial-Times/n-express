'use strict';

module.exports = function(input, options) {

	var text = input instanceof Array ? input.join('') : input,
		paras = text.split('</p>'),
		start = options.hash.start || 0,
		end = options.hash.end || paras.length;

	return paras.slice(start, end).filter(function(p) {
		return p.length > 0;
	}).concat(['']).join('</p>');
};
