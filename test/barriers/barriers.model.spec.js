'use strict';
/*global describe, it*/
var BarriersModel = require('../../src/barriers/models/barriersModel');
var expect = require('chai').expect;
var barrierTypes = require('../../src/barriers/barrierTypes').barriers;
var util = require('util');


describe('Barriers Model', function(){

	var barrierData = require('../fixtures/barrierData.json');

	describe('Trials Barrier', function(){

		it('Should show Simple Trials Barrier if barrier type is TRIAL_SIMPLE', function(){
			var model = new BarriersModel(barrierTypes.TRIAL_SIMPLE, barrierData);
			expect(model.trialSimple).to.be.truthy;
			expect(model.trialGrid).to.be.null;
			expect(model.premiumSimple).to.be.null;
		});

		it('Should show Grid Trials Barrier if barrier type is TRIAL_GRID', function(){
			var model = new BarriersModel(barrierTypes.TRIAL_GRID, barrierData);
			expect(model.trialSimple).to.be.null;
			expect(model.trialGrid).to.be.truthy;
			expect(model.premiumSimple).to.be.null;
		});
	});

	describe('Premium Barrier', function(){

		it('Should have a premiumSimple property if barrier type is PREMIUM_SIMPLE', function(){
			var model = new BarriersModel(barrierTypes.PREMIUM_SIMPLE, barrierData);
			expect(model.trialSimple).to.be.null;
			expect(model.trialGrid).to.be.null;
			expect(model.premiumSimple).to.be.truthy;
		});

		it('Should have the correct signup url', function(){
			var countryCode = 'GBR';
			var expectedSignupUrl =
				barrierData.viewData.subscriptionOptions.PREMIUM.callToActionUrl + '&countryCode=' + countryCode;

			var model = new BarriersModel(barrierTypes.PREMIUM_SIMPLE, barrierData, countryCode);
			expect(model.premiumSimple.subscribeNowLink).to.equal(expectedSignupUrl);
		});
	});






});
