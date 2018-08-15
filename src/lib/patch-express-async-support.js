const Layer = require('express/lib/router/layer');
const Router = require('express/lib/router');
const originalParam = Router.param;

exports.init = () => {
	Layer.prototype.__defineGetter__('handle', function () {
		return this.__handle;
	});
	Layer.prototype.__defineSetter__('handle', function (fn) {
		this.__handle = wrap(fn);
	});
	Router.param = param;
};

function param (...args) {
	const processedArgs = args.map(arg => {
		if (typeof arg !== 'function') return arg;
		return function (req, res, next, id, name) {
			const result = arg(req, res, next, id, name);
			if (result && result.catch) result.catch(next);
		};
	});
	originalParam.apply(this, processedArgs);
}

function wrap (fn) {

	if (fn.length === 4) {
		return function (err, req, res, next) {
			const result = fn(err, req, res, next);
			if (result && result.catch) result.catch(next);
		};
	} else if (fn.length < 4) {
		return function (req, res, next) {
			const result = fn(req, res, next);
			if (result && result.catch) result.catch(next);
		};
	}

	return fn;
}
