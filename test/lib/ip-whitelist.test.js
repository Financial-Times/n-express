const sinon = require('sinon');
const chai = require('chai');
const sinonChai = require('sinon-chai');
const expect = chai.expect;
chai.use(sinonChai);
const proxyquire = require('proxyquire');
const fetchMock = require('fetch-mock');

const info = sinon.stub();
const error = sinon.stub();

const IpWhitelist = proxyquire('../../src/lib/ip-whitelist', {
	'@financial-times/n-logger': { default: { info: info, error: error } }
});

const WHITELISTED_FASTLY_IP_ADDRESS = '104.156.80.5';
const WHITELISTED_FASTLY_IPV6_ADDRESS = '::ffff:104.156.80.5';
//const WHITELISTED_FT_IP_ADDRESS = '';

describe('IP whitelist', () => {

	afterEach(() => {
		fetchMock.restore();
		info.reset();
		error.reset();
	});

	it('fetches whitelist', (done) => {
		fetchMock.get('https://api.fastly.com/public-ip-list', { addresses: ['123.456.789.0/20'] });
		new IpWhitelist();
		setTimeout(() => {
			expect(info).to.have.been.calledWith({ event: 'IP_WHITELIST_UPDATE', oldSize: 0, newSize: 1 });
			done();
		}, 0);
	});

	it('fails to fetch whitelist', (done) => {
		fetchMock.get('https://api.fastly.com/public-ip-list', 404);
		new IpWhitelist();
		setTimeout(() => {
			expect(error).to.have.been.calledWith({ event: 'IP_WHITELIST_FETCH_FAIL' }, sinon.match.object);
			done();
		}, 0);
	});

	it('fetches an unrecognised response', (done) => {
		fetchMock.get('https://api.fastly.com/public-ip-list', {});
		new IpWhitelist();
		setTimeout(() => {
			expect(error).to.have.been.calledWith({ event: 'IP_WHITELIST_UNRECOGNISED', response: '{}' });
			done();
		}, 0);
	});

	it('denies non-whitelisted IP address', (done) => {
		fetchMock.get('https://api.fastly.com/public-ip-list', { addresses: ['123.456.789.0/20'] });
		const ipWhitelist = new IpWhitelist();
		setTimeout(() => {
			expect(ipWhitelist.validate('123.456.333.1')).to.equal(false);
			done();
		}, 0);
	});

	it('denies non-whitelisted IP address using backup list', (done) => {
		fetchMock.get('https://api.fastly.com/public-ip-list', 404);
		const ipWhitelist = new IpWhitelist();
		setTimeout(() => {
			expect(ipWhitelist.validate('123.456.333.1')).to.equal(false);
			done();
		}, 0);
	});

	it('allows whitelisted IP address', (done) => {
		fetchMock.get('https://api.fastly.com/public-ip-list', { addresses: ['123.456.789.0/20'] });
		const ipWhitelist = new IpWhitelist();
		setTimeout(() => {
			expect(ipWhitelist.validate('123.456.789.1')).to.equal(true);
			done();
		}, 0);
	});

	it('allows whitelisted Fastly IP address from backup list', (done) => {
		fetchMock.get('https://api.fastly.com/public-ip-list', 404);
		const ipWhitelist = new IpWhitelist();
		setTimeout(() => {
			expect(ipWhitelist.validate(WHITELISTED_FASTLY_IP_ADDRESS)).to.equal(true);
			done();
		}, 0);
	});

	it('allows whitelisted Fastly IPv6 address from backup list', (done) => {
		fetchMock.get('https://api.fastly.com/public-ip-list', 404);
		const ipWhitelist = new IpWhitelist();
		setTimeout(() => {
			expect(ipWhitelist.validate(WHITELISTED_FASTLY_IPV6_ADDRESS)).to.equal(true);
			done();
		}, 0);
	});

/*
	it('allows whitelisted FT IP address from backup list', (done) => {
		fetchMock.get('https://api.fastly.com/public-ip-list', 404);
		const ipWhitelist = new IpWhitelist();
		setTimeout(() => {
			expect(ipWhitelist.validate(WHITELISTED_FT_IP_ADDRESS)).to.equal(true);
			done();
		}, 0);
	});
*/

});
