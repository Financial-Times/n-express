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
	const varyOn = new Set([]);

	res.set('vary', Array.from(varyOn).join(', '));

	res.vary = function (name) {
		return res.set('vary', name);
	}

	res.set = function (name, val) {

		if (arguments.length === 2 && typeof name === 'string') {
			if (name.toLowerCase() === 'vary') {
				val = extendVary(val, varyOn)
			}
			return resSet.call(res, name, val);
		} else if (typeof name === 'object') {
			Object.keys(name).forEach(key => {
				if (key.toLowerCase() === 'vary') {
					name[key] === extendVary(name[key], varyOn);
				}
			})
			return resSet.call(res, name);
		}
		return resSet.call(res, name, val);
	}

	res.unvary = function () {
		Array.from(arguments).forEach(name => varyOn.delete(name.toLowerCase()))
		const list = Array.from(varyOn);
		if (list.length) {
			res.set('vary', list.join(', '));
		} else {
			res.removeHeader('vary');
		}
	}

	res.unvaryAll = function (preset) {
		if (preset === 'wrapper') {
			res.unVary('ft-anonymous-user', 'ft-edition');
		} else {
			varyOn.clear()
			res.removeHeader('vary');
		}
	}

	// backwards compatible uber-camel-cased names
	res.unVary = res.unvary;
	res.unVaryAll = res.unvaryAll;

	next();
};
