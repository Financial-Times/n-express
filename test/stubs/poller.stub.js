'use strict';
const sinon = require('sinon');

let data = {};

const stubInstance = {

	start: sinon.stub().returns(Promise.resolve(null)),

	getData: () => data

};

const failingStubInstance = {
	start: sinon.stub().returns(Promise.reject(null)),
	getData: () => null
};

const stub = sinon.stub().returns(stubInstance);
const failingStub = sinon.stub().returns(failingStubInstance);

module.exports = {
	stub,
	failingStub,
	instance: stubInstance,
	setup: d => data = d
};
