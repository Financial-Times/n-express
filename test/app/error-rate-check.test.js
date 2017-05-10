const proxyquire = require('proxyquire');
const sinon = require('sinon');
const chai = require('chai');
const expect = chai.expect;

const nHealthStub = {
	runCheck: sinon.stub()
};

const subject = proxyquire('../../src/lib/error-rate-check', {
	'n-health': nHealthStub
});

describe('Default error rate check', () => {
	it('should compose correct graphite metric', () => {
		const expectedMetric = 'divideSeries(sumSeries(next.heroku.foobar.web_*_*.express.default_route_GET.res.status.500.count),sumSeries(next.heroku.foobar.web_*_*.express.default_route_GET.res.status.*.count))';
		subject('foobar');
		expect(nHealthStub.runCheck.calledWithMatch({ metric: expectedMetric })).to.be.true;
	});
});
