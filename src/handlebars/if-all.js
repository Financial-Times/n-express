'use strict';

module.exports = function() {

	var args = [].slice.call(arguments);
	var opts = args.pop();

	return args.some(function (arg) {
		return !arg;
	}) ? opts.inverse(this) : opts.fn(this);
};
