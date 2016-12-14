"use strict";

const expect = require('chai').expect;
const sinon = require('sinon');

describe('Welcome Banner Model', () => {

	let welcomeBannerModelFactory;

	before(() => {
		welcomeBannerModelFactory = require('../../src/welcome-banner/model');
	});

	const wait = t => new Promise(r => setTimeout(r, t));

	it('Should provide the welcome banner model by default', () => {
		const res = {locals:{flags:{}}};
		const req = {path:'/', get: () => ''};
		const next = sinon.spy();
		welcomeBannerModelFactory(req, res, next);
		return wait(0).then(() => {
			sinon.assert.called(next);
			expect(res.locals).to.have.property('welcomeBanner');
			expect(res.locals.welcomeBanner).to.deep.equal(welcomeBannerModelFactory._banners.defaultWelcomeBannerModel)
		})
	});

	it('Should provide the compact advert view model if the compactView flag is on AND we are on the homepage AND the FT-Cookie-ft-homepage-view IS NOT set to "compact"', () => {
		const res = {locals:{flags:{compactView:true}}};
		const req = {path:'/', get: () => 'standard'};
		const next = sinon.spy();
		welcomeBannerModelFactory(req, res, next);
		return wait(0).then(() => {
			sinon.assert.called(next);
			expect(res.locals).to.have.property('welcomeBanner');
			expect(res.locals.welcomeBanner).to.deep.equal(welcomeBannerModelFactory._banners.compactAdvertWelcomeBannerModel)
		})
	});

	it('Should provide the compact view model if the compactView flag is on AND we are on the homepage AND the FT-Cookie-ft-homepage-view IS set to "compact"', () => {
		const res = {locals:{flags:{compactView:true}}};
		const req = {path:'/', get: () => 'compact'};
		const next = sinon.spy();
		welcomeBannerModelFactory(req, res, next);
		return wait(0).then(() => {
			sinon.assert.called(next);
			expect(res.locals).to.have.property('welcomeBanner');
			expect(res.locals.welcomeBanner).to.deep.equal(welcomeBannerModelFactory._banners.compactViewWelcomeBannerModel)
		})
	})


})
