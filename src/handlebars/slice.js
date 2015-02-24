'use strict';

module.exports = function(context, block) {
	var ret = "",
		offset = parseInt(block.hash.offset) || 0,
		limit = parseInt(block.hash.limit) || 5,
		i = offset,
		j = ((limit + offset) < context.length) ? (limit + offset) : context.length;

	for(i,j; i<j; i++) {
		ret += block.fn(context[i]);
	}

  	return ret;
};
