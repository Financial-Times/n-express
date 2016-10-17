/*jshint node:true*/
'use strict';

const PORT = process.env.PORT || 3000;
const express = require('../../..');
const yell = require('./src/yell');

const app = module.exports = express({
	directory: __dirname,
	helpers: { yell: yell },
	withFlags: true,
	withHandlebars: true,
	withNavigation: true,
	hasNUiBundle: true,
	withNavigationHierarchy: true,
	withAnonMiddleware: true,
	withBackendAuthentication: true,
	layoutsDir: __dirname + '/views/'
});

app.get('/', function(req, res) {
	res.send('Hello world');
});

app.get('/__flags.json', function(req, res) {
	res.send(res.locals.flags);
});

app.get('/templated', function(req, res) {
	res.render('main', Object.assign({
		title: 'FT',
		image: 'https://avatars0.githubusercontent.com/u/3502508?v=3',
		date: new Date('Fri Aug 01 2014 00:00:00 GMT'),
		text : '<p>Paragraph 1</p><p>Paragraph 2</p><p>Paragraph 3</p>',
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
	}, req.query || {}));
});

app.get('/with-layout', function(req, res) {
	res.locals.__isProduction = req.query.prod || res.locals.__isProduction;
	res.render('main', {
		layout: 'wrapper',
		title: 'FT',
		items: [1,2,3,4,5],
		text : '<p>Paragraph 1</p><p>Paragraph 2</p><p>Paragraph 3</p>'
	});
});

app.get('/single-header', function (req, res) {
	res.set('test-header', 'is-set');
	res.sendStatus(200);
});

app.get('/multiple-header', function (req, res) {
	res.set({
		'test-header1': 'is-set',
		'test-header2': 'is-set'
	});
	res.sendStatus(200);
});

app.get('/default-vary', function (req, res) {
	res.sendStatus(200);
});

app.get('/single-vary', function (req, res) {
	// NOTE testing out tricky capitalisation
	res.set('Vary', 'Test-Vary');
	res.sendStatus(200);
});

app.get('/vary-method', function (req, res) {
	// NOTE testing out tricky capitalisation
	res.vary('Test-Vary');
	res.sendStatus(200);
});

app.get('/duplicate-vary', function (req, res) {
	// NOTE testing out tricky capitalisation
	res.set('Vary', 'ft-anonymous-user');
	res.sendStatus(200);
});


app.get('/array-vary', function (req, res) {
	// NOTE testing out tricky capitalisation
	res.set('Vary', ['Test-Vary1', 'Test-Vary2']);
	res.sendStatus(200);
});

app.get('/multiple-vary', function (req, res) {
	res.set({
		'test-header': 'is-set',
		'Vary': 'Test-Vary'
	});
	res.sendStatus(200);
});

app.get('/unset-vary', function (req, res) {
	res.unVary('Country-Code')
	res.sendStatus(200);
});

app.get('/unset-all-vary', function (req, res) {
	res.unvaryAll(req.query.preset);
	res.sendStatus(200);
});

app.get('/no-empty-vary', function (req, res) {
	res.unvaryAll();
	res.vary('thing');
	res.unVary('thing');
	res.sendStatus(200);
});

app.get('/mixed-vary', function (req, res) {
	res.unVary('Country-code')
	res.set('Vary', 'test-vary');
	res.set({'test-header': 'is-set'});
	res.sendStatus(200);
});

app.get('/cache', (req, res) => {
	res.cache(req.query.length)
	res.sendStatus(200);
});

app.post('/cache', require('body-parser').json(), (req, res) => {
	res.cache(req.body[0], req.body[1]);
	res.sendStatus(200);
});

app.get('/cache-constants', (req, res) => {
	res.set('FT_NO_CACHE', res.FT_NO_CACHE);
	res.set('FT_SHORT_CACHE', res.FT_SHORT_CACHE);
	res.set('FT_HOUR_CACHE', res.FT_HOUR_CACHE);
	res.set('FT_DAY_CACHE', res.FT_DAY_CACHE);
	res.set('FT_WEEK_CACHE', res.FT_WEEK_CACHE);
	res.set('FT_LONG_CACHE', res.FT_LONG_CACHE);
	res.sendStatus(200);
});

app.get('/non-html', (req, res) => {
	res.set('Content-Type', 'application/json')
	if (req.query.preload) {
		res.linkResource('it.js', {
			rel: 'preload',
			as: 'script'
		}, {hashed: true}),
		res.linkResource('https://place.com/it.js', {
			rel: 'preload',
			as: 'script'
		})
	}
	res.sendStatus(200);
});

const router = new express.Router();

app.use('/router', router);

router.get('/', function(req, res) {
	res.send('Hello router');
});

module.exports.listen = app.listen(PORT);
