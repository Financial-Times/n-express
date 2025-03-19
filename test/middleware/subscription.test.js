const request = require('supertest');
const nextExpress = require('../../main');
const expect = require('chai').expect;

describe('Subscription Middleware', function () {
	let app;
	let locals;

	before(function () {
		app = nextExpress({
			withFlags: true,
			withHandlebars: false,
			withAssets: false,
			withSubscriptionDetails: true,
			systemCode: 'subscription'
		});
		app.get('/', function (req, res) {
			locals = res.locals;
			res.sendStatus(200).end();
		});
	});

	it('Should set the res.locals.subscription property', function (done) {
		request(app)
			.get('/')
			.expect(function () {
				expect(locals).to.have.property('subscription');
			})
			.end(done);
	});

	it('Should set the default subscription object if the header is not set', function (done) {
		request(app)
			.get('/')
			.expect(function () {
				expect(locals.subscription).to.deep.equal({ 		status: 'anonymous',
					productCodes: [],
					licenceIds: [],
					access: {
						isB2b: false,
						isB2c: false,
						isStaff: false
					}});
			})
			.end(done);
	});

	it('Should include the subscription status', function (done) {
		request(app)
			.get('/')
			.set('ft-user-subscription', 'status=subscribed')
			.expect(function () {
				expect(locals.subscription.status).to.equal('subscribed');
			})
			.end(done);
	});

	it('Should include the product codes', function (done) {
		request(app)
			.get('/')
			.set('ft-user-subscription', 'status=subscribed;productCodes=MPR,P2')
			.expect(function () {
				expect(locals.subscription.productCodes).to.deep.equal(['MPR', 'P2']);
			})
			.end(done);
	});

	it('Should include the licence ids', function (done) {
		request(app)
			.get('/')
			.set('ft-user-subscription', 'status=subscribed;productCodes=MPR,P2;licenceIds=licence-0001,licence-0002')
			.expect(function () {
				expect(locals.subscription.licenceIds).to.deep.equal(['licence-0001', 'licence-0002']);
			})
			.end(done);
	});

	it('Should include only the expected access flags', function (done) {
		request(app)
			.get('/')
			.set('ft-user-subscription', 'status=subscribed;productCodes=MPR,P2;licenceIds=licence-0001,licence-0002;access=isB2c,isStaff,isTrialist')

			.expect(function () {
				expect(locals.subscription.access).to.deep.equal({ isB2b: false, isB2c: true, isStaff: true });
			})
			.end(done);
	});

	it('Should set an empty array for licence ids or product codes if the value is not present', function (done) {
		request(app)
			.get('/')
			.set('ft-user-subscription', 'status=subscribed;productCodes=;licenceIds=;access=isB2c,isStaff,isTrialist')

			.expect(function () {
				expect(locals.subscription.licenceIds).to.deep.equal([]);
				expect(locals.subscription.productCodes).to.deep.equal([]);
			})
			.end(done);
	});

	after(() => {
		nextExpress.flags.flags.stop();
		app.close();
	});
});
