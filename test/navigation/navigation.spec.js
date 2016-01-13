'use strict';

const request = require('supertest');
const nextExpress = require('../../main');
const expect = require('chai').expect;

describe('Navigation model', () => {
	let app;
	let locals;

	beforeEach(() => {
		app = nextExpress({ withFlags:true, withHandlebars:true });
		app.get('/', (req, res) => {
			locals = res.locals;
			res.sendStatus(200).end();
		});
	});

	it('Should set the myFT property to an object', done => {
		request(app)
			.get('/')
			.set('FT-User-UUID', 'xvdsvdfvdfs')
			.expect(() => {
				expect(locals.navigationModel.myFT).to.be.an('object');
			})
			.end(done);
	});

	it('Should set the myAccount property to an object if user is not anonymous', done => {
		request(app)
			.get('/')
			.set('FT-User-UUID', 'dkvbdfkjvbh')
			.expect(() => {
				expect(locals.navigationModel.myAccount).to.be.an('object');
			})
			.end(done);
	});
});
