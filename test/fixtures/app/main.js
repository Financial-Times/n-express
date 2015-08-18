/*jshint node:true*/
'use strict';

var port = process.env.PORT || 3000;
var express = require('../../../main');
var yell = require('./src/yell');

express.services['ft-next-personalised-feed-api'] = /\/__fail/;

var app = module.exports = express({
	directory: __dirname,
	helpers: { yell: yell },
	sensuChecks: [
		{
			check: 'sumSeries(foo.*.bar)',
			name: "custom-metric",
			message: "The ratio of errors to good responses is above a healthy rate"
		}
	]
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
	res.locals.__isProduction  = req.query.prod || res.locals.__isProduction;
	res.render('main', {
		layout: 'wrapper',
		items: [1,2,3,4,5],
		text : "<p>Paragraph 1</p><p>Paragraph 2</p><p>Paragraph 3</p>",
		og: {
			url: 1
		},
		twitterCard: {
			title: 'hello',
			image: 'http://foo.png'
		}
	});
});

app.get('/vanilla', function(req, res, next) {
	res.locals.__isProduction  = req.query.prod || res.locals.__isProduction;
	res.render('main', {
		layout: 'vanilla',
		items: [1,2,3,4,5],
		text : "<p>Paragraph 1</p><p>Paragraph 2</p><p>Paragraph 3</p>"
	});
});

app.get('/with-set-base', function(req, res, next) {
	res.render('main', {
		layout: 'wrapper',
		setBase: '//next.ft.com',
		items: [1,2,3,4,5],
		text : "<p>Paragraph 1</p><p>Paragraph 2</p><p>Paragraph 3</p>"
	});
});

app.get('/__fail', function(req, res){
	res.sendStatus(503);
});

var router = express.Router();

app.use('/router', router);

router.get("/", function(req, res) {
	res.send("Hello router");
});

module.exports.listen = app.listen(port, function() {
	console.log("Listening on " + port);
});
