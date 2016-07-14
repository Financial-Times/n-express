'use strict';
const expect = require('chai').expect;
const sinon = require('sinon');
const proxyquire = require('proxyquire').noCallThru().noPreserveCache();
const pollerStub = require('../stubs/poller.stub');
const navigationListDataStub = require('../stubs/navigationListData.json');

describe('Navigation Model', () => {

	let NavigationModel;
	let exectedLists = ['drawer', 'footer', 'navbar_desktop', 'navbar_mobile'];

	function findItem(id, data, listName){
		if(listName === 'footer'){
			return null;
		}

		if(listName === 'drawer'){
			for(let section of data){
				for(let item of section){
					if(item.item && item.item.id && item.item.id === id){
						return item;
					}
				}
			}
		}else{
			for(let item of data){
				if(item.id === id){
					return item;
				}
			}
		}
	}

	before(() => {
		NavigationModel = proxyquire('../../src/navigation/navigationModel', {'ft-poller': pollerStub.stub});
	});

	it('Should setup a poller to get the lists data', () => {
		const expectedUrl = `http://next-navigation.ft.com/v1/lists`;
		new NavigationModel();
		sinon.assert.called(pollerStub.stub);
		let options = pollerStub.stub.lastCall.args[0];
		expect(options.url).to.equal(expectedUrl);
	});

	it('Should return a promise for the initial request when init is called', () => {
		let model = new NavigationModel();
		let result = model.init();
		expect(result).to.be.an.instanceOf(Promise);
	});

	it('Should expose the required navigation lists', () => {

		pollerStub.setup(navigationListDataStub);
		let model = new NavigationModel();
		return model.init()
			.then(() => {
				for(let list of exectedLists){
					expect(model.list(list)).to.exist;
				}
			})
	});

	it('Should expose middleware which returns a navigation list with the correct link marked as selected', () => {
		let worldSectionId = 'MQ==-U2VjdGlvbnM=';
		let res = {locals: {editions:{current:{id:'uk'}}}};
		let req = {path: `/stream/sectionsId/${worldSectionId}`, get: () => 'uk'};
		let next = sinon.spy();
		pollerStub.setup(navigationListDataStub);

		let model = new NavigationModel();
		return model.init().then(() => {
			model.middleware(req, res, next);
			expect(res.locals.navigation).to.exist;
			expect(res.locals.navigation.lists).to.exist;
			for(let list of exectedLists){
				expect(res.locals.navigation.lists[list]).to.exist;
				let item = findItem(worldSectionId, res.locals.navigation.lists[list], list);
				if(list === 'drawer' || list === 'navbar_desktop'){
					expect((item.item || item).selected).to.be.true;
				}
			}

			sinon.assert.called(next);
		})
	});

	describe('Hierarchy', () => {

		it('Should instantiate the heirarchy mixin if withNavigationHierarchy:true', () => {
			let model = new NavigationModel({withNavigationHierarchy:true});
			expect(model.hierarchy).to.exist;
		});

		it('Should add hierarchy properties to res.locals.navigation', () => {
			let ukSectionUd = 'Ng==-U2VjdGlvbnM=';
			let expectedChildren = [
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

			let expectedAncestors = [
				{

					"name": "World",
					"id": "MQ==-U2VjdGlvbnM=",
					"href": "/world"
				}
			];

			let res = {locals: {editions:{current:{id:'uk'}}}};
			let req = {path: `/stream/sectionsId/${ukSectionUd}`, get: () => 'uk'};
			let next = sinon.spy();
			pollerStub.setup(navigationListDataStub);

			let model = new NavigationModel({withNavigationHierarchy:true});
			return model.init().then(() => {
				model.middleware(req, res, next);
				expect(res.locals.navigation.currentItem).to.exist;
				expect(res.locals.navigation.currentItem.id).to.equal(ukSectionUd);
				expect(res.locals.navigation.ancestors).to.deep.equal(expectedAncestors);
				expect(res.locals.navigation.children).to.deep.equal(expectedChildren);

				sinon.assert.called(next);
			})
		});
	})

});
