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

	describe('link decoration', () => {
		let instance;
		let result;


		beforeEach(() => {
			pollerStub.setup(navigationListDataStub);
			instance = new NavigationModel();
			result = instance.init();
			return result;
		});

		it('returns a promise for the initial request when init is called', () => {
			expect(result).to.be.an.instanceOf(Promise);
		});

		it('exposes the required navigation lists', () => {
			for (const list of exectedLists) {
				expect(instance.list(list)).to.exist;
			}
		});

		it('exposes middleware which returns a navigation list with the correct link marked as selected', () => {
			const worldSectionId = 'MQ==-U2VjdGlvbnM=';
			const res = { locals: { editions: { current: { id: 'uk' } } } };
			const req = { path: `/stream/sectionsId/${worldSectionId}`, get: () => 'uk' };
			const next = sinon.spy();

			instance.middleware(req, res, next);

			expect(res.locals.navigation).to.exist;
			expect(res.locals.navigation.lists).to.exist;

			for (const list of exectedLists){
				expect(res.locals.navigation.lists[list]).to.exist;

				const item = findItem(worldSectionId, res.locals.navigation.lists[list], list);

				if (list === 'drawer' || list === 'navbar_desktop') {
					expect((item.item || item).selected).to.be.true;
				}
			}

			sinon.assert.called(next);
		});

		it('replaces any currentPath placeholders with the current path', () => {
			const res = { locals: { editions: { current: { id: 'uk' } } } };
			const req = { path: '/foobar', get: () => 'uk' };
			const next = sinon.spy();

			instance.middleware(req, res, next);

			const login1 = res.locals.navigation.lists['navbar_right'].anon[0];
			const login2 = res.locals.navigation.lists['account'].signin;

			expect(login1.href).to.not.match(/\$\{\w+\}/);
			expect(login2.href).to.not.match(/\$\{\w+\}/);

			expect(login1.href).to.include('location=%2Ffoobar');
			expect(login2.href).to.include('location=%2Ffoobar');
		});
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
