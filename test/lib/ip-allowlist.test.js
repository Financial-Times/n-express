const sinon = require('sinon');
const chai = require('chai');
const sinonChai = require('sinon-chai');
const expect = chai.expect;
chai.use(sinonChai);
const proxyquire = require('proxyquire');
const fetchMock = require('fetch-mock');

const info = sinon.stub();
const error = sinon.stub();

const IpAllowlist = proxyquire('../../src/lib/ip-allowlist', {
	'@financial-times/n-logger': { default: { info: info, error: error } }
});

const ALLOWLISTED_FASTLY_IP_ADDRESS = '104.156.80.5';
const ALLOWLISTED_FASTLY_IPV6_ADDRESS = '::ffff:104.156.80.5';
//const ALLOWLISTED_FT_IP_ADDRESS = '';

describe('IP allowlist', () => {

	afterEach(() => {
		fetchMock.restore();
		info.reset();
		error.reset();
	});

	it('fetches allowlist', (done) => {
		fetchMock.get('https://api.fastly.com/public-ip-list', { addresses: ['123.456.789.0/20'] });
		new IpAllowlist();
		setTimeout(() => {
			expect(info).to.have.been.calledWith({ event: 'IP_ALLOWLIST_UPDATE', oldSize: 0, newSize: 1 });
			done();
		}, 0);
	});

	it('fails to fetch allowlist', (done) => {
		fetchMock.get('https://api.fastly.com/public-ip-list', 404);
		new IpAllowlist();
		setTimeout(() => {
			expect(error).to.have.been.calledWith({ event: 'IP_ALLOWLIST_FETCH_FAIL' }, sinon.match.object);
			done();
		}, 0);
	});

	it('fetches an unrecognised response', (done) => {
		fetchMock.get('https://api.fastly.com/public-ip-list', {});
		new IpAllowlist();
		setTimeout(() => {
			expect(error).to.have.been.calledWith({ event: 'IP_ALLOWLIST_UNRECOGNISED', response: '{}' });
			done();
		}, 0);
	});

	it('denies non-allowlisted IP address', (done) => {
		fetchMock.get('https://api.fastly.com/public-ip-list', { addresses: ['123.456.789.0/20'] });
		const ipAllowlist = new IpAllowlist();
		setTimeout(() => {
			expect(ipAllowlist.validate('123.456.333.1')).to.equal(false);
			done();
		}, 0);
	});

	it('denies non-allowlisted IP address using backup list', (done) => {
		fetchMock.get('https://api.fastly.com/public-ip-list', 404);
		const ipAllowlist = new IpAllowlist();
		setTimeout(() => {
			expect(ipAllowlist.validate('123.456.333.1')).to.equal(false);
			done();
		}, 0);
	});

	it('allows allowlisted IP address', (done) => {
		fetchMock.get('https://api.fastly.com/public-ip-list', { addresses: ['123.456.789.0/20'] });
		const ipAllowlist = new IpAllowlist();
		setTimeout(() => {
			expect(ipAllowlist.validate('123.456.789.1')).to.equal(true);
			done();
		}, 0);
	});

	it('allows allowlisted Fastly IP address from backup list', (done) => {
		fetchMock.get('https://api.fastly.com/public-ip-list', 404);
		const ipAllowlist = new IpAllowlist();
		setTimeout(() => {
			expect(ipAllowlist.validate(ALLOWLISTED_FASTLY_IP_ADDRESS)).to.equal(true);
			done();
		}, 0);
	});

	it('allows allowlisted Fastly IPv6 address from backup list', (done) => {
		fetchMock.get('https://api.fastly.com/public-ip-list', 404);
		const ipAllowlist = new IpAllowlist();
		setTimeout(() => {
			expect(ipAllowlist.validate(ALLOWLISTED_FASTLY_IPV6_ADDRESS)).to.equal(true);
			done();
		}, 0);
	});

/*
	it('allows allowlisted FT IP address from backup list', (done) => {
		fetchMock.get('https://api.fastly.com/public-ip-list', 404);
		const ipAllowlist = new IpAllowlist();
		setTimeout(() => {
			expect(ipAllowlist.validate(ALLOWLISTED_FT_IP_ADDRESS)).to.equal(true);
			done();
		}, 0);
	});
*/

});
