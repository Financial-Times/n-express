"use strict";
const sinon = require('sinon');


let data = {};

const stubInstance = {

	start: sinon.stub().returns(Promise.resolve(null)),

	getData: () => data

};

const stub = sinon.stub().returns(stubInstance);

module.exports = {
	stub,
	instance: stubInstance,
	setup: d => data = d
};
