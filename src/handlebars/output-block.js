'use strict';

module.exports = function(name, context) {
  if (!this.blocks) {
      this.blocks = {};
  }

  var val = this.blocks[name] && this.blocks[name].length > 0 ? this.blocks[name][0] : context.fn(this);

  return val;
};