'use strict';

module.exports = function(name, opts) {
	if (!this.blocks) {
		this.blocks = {};
	}
	if (!this.blocks[name]) {
		this.blocks[name] = [];
	}
	this.blocks[name].push(opts.fn(this));
};
