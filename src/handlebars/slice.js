'use strict';

module.exports = function(context, block) {
	var ret = "";
	var offset = parseInt(block.hash.offset) || 0;
	var limit = parseInt(block.hash.limit) || 5;
	var i = offset;
	var j = ((limit + offset) < context.length) ? (limit + offset) : context.length;

	for(i,j; i<j; i++) {
		ret += block.fn(context[i]);
	}

	return ret;
};
