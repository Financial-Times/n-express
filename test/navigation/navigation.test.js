'use strict';
const expect = require('chai').expect;
const sinon = require('sinon');
const proxyquire = require('proxyquire').noCallThru().noPreserveCache();
const pollerStub = require('../stubs/poller.stub');
const navigationListDataStub = require('../stubs/navigationListData.json');

describe.only('Navigation Model', () => {

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

	it.only('Should expose middleware which returns a navigation list with the correct link marked as selected', () => {
		let worldSectionId = 'MQ==-U2VjdGlvbnM=';
		let res = {locals: {}};
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

});
