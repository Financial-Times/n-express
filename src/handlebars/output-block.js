'use strict';

module.exports = function(name, opts) {
	if (!this.blocks) {
		this.blocks = {};
	}

	var val = this.blocks[name] && this.blocks[name].length > 0 ? this.blocks[name][0] : opts.fn(this);

	//precaution to avoid content set once from overriding default for future instances.
	//not sure if this ever could happen, but I have a hunch doing this is a good idea - RE
	delete this.blocks[name];
	return val;
};
