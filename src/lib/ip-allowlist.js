const logger = require('@financial-times/n-logger').default;
const metrics = require('next-metrics');
const fetchres = require('fetchres');
const ip = require('ip');

const backupFastlyAllowlist = require('./fastly-ip-allowlist-backup.json').addresses;
const ftAllowlist = require('./ft-ip-allowlist.json');

const fastlyAllowlistUrl = 'https://api.fastly.com/public-ip-list';

function IpAllowlist () {
	this.fetchedFastlyAllowlist = null;
	this.poll();
	setInterval(() => this.poll(), 10000); // every 10 seconds
};

IpAllowlist.prototype.poll = function () {
	return fetch(fastlyAllowlistUrl)
		.then(fetchres.json)
		.then(resp => {
			if (Array.isArray(resp.addresses) && resp.addresses.length > 0) {
				metrics.count('express.ip_allowlist.fetch_success');
				if (JSON.stringify(this.fetchedFastlyAllowlist) !== JSON.stringify(resp.addresses)) {
					logger.info({ event: 'IP_ALLOWLIST_UPDATE', oldSize: Array.isArray(this.fetchedFastlyAllowlist) ? this.fetchedFastlyAllowlist.length : 0, newSize: resp.addresses.length });
					metrics.count('express.ip_allowlist.update');
					this.fetchedFastlyAllowlist = resp.addresses;
				}
			} else {
				logger.error({ event: 'IP_ALLOWLIST_UNRECOGNISED', response: JSON.stringify(resp) });
				metrics.count('express.ip_allowlist.unrecognised');
			}
		})
		.catch(err => {
			logger.error({ event: 'IP_ALLOWLIST_FETCH_FAIL' }, err);
			metrics.count('express.ip_allowlist.fetch_fail');
		});
};

IpAllowlist.prototype.validate = function (ipAddress) {
	if (ipAddress.match(/^::ffff:/)) {
		ipAddress = ipAddress.replace(/^::ffff:/, '');
	}
	const ranges = [].concat(this.fetchedFastlyAllowlist || backupFastlyAllowlist, ftAllowlist);
	let i;
	for (i = 0; i < ranges.length; i++) {
		if (ip.cidrSubnet(ranges[i]).contains(ipAddress)) {
			return true;
		}
	}
	return false;
};

module.exports = IpAllowlist;
