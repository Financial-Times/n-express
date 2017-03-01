/*jshint node:true*/
const PORT = process.env.PORT || 3001;
const express = require('../../..');

const app = module.exports = express({
	directory: __dirname,
	withFlags: !process.env.DISABLE_FLAGS,
	systemCode: 'test-auth-app'
});

app.get('/', function (req, res) {
	res.send('Hello world');
});


module.exports.listen = app.listen(PORT);
