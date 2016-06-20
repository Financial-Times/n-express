'use strict';

const express = require('../../..');
const app = module.exports = express({
	name: 'bad-assets',
	directory: __dirname,
	withHandlebars: true
});

module.exports.listen = app.listen(3000);
