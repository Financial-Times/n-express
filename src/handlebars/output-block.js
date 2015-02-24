'use strict';

module.exports = function(name, opts) {
	if (!this.blocks) {
		this.blocks = {};
	}

	var val = this.blocks[name] && this.blocks[name].length > 0 ? this.blocks[name][0] : opts.fn(this);

	return val;
};
