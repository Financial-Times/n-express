const generateViaMiddleware = require('../../src/middleware/via');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');
const chai = require('chai');
const expect = chai.expect;
chai.use(sinonChai);

describe('via middleware', function () {
	let middleware;
	let request;
	let response;
	let next;

	beforeEach(() => {
		request = {
			get: sinon.stub().withArgs('via').returns(undefined),
			httpVersion: 'mock-http-version'
		};
		response = {
			set: sinon.spy()
		};
		next = sinon.spy();
		middleware = generateViaMiddleware('mock-system');
	});

	describe('when no request Via header is present', () => {
		it('sends a response Via header set to the application system code', () => {
			middleware(request, response, next);
			expect(response.set).calledWithExactly('via', 'mock-http-version mock-system');
			expect(next).calledWithExactly();
		});
	});

	describe('when a request Via header is present', () => {
		it('sends a response Via header appending the application system code', () => {
			request.get.withArgs('via').returns('mock-request-via');
			middleware(request, response, next);
			expect(response.set).calledWithExactly('via', 'mock-request-via, mock-http-version mock-system');
			expect(next).calledWithExactly();
		});
	});

});
