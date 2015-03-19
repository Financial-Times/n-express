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
		date: new Date('Fri Aug 01 2014 00:00:00 GMT'),
		text : "<p>Paragraph 1</p><p>Paragraph 2</p><p>Paragraph 3</p>",
		block1default: 'block1default',
		block2default: 'block2default',
		block2override: 'block2override',
		thing1: 'thing1',
		thing2: 'thing2',
		thing3: 'thing3',
		items: [1,2,3,4,5],
		obj: {prop: 'val'},
		partial: 'partial',
		rootVar: 'iamroot'
	});
});

app.get('/wrapped', function(req, res, next) {
	res.render('main', {
		layout: 'wrapper',
		items: [1,2,3,4,5],
		text : "<p>Paragraph 1</p><p>Paragraph 2</p><p>Paragraph 3</p>"
	});
});

app.get('/vanilla', function(req, res, next) {
	res.render('main', {
		layout: 'vanilla',
		items: [1,2,3,4,5],
		text : "<p>Paragraph 1</p><p>Paragraph 2</p><p>Paragraph 3</p>"
	});
});

module.exports.listen = app.listen(port, function() {
	console.log("Listening on " + port);
});
