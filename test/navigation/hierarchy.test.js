"use strict";
const expect = require('chai').expect;
const sinon = require('sinon');
const proxyquire = require('proxyquire').noCallThru().noPreserveCache();
const pollerStub = require('../stubs/poller.stub');
const navigationTaxonomyDataStub = require('../stubs/navigationTaxonomyData.json');

describe('Heirarchy Mixin', () => {

	let HierarchyMixin;
	const ukEconomyId = 'MTA5-U2VjdGlvbnM=';
	const ukId = 'Ng==-U2VjdGlvbnM=';

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
				"name": "World",
				"id": "MQ==-U2VjdGlvbnM="
			},
			{
				"name": "UK",
				"id": "Ng==-U2VjdGlvbnM="
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
				"name": "UK Economy",
				"id": "MTA5-U2VjdGlvbnM=",
				"href": "/global-economy/uk"
			},
			{
				"name": "UK Politics & Policy",
				"id": "OA==-U2VjdGlvbnM=",
				"href": "/world/uk/politics"
			},
			{
				"name": "UK Companies",
				"id": "NjM=-U2VjdGlvbnM=",
				"href": "/companies/uk"
			}
		];
		return mixin.init().then(() => {
			let children = mixin.children(ukId);
			expect(children).to.be.an.instanceOf(Array);
			expect(children.length).to.equal(expected.length);
			for(let i=0, l=children.length; i<l; i++){
				expect(children[i].id).to.equal(expected[i].id);
			}
		})
	});

});
