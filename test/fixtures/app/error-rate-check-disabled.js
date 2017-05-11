/*jshint node:true*/
const PORT = process.env.PORT || 4000;
const express = require('../../..');

const app = module.exports = express({
	directory: __dirname,
	withFlags: !process.env.DISABLE_FLAGS,
	systemCode: 'test-app',
	skipDefaultErrorRateCheck: true
});

app.get('/', function (req, res) {
	res.send('Hello world');
});

app.get('/__flags.json', function (req, res) {
	res.send(res.locals.flags);
});

app.get('/single-header', function (req, res) {
	res.set('test-header', 'is-set');
	res.sendStatus(200);
});

app.get('/let-me-in', function (req, res) {
	res.end('', 200);
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
	res.set('Vary', 'ft-flags');
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

const router = new express.Router();

app.use('/router', router);

router.get('/', function (req, res) {
	res.send('Hello router');
});

module.exports.listen = app.listen(PORT);
