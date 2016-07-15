'use strict';
const expect = require('chai').expect;
const sinon = require('sinon');
const proxyquire = require('proxyquire').noCallThru().noPreserveCache();
const pollerStub = require('../stubs/poller.stub');
const decorateSpy = sinon.spy(data => data);
const navigationListDataStub = require('../stubs/navigationListData.json');

describe('Navigation middleware', () => {
	let NavigationModel;

	beforeEach(() => {
		NavigationModel = proxyquire('../../src/navigation/navigationModel', {
			'ft-poller': pollerStub.stub,
			'./decorate': decorateSpy
		});
	});

	afterEach(() => {
		pollerStub.stub.reset();
		decorateSpy.reset();
	});

	describe('data polling', () => {
		it('Should setup a poller to get the lists data', () => {
			const url = `http://next-navigation.ft.com/v1/lists`;
			new NavigationModel();
			sinon.assert.called(pollerStub.stub);
			sinon.assert.calledWith(pollerStub.stub, sinon.match({ url }));
		});
	});

	describe('internals', () => {
		const SECTION_ID = 'MQ==-U2VjdGlvbnM=';

		let instance;
		let result;
		let res;
		let req;
		let next;

		beforeEach(() => {
			res = { locals: { editions: { current: { id: 'uk' } } } };
			req = { url: `/stream/sectionsId/${SECTION_ID}` };
			next = sinon.stub();

			req.get = sinon.stub();

			req.get.withArgs('FT-Edition').returns('uk');
			req.get.withArgs('FT-Vanity-Url').returns(null);
			req.get.withArgs('ft-blocked-url').returns(null);

			pollerStub.setup(navigationListDataStub);

			instance = new NavigationModel();
			result = instance.init();

			return result;
		});

		it('returns a promise for the initial request when init is called', () => {
			expect(result).to.be.an.instanceOf(Promise);
			expect(result.then).to.be.a('function');
		});

		it('exposes the required navigation lists', () => {
			['drawer', 'footer', 'navbar_desktop', 'navbar_mobile'].forEach(list => {
				expect(instance.list(list)).to.exist;
			});
		});

		it('exposes middleware which returns a navigation list', () => {
			instance.middleware(req, res, next);

			expect(res.locals.navigation).to.exist;
			expect(res.locals.navigation.lists).to.exist;
			expect(res.locals.navigation.lists).to.be.an('object');

			sinon.assert.called(next);
		});

		it('recognises vanity URLs', () => {
			req.get.withArgs('FT-Vanity-Url').returns('/vanity');
			instance.middleware(req, res, next);
			sinon.assert.calledWith(decorateSpy, sinon.match.any, sinon.match.string, sinon.match('/vanity'));
		});

		it('recognises blocked URLs', () => {
			req.get.withArgs('ft-blocked-url').returns('/blocked');
			instance.middleware(req, res, next);
			sinon.assert.calledWith(decorateSpy, sinon.match.any, sinon.match.string, sinon.match('/blocked'));
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
