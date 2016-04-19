'use strict';

const presets = {
	privateNoCache: 'private, no-cache, max-age=0',

}


'max-age=60, public, stale-if-error=86400'
'no-cache, no-store, must-revalidate, max-age=0'
'private, no-cache, max-age=0'
'private, no-cache, no-store, must-revalidate, max-age=0'




const presetNames = Object.keys(presets).join('\n');

module.exports = function(req, res, next) {
	const originalSet = res.set;
	res.cache = function (preset) {
		const val = presets[preset];

		if (!val) {
			throw `Invalid cache-control preset. Choose from: \n${presetNames}`
		}
		return res.set('Surrogate-Control', val);
	}

	next();
};
