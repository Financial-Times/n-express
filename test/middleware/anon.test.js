const request = require('supertest');
const nextExpress = require('../../main');
const expect = require('chai').expect;

describe('Anonymous Middleware', function () {
	let app;
	let locals;

	before(function () {
		app = nextExpress({
			withFlags: true,
			withHandlebars: false,
			withAssets: false,
			withAnonMiddleware: true,
			systemCode: 'anon'
		});
		app.get('/', function (req, res) {
			locals = res.locals;
			res.sendStatus(200).end();
		});
		app.get('/__gtg', function (req, res) {
			locals = res.locals;
			res.sendStatus(200).end();
		});
		app.post('/', function (req, res) {
			locals = res.locals;
			res.sendStatus(200).end();
		});
		app.put('/', function (req, res) {
			locals = res.locals;
			res.sendStatus(200).end();
		});
	});

	it('Should not set the properties for requests with __ prefix', function (done) {
		request(app)
			.get('/__gtg')
			.expect(function () {
				expect(locals).not.to.have.property('anon');
			})
			.end(done);
	});

	it('Should not set the properties for POST requests', function (done) {
		request(app)
			.post('/')
			.expect(function () {
				expect(locals).not.to.have.property('anon');
			})
			.end(done);
	});

	it('Should not set the properties for PUT requests', function (done) {
		request(app)
			.put('/')
			.expect(function () {
				expect(locals).not.to.have.property('anon');
			})
			.end(done);
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
				expect(locals.anon.userIsLoggedIn).to.be.false;
				expect(locals.anon.userIsSubscribed).to.be.false;
			})
			.end(done);
	});

	it('Should set the res.locals.userIsSubscribed property based on the ft-user-subscription header', function (done) {
		request(app)
			.get('/')
			.set('FT-Anonymous-User', 'false')
			.set('ft-user-subscription', 'status=subscribed;productCodes=;licenceIds=;access=isB2c,isStaff,isTrialist')
			.expect(function () {
				expect(locals.anon.userIsAnonymous).to.be.false;
				expect(locals.anon.userIsLoggedIn).to.be.true;
				expect(locals.anon.userIsSubscribed).to.be.true;
			})
			.end(done);
	});

	it('Should set the res.locals.userIsSubscribed property should fallback to ft-user-subscription-status if there is an issue with the ft-user-subscription-header', function (done) {
		request(app)
			.get('/')
			.set('FT-Anonymous-User', 'false')
			.set('ft-user-subscription', 'status=anonymous')
			.set('ft-user-subscription-status', 'subscribed')
			.expect(function () {
				expect(locals.anon.userIsAnonymous).to.be.false;
				expect(locals.anon.userIsLoggedIn).to.be.true;
				expect(locals.anon.userIsSubscribed).to.be.true;
			})
			.end(done);
	});

	after(() => {
		nextExpress.flags.flags.stop();
		app.close();
	});
});
