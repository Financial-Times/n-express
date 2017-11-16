/*global it, describe, beforeEach, before, after*/
const subject = require('../../src/middleware/security');
const expect = require('chai').expect;

describe('security middleware', function () {

	it('set security headers', function (done) {
		const headers = {};
		const req = {};
		const res = {
			set: (name, value) => {
				headers[name] = value;
			}
		};

		subject(req, res, () => {
			expect(headers['X-Content-Type-Options']).to.equal('nosniff');
			expect(headers['X-Download-Options']).to.equal('noopen');
			expect(headers['X-XSS-Protection']).to.equal('1; mode=block');
			done();
		});
	});

});
