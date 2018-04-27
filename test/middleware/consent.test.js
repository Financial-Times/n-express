/*global describe, it, beforeEach*/
const request = require('supertest');
const nextExpress = require('../../main');
const expect = require('chai').expect;

describe('Consent middleware', function () {
	let app;
	let locals;

	before(function () {
		app = nextExpress({
			systemCode: 'consent',
			withConsent: true
		});
		app.get('/', function (req, res) {
			locals = res.locals;
			res.sendStatus(200).end();
		});
	});

	it('Should set the res.locals.consent property', function (done) {
		request(app)
			.get('/')
			.expect(function () {
				expect(locals).to.have.property('consent');
			})
			.end(done);
	});

	it('Should handle the FT-Consent="-" header', function (done) {
		request(app)
			.get('/')
			.set('FT-Consent', '-')
			.expect(function () {
				expect(locals.consent).to.be.empty.and.an('object');
			})
			.end(done);
	});

	context('Should set the res.locals.consent property based on the FT-Consent header', () => {
		[
			{
				header: 'marketingByemail:on,recommendedcontentOnsite:off',
				expectedObject: {
					marketingByemail: true,
					recommendedcontentOnsite: false
				}
			},
			{
				header: 'marketingByemail:notOn,not-a-valid-consent',
				expectedObject: {
					marketingByemail: false
				}
			},
			{
				header: ':',
				expectedObject: {}
			}
		].forEach(({ header, expectedObject }) => {

			it(`ft-consent="${header}`, function (done) {
				request(app)
					.get('/')
					.set('FT-Consent', header)
					.expect(function () {
						expect(locals.consent).to.deep.equal(expectedObject);
					})
					.end(done);
			});

		});
	});
});
