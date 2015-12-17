'use strict';

function extendVary (val, set) {
	val = Array.isArray(val) ? val : val.split(',');
	val.forEach(header => {
		set.add(header.trim().toLowerCase())
	})
	return Array.from(set).join(', ');
}

module.exports = function(req, res, next) {
	const resSet = res.set;
	const varyOn = new Set(['country-code']);

	res.set('vary', Array.from(varyOn).join(', '));

	res.vary = function (name) {
		return res.set('vary', name);
	}

	res.set = function (name, val) {
		if (val && typeof name === 'string') {
			if (name.toLowerCase() === 'vary') {
				val = extendVary(val, varyOn)
			}
		} else if (typeof name === 'object') {
			Object.keys(name).forEach(key => {
				if (key.toLowerCase() === 'vary') {
					name[key] === extendVary(name[key], varyOn);
				}
			})
		}
		return val ? resSet.call(res, name, val) : resSet.call(res, name)
	}

	res.unVary = function (name) {
		varyOn.delete(name.toLowerCase());
		const list = Array.from(varyOn);
		if (list.length) {
			res.set('vary', list.join(', '));
		} else {
			res.removeHeader('vary');
		}
	}

	res.unVaryAll = function () {
		varyOn.clear()
		res.removeHeader('vary');
	}

	next();
};
