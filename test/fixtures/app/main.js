/*jshint node:true*/
'use strict';

var port = process.env.PORT || 3000;
var express = require('../../../main');
var yell = require('./src/yell');

var app = module.exports = express({
	directory: __dirname,
	helpers: { yell: yell }
});

app.get("/", function(req, res) {
	res.send("Hello world");
});

app.get("/__flags.json", function(req, res) {
	res.send(res.locals.flags);
});

app.get('/templated', function(req, res, next) {
	res.render('main', {
		title: "FT",
		image: "https://avatars0.githubusercontent.com/u/3502508?v=3",
		date: new Date('Fri Aug 01 2014 00:00:00 GMT')
	});
});

app.listen(port, function() {
	console.log("Listening on " + port);
});
