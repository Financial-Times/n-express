'use strict';

// Note - private/public declarations will automatically be added as appropriate if not specified
const presets = {
	no: {
		'max-age': 0,
		conditions: 'no-cache, no-store, must-revalidate'
	},
	short: {
		'max-age': 600,
		'stale-while-revalidate': 60,
		'stale-if-error': 86400
	},
	hour: {
		'max-age': 3600,
		'stale-while-revalidate': 60,
		'stale-if-error': 86400
	},
	day: {
		'max-age': 86400,
		'stale-while-revalidate': 60,
		'stale-if-error': 86400
	},
	long: {
		'max-age': 86400,
		'stale-while-revalidate': 60,
		'stale-if-error': 259200
	}
}

function headerObjToString(obj) {
	const parts = [];

	// HACK: Use someething smarter than just an if (obj['max-age']) { because in JavaScrypt 0 is *falsey*
	if ('max-age' in obj) {
		parts.push(`max-age=${obj['max-age']}`);
	}

	if (obj['stale-while-revalidate']) {
		parts.push(`stale-while-revalidate=${obj['stale-while-revalidate']}`);
	}

	if (obj['stale-if-error']) {
		parts.push(`stale-if-error=${obj['stale-if-error']}`);
	}

	if (obj.conditions) {
		parts.push(obj.conditions);
	}

	if (obj.private === true) {
		parts.push(`private`);
	} else if (obj.public === true) {
		parts.push(`public`);
	}

	return parts.join(', ');
}

const presetStrings = Object.keys(presets).reduce((obj, key) => {
	obj[key] = privatize(headerObjToString(presets[key]));
	return obj;
}, {});

const outboundCacheControl = headerObjToString(presets.no)

const presetNames = Object.keys(presets).join('\n');

function isHeaderString (str) {
	//TODO consider being stricter here
	return typeof str === 'string' && !/^[a-z]+$/.test(str);
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
	console.warn(`res.cache is deprecated. Use cache preset constants instead:
	res.FT_NO_CACHE = 'max-age=0, no-cache, no-store, must-revalidate';
	res.FT_SHORT_CACHE = 'max-age=600, stale-while-revalidate=60, stale-if-error=86400';
	res.FT_HOUR_CACHE = 'max-age=3600, stale-while-revalidate=60, stale-if-error=86400';
	res.FT_DAY_CACHE = 'max-age=86400, stale-while-revalidate=60, stale-if-error=86400';
	res.FT_WEEK_CACHE = 'max-age=604800, stale-while-revalidate=60, stale-if-error=259200';
	res.FT_LONG_CACHE = 'max-age=86400, stale-while-revalidate=60, stale-if-error=259200';

	e.g. res.set('Surrogate-Control', res.FT_HOUR_CACHE).set('Cache-Control', res.FT_NO_CACHE)
`)
	// allow total flexibility, while still enforcing a few conditions
	if (isHeaderString(preset)) {
		return setCacheHeaders(this.set, preset, overrides || outboundCacheControl);
	}
	// console.log(preset, overrides)
	let headerVal = presetStrings[preset];
	let outbound = outboundCacheControl;
	if (!headerVal) {
		throw `Invalid cache-control preset. Choose from: \n${presetNames}`;
	}

	if (overrides) {
		headerVal = headerObjToString(Object.assign({}, presets[preset], overrides));
		if (overrides.public) {
			outbound = publicize(outbound);
		} else {
			headerVal = privatize(headerVal);
		}
	}
	return setCacheHeaders(this.set, headerVal, outbound);
}

module.exports = function(req, res, next) {

	res.cache = nextCache;

	res.FT_NO_CACHE = 'max-age=0, no-cache, no-store, must-revalidate';
	res.FT_SHORT_CACHE = 'max-age=600, stale-while-revalidate=60, stale-if-error=86400';
	res.FT_HOUR_CACHE = 'max-age=3600, stale-while-revalidate=60, stale-if-error=86400';
	res.FT_DAY_CACHE = 'max-age=86400, stale-while-revalidate=60, stale-if-error=86400';
	res.FT_WEEK_CACHE = 'max-age=604800, stale-while-revalidate=60, stale-if-error=259200';
	res.FT_LONG_CACHE = 'max-age=86400, stale-while-revalidate=60, stale-if-error=259200';


	next();
};

module.exports.middleware = function (preset, overrides) {
	return function (req, res, next) {
		res.cache(preset, overrides);
		next();
	}
}
