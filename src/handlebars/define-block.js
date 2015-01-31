'use-strict';

module.exports = function(name, context) {
    if (!this.blocks) {
        this.blocks = {};
    }
    if (!this.blocks[name]) {
        this.blocks[name] = [];
    }
    this.blocks[name].push(context.fn(this)); // for older versions of handlebars, use block.push(context(this));
};
