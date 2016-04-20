'use strict';

// Note - private/public declarations will automatically be added as appropriate if not specified
const presets = {
	no: {
		maxAge: 0,
		conditions: 'no-cache, no-store, must-revalidate'
	},
	short: {
		maxAge: 600,
		staleWhileRevalidate: 60,
		staleIfError: 86400
	},
	hour: {
		maxAge: 3600,
		staleWhileRevalidate: 60,
		staleIfError: 86400
	},
	day: {
		maxAge: 86400,
		staleWhileRevalidate: 60,
		staleIfError: 86400
	},
	long: {
		maxAge: 86400,
		staleWhileRevalidate: 60,
		staleIfError: 259200
	}
}

function headerObjToString(obj) {
	const parts = [];
	if (obj.maxAge) {
		parts.push(`max-age=${obj.maxAge}`);
	}

	if (obj.staleWhileRevalidate) {
		parts.push(`stale-while-revalidate=${obj.staleWhileRevalidate}`);
	}

	if (obj.staleIfError) {
		parts.push(`stale-if-error=${obj.staleIfError}`);
	}

	if (obj.conditions) {
		parts.push(obj.conditions);
	}

	if (obj.private === true) {
		parts.push(`private`);
	} else if (obj.public === true) {
		parts.push(`public`);
	}

	return parts.join(',');
}

const presetStrings = Object.keys(presets).reduce((obj, key) => {
	obj[key] = privatize(headerObjToString(presets[key]));
}, {});

const presetNames = Object.keys(presets).join('\n');

function isHeaderString (str) {

}

function privatize(str) {
	if (str.indexOf('private') === -1) {
		str +=', private';
	}
	return str;
}

function publicize(str) {
	if (str.indexOf('public') === -1) {
		str +=', public';
	}
	return str;
}

function setCacheHeaders (setter, surrogate, cache) {
	const headerObj = {
		'Surrogate-Control': surrogate
	};
	if (isHeaderString(cache)) {
		if (cache.indexOf('private') > -1) {
			throw 'Do not use private when setting Cache-Control header - it will prevent fastly from using Surrogate-Control'
		}
		headerObj['Cache-Control'] = cache;
	}

	return setter(headerObj)
}

function nextCache (preset, overrides) {

	// allow total flexibility, while still enforcing a few conditions
	if (isHeaderString(preset)) {
		return setCacheHeaders(this.set, preset, overrides);
	}

	let headerVal = presetStrings[preset];

	if (!headerVal) {
		throw `Invalid cache-control preset. Choose from: \n${presetNames}`;
	}

	if (overrides) {
		headerVal = headerObjToString(Object.assign({}, headerVal, overrides));
	}

	return setCacheHeaders(this.set, headerVal, presets.no);
}

module.exports = function(req, res, next) {

	res.cache = nextCache;

	next();
};
