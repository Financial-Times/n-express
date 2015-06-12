'use strict';
/*global describe, it*/
var BarriersModel = require('../../src/barriers/models/barriers');
var expect = require('chai').expect;
var barrierTypes = require('../../src/barriers/barrierTypes');
var util = require('util');

describe('Barriers Model', function(){

	describe('Anonymous Barrier', function(){

		it('Should have an anonymousBarrier property if barrier type is REGISTER_PLUS', function(){
			var model = new BarriersModel(barrierTypes.TRIAL, {});
			expect(model).to.have.property('anonymousBarrier');
			expect(model).not.to.have.property('premiumBarrier');
		});
	});

	describe('Premium Barrier', function(){

		it('Should have a premiumBarrier property if barrier type is PREMIUM', function(){
			var model = new BarriersModel(barrierTypes.PREMIUM, {}, 'GBR');
			expect(model).not.to.have.property('anonymousBarrier');
			expect(model).to.have.property('premiumBarrier');
		});

		it('Should have the correct signup url', function(){
			var data = {premiumOfferId:'premium'};
			var countryCode = 'GBR';
			var expectedSignupUrl = util.format(
				'https://subscription.ft.com/?offerId=%s&countryCode=%s',
				data.premiumOfferId,
				countryCode
			);

			var model = new BarriersModel(barrierTypes.PREMIUM, data, countryCode);
			expect(model.premiumBarrier.subscribeNowLink).to.equal(expectedSignupUrl);
		});
	});






});
