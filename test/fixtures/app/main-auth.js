/*jshint node:true*/
const PORT = process.env.PORT || 3001;
const express = require('../../..');

const app = (module.exports = express({
	name: 'test-auth',
	directory: __dirname,
	withFlags: false,
	systemCode: 'test-auth-app'
}));

app.get('/', function (req, res) {
	res.send('Hello world');
});

module.exports.listen = app.listen(PORT);
