/*global describe, it, beforeEach*/
const request = require('supertest');
const nextExpress = require('../../main');
const expect = require('chai').expect;

describe('Anonymous Middleware', function () {
	let app;
	let locals;

	before(function () {
		app = nextExpress({ withFlags:true, withHandlebars:false, withAssets: false, withAnonMiddleware: true, systemCode: 'anon' });
		app.get('/', function (req, res) {

			locals = res.locals;
			res.sendStatus(200).end();
		});
	});

	it('Should set the res.locals.anon property', function (done) {
		request(app)
			.get('/')
			.expect(function () {
				expect(locals).to.have.property('anon');
			})
			.end(done);
	});

	it('Should set the res.locals.userIsAnoymous property based on the FT-Anonymous-User header', function (done) {
		request(app)
			.get('/')
			.set('FT-Anonymous-User', 'true')
			.expect(function () {
				expect(locals.anon.userIsAnonymous).to.be.true;
			})
			.end(done);
	});

	it('Should provide a firstClickFree model when required', function (done) {
		request(app)
			.get('/')
			.set('FT-Access-Decision', 'GRANTED')
			.set('FT-Access-Decision-Policy', 'PRIVILEGED_REFERER_POLICY')
			.set('FT-Flags', 'firstClickFree:on')
			.expect(function () {
				expect(locals.firstClickFreeModel).to.be.an('object');
				expect(locals.firstClickFreeModel).to.have.property('signInLink');
				expect(locals.firstClickFreeModel).to.have.property('subscribeNowLink');
			})
			.end(done);
	});
});
