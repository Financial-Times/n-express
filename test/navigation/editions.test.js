'use strict';
const expect = require('chai').expect;
const sinon = require('sinon');

describe('Editions', () => {

	let Editions;

	before(() => {
		Editions = require('../../src/navigation/editionsModel');
	});

	it('Should return available editions', () => {
		let editions = new Editions();
		let expected = [
			{
				id: 'uk',
				name: 'UK'
			},
			{
				id: 'international',
				name: 'International'
			}
		];

		let result = editions.available;
		expect(result).to.deep.equal(expected);
	});


	context('Middleware', () => {
		let res = {locals:{}, cookie:sinon.stub(), vary: sinon.spy()};
		let next = sinon.spy();
		let editionHeader = 'uk';
		let req = { get: sinon.stub().returns(editionHeader), query:{} };

		it('Should save edition data in res.locals', () => {
			let edition = new Editions();
			edition.middleware(req, res, next);
			expect(res.locals.editions).to.exist;
			sinon.assert.called(next);
		});

		it('Should be able to get the current edition from the header', () => {
			let editions = new Editions();
			editions.middleware(req, res, next);
			expect(res.locals.editions.current.id).to.equal(editionHeader);
			sinon.assert.calledWith(req.get, 'FT-Edition');
		});

		it('Should be able to get the requested edition from a querystring and save it in a cookie', () => {
			req.query.edition = 'international';
			let editions = new Editions();
			editions.middleware(req, res, next);
			expect(res.locals.editions.current.id).to.equal('international');
			sinon.assert.calledWith(res.cookie, 'next-edition', 'international', { domain: 'ft.com', maxAge: 1000 * 60 * 60 * 24 * 365 })
		});

		it('Should vary request on edition', () => {
			let editions = new Editions();
			editions.middleware(req, res, next);
			sinon.assert.calledWith(res.vary, 'FT-Edition');
		});

		it('Should expose the unselected editions', () => {
			delete req.query.edition;
			let editions = new Editions();
			editions.middleware(req, res, next);
			expect(res.locals.editions.others).to.exist;
			expect(res.locals.editions.others.length).to.equal(1);
			expect(res.locals.editions.others[0].id).to.equal('international');

		})
	})
});
