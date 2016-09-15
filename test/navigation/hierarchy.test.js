'use strict';
const expect = require('chai').expect;
const sinon = require('sinon');
const proxyquire = require('proxyquire').noCallThru().noPreserveCache();
const pollerStub = require('../stubs/poller.stub');
const navigationTaxonomyDataStub = require('../stubs/navigationTaxonomyData.json');
const fetchMock = require('fetch-mock');

const UK_STREAM_ID = 'Ng==-U2VjdGlvbnM=';


describe('Heirarchy Mixin', () => {

	let HierarchyMixin;
	const ukEconomyId = 'MTA5-U2VjdGlvbnM=';
	const companiesId = 'Mjk=-U2VjdGlvbnM=';
	//const ukId = 'Ng==-U2VjdGlvbnM=';

	before(() => {
		HierarchyMixin = proxyquire('../../src/navigation/hierarchyMixin', {'ft-poller':pollerStub.stub});
	});

	it('Should setup a poller to get taxonomy from the api', () => {
		const expectedUrl = `http://next-navigation.ft.com/v1/taxonomy`;
		new HierarchyMixin();
		sinon.assert.called(pollerStub.stub);
		let options = pollerStub.stub.lastCall.args[0];
		expect(options.url).to.equal(expectedUrl);
	});

	it('Should expose a method to return the ancestors of a given item', () => {
		pollerStub.setup(navigationTaxonomyDataStub);
		let mixin = new HierarchyMixin();
		let expected = [
			{
				'name': 'World',
				'id': 'MQ==-U2VjdGlvbnM='
			},
			{
				'name': 'UK',
				'id': 'Ng==-U2VjdGlvbnM='
			}
		];
		return mixin.init().then(() => {
			let ancestors = mixin.ancestors(ukEconomyId);
			expect(ancestors).to.be.an.instanceOf(Array);
			expect(ancestors.length).to.equal(expected.length);
			for(let i=0, l=ancestors.length; i<l; i++){
				expect(ancestors[i].id).to.equal(expected[i].id);
			}
		})
	});

	it('Should expose a method to get the children of a given item', () => {
		pollerStub.setup(navigationTaxonomyDataStub);
		let mixin = new HierarchyMixin();
		let expected = [
			{
				'name': 'Energy',
				'id': 'MzA=-U2VjdGlvbnM=',
				'href': '/companies/energy',
			},
			{
				'name': 'Financials',
				'id': 'NTc=-U2VjdGlvbnM=',
				'href': '/companies/financials',
			},
			{
				'name': 'Health',
				'id': 'NTA=-U2VjdGlvbnM=',
				'href': '/companies/health',
			},
			{
				'name': 'Industrials',
				'id': 'MzQ=-U2VjdGlvbnM=',
				'href': '/companies/industrials',
			},
			{
				'name': 'Media',
				'id': 'NTU=-U2VjdGlvbnM=',
				'href': '/companies/media'
			},
			{
				'name': 'Retail & Consumer',
				'id': 'NDU=-U2VjdGlvbnM=',
				'href': '/companies/retail-consumer',
			},
			{
				'name': 'Technology',
				'id': 'NTM=-U2VjdGlvbnM=',
				'href': '/companies/technology'
			},
			{
				'name': 'Telecoms',
				'id': 'NTY=-U2VjdGlvbnM=',
				'href': '/companies/telecoms'
			},
			{
				'name': 'Transport',
				'id': 'NDE=-U2VjdGlvbnM=',
				'href': '/companies/transport',
			}
			];
		return mixin.init().then(() => {
			let children = mixin.children(companiesId);
			expect(children).to.be.an.instanceOf(Array);
			expect(children.length).to.equal(expected.length);
			for(let i=0, l=children.length; i<l; i++){
				expect(children[i].id).to.equal(expected[i].id);
			}
		})
	});

	describe('Fallback', () => {

		function apiDownS3Up(){
			fetchMock.restore();
			fetchMock.mock(/next-navigation\.ft\.com/, 500);
			fetchMock.mock(/ft-next-navigation\.s3-website-eu-west-1\.amazonaws\.com/, require('../fixtures/navigationLists.json'), {name:'s3bucket'});
		}

		function apiDownS3Down(){
			fetchMock.restore();
			fetchMock.mock(/next-navigation\.ft\.com/, 500);
			fetchMock.mock(/ft-next-navigation\.s3-website-eu-west-1\.amazonaws\.com/, 500, {name:'s3bucket'});
		}

		before(() => {
			HierarchyMixin = require('../../src/navigation/hierarchyMixin');
		});

		after(() => {
			fetchMock.restore();
		});

		it('Should use the s3 bucket on startup if the navigation api is down', () => {
			apiDownS3Up();
			let mixin = new HierarchyMixin();
			return mixin.init().then(() => {
				expect(fetchMock.called('s3bucket')).to.be.true;
			})
		});

		it('Should return empty results if both requests fail', () => {
			apiDownS3Down();
			let mixin = new HierarchyMixin();
			return mixin.init().then(() => {
				let findResult = mixin.find(UK_STREAM_ID);
				let ancestors = mixin.ancestors(UK_STREAM_ID);
				let children = mixin.children(UK_STREAM_ID);
				expect(findResult).to.deep.equal({item:null,parent:null});
				expect(ancestors).to.be.empty;
				expect(children).to.be.empty;
			});
		});
	});
});
