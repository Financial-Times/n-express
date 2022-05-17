/*global it, global, describe, before, after*/
const expect = require('chai').expect;


let app;

describe('useNodeFetch tests', function () {
	before(() => {
		app = require('../../main.js');
	});

	it('It use by default isomorfic fetch ',function (){
		expect(global.fetch).to.not.be.undefined;
		expect(global.fetch).to.not.be.null;
		expect(global.fetch.isNodeFecth).to.be.undefined;

	});

	it('set node fetch as fetch object ',function (){
		const old_fetch = global.fetch;
		app.useNodeFetch();
		expect(global.fetch).to.not.be.undefined;
		expect(global.fetch).to.not.be.null;
		expect(global.fetch.isNodeFetch).to.equal(true);
		expect(global.fetch).not.equal(old_fetch);
	});


	after(() => {
		app.useNodeFetch(false);
	});
});
