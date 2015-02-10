'use strict';

module.exports = function(name, opts) {
	var exists = false;
	if (this.blocks && this.blocks[name]) {
		if (this.blocks[name].length && this.blocks[name][0].length) {
			exists = true;
		} else {
			exists = false;
		}
	} else if (opts.hash.hasDefault) {
		exists = true;
	}
	return exists ? opts.fn(this) : opts.inverse(this);
};
