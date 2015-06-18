'use strict';
/* global describe, it, before*/
require('isomorphic-fetch');
var fetchres = require('fetchres');
var TrialGridBarrierModel = require('../../src/barriers/models/trialGridBarrierModel');
var hardCodedBarrierData = require('../../src/barriers/models/hardCodedBarrierData');
var expect = require('chai').expect;

describe('Trial Grid Barrier Model', function(){

	var apiData;
	var model;
	var requestHeaders = {
		'Session-Id' : '04Php9SDvE2o05aglBovDnXIzwAAAU1rrQT1wg.MEUCIQDiAgu1jRjooIkO0d2tWJihjkExf6R0gOw-Dq8htEoAZQIgT3fFkTjk8o6ufS_xv4Asowx60wY6kiqjBP2S1Q_yNes',
		'Country-Code' : 'GBR',
		'Content-Classification' : 'CONDITIONAL_STANDARD',
		'AYSC' : '_01_02X_04PVT_05TEL_06TEC_07TS_12_13GBR_14GBR_15PVT_17PVT_18PVT_19xxxx_20x_22P0P2Tools_24PVT_25PVT_26PVT_27PVT_96PVT_97_98PVT_',
		'FT_Location' : 'https://next.ft.com'
	};

	var barrierAPIUrl = 'https://subscribe.ft.com/memb/barrier/v1/barrier-data';

	before(function(done){
		fetch(barrierAPIUrl, {headers:requestHeaders}).then(fetchres.json).then(function(json){
			apiData = json;
			model = new TrialGridBarrierModel(apiData);
			done();
		}).catch(done);
	});

	it('Should have a sign in link', function(){
		expect(model.signInLink).to.equal('/login');
	});

	describe('Offers Presented', function(){

		it('Should show the Trial offer', function(){
			expect(model.packages).to.have.property('trial');
		});
		it('Should show the Standard offer', function(){
			expect(model.packages).to.have.property('standard');
		});
		it('Should show the Premium offer', function(){
			expect(model.packages).to.have.property('premium');
		});
		it('Should show the Newspaper offer', function(){
			expect(model.packages).to.have.property('newspaper');
		});
	});

	describe('Package Data', function(){

		describe('Subscribe Link', function(){

			it('Should have a subscribe link for each package', function(){
				expect(model.packages.trial.subscribeLink).to.equal(apiData.viewData.subscriptionOptions.TRIAL.callToActionUrl);
				expect(model.packages.standard.subscribeLink).to.equal(apiData.viewData.subscriptionOptions.STANDARD.callToActionUrl);
				expect(model.packages.premium.subscribeLink).to.equal(apiData.viewData.subscriptionOptions.PREMIUM.callToActionUrl);
				expect(model.packages.newspaper.subscribeLink).to.equal(apiData.viewData.subscriptionOptions.NEWSPAPER.callToActionUrl);
			});

		});

		describe('Price', function(){

			it('Should have the annual price for each package', function(){
				expect(model.packages.trial.price.annual).to.be.a('string');
				expect(model.packages.standard.price.annual).to.be.a('string');
				expect(model.packages.premium.price.annual).to.be.a('string');
				expect(model.packages.newspaper.price.annual).to.be.a('string');
			});

			it('Should have the monthly price for each package', function(){
				expect(model.packages.trial.price.monthly).to.be.a('string');
				expect(model.packages.standard.price.monthly).to.be.a('string');
				expect(model.packages.premium.price.monthly).to.be.a('string');
				expect(model.packages.newspaper.price.monthly).to.be.a('string');
			});

			it('Should have the weekly price for each package', function(){
				expect(model.packages.trial.price.weekly).to.be.a('string');
				expect(model.packages.standard.price.weekly).to.be.a('string');
				expect(model.packages.premium.price.weekly).to.be.a('string');
				expect(model.packages.newspaper.price.weekly).to.be.a('string');
			});
		});

		describe('Details', function(){

			it('Should have a title for each package', function(){
				expect(model.packages.trial.details.title).to.be.a('string');
				expect(model.packages.standard.details.title).to.be.a('string');
				expect(model.packages.premium.details.title).to.be.a('string');
				expect(model.packages.newspaper.details.title).to.be.a('string');
			});

			it('Should have a list of items with a description property for each package', function(){
				expect(model.packages.trial.details.items).to.be.an('array');
				expect(model.packages.standard.details.items).to.be.an('array');
				expect(model.packages.premium.details.items).to.be.an('array');
				expect(model.packages.newspaper.details.items).to.be.an('array');

				expect(model.packages.trial.details.items[0].description).to.be.a('string');
				expect(model.packages.standard.details.items[0].description).to.be.a('string');
				expect(model.packages.premium.details.items[0].description).to.be.a('string');
				expect(model.packages.newspaper.details.items[0].description).to.be.a('string');
			});
		});

		describe('Hard-Coded Data', function(){
			var data = hardCodedBarrierData.data;
			var keys = hardCodedBarrierData.keys;

			it('Should add a name for each package', function(){
				expect(model.packages.trial.name).to.equal(data[keys[3]].name);
				expect(model.packages.standard.name).to.equal(data[keys[2]].name);
				expect(model.packages.premium.name).to.equal(data[keys[1]].name);
				expect(model.packages.newspaper.name).to.equal(data[keys[0]].name);
			});

			it('Should add a title for each package', function(){
				expect(model.packages.trial.details.title).to.equal(data[keys[3]].title);
				expect(model.packages.standard.details.title).to.equal(data[keys[2]].title);
				expect(model.packages.premium.details.title).to.equal(data[keys[1]].title);
				expect(model.packages.newspaper.details.title).to.equal(data[keys[0]].title);
			});

			it('Should add items for each package', function(){
				expect(model.packages.trial.details.items).to.equal(data[keys[3]].items);
				expect(model.packages.standard.details.items).to.equal(data[keys[2]].items);
				expect(model.packages.premium.details.items).to.equal(data[keys[1]].items);
				expect(model.packages.newspaper.details.items).to.equal(data[keys[0]].items);
			});

			describe('Other Options', function(){
				it('Should add a corporate link', function(){
					expect(model.otherOptions.corporate.link).to.equal(data[keys[4]].corporate);
				});

				it('Should add a newspaper link', function(){
					expect(model.otherOptions.newspaper.link).to.equal(data[keys[4]].newspaper);
				});

				it('Should add a ePaper link', function(){
					expect(model.otherOptions.ePaper.link).to.equal(data[keys[4]].epaper);
				});

				it('Should add a weekendAppEdition link', function(){
					expect(model.otherOptions.weekendAppEdition.link).to.equal(data[keys[4]].weekendApp);
				});
			});
		});
	});


});
