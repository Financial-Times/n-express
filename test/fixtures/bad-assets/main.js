
const express = require('../../../main');
const app = module.exports = express({
	name: 'bad-assets',
	directory: __dirname,
	withHandlebars: true
});

module.exports.listen = app.listen(3000);
