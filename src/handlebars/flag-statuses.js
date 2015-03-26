'use strict';

module.exports = function(opts) {
	var flags = opts.data.root.flags;

	if (!flags) {
		return '';
	}

	return 'data-next-flags="' + Object.keys(flags).filter(function(flagName) {
			return !flags[flagName].isSwitchedOn;
		}).map(function (flagName) {
			return flagName.replace(/[A-Z]/g, function($0) {
				return '-' + $0.toLowerCase();
			}) + '--off';
		}).join (' ') + '"';
};
