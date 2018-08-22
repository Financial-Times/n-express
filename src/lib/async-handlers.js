exports.asyncHandler = fn => {
	if (fn.length === 4) {
		return (err, req, res, next) => {
			const result = fn(err, req, res, next);
			if (!result.headersSent && result instanceof Promise) {
				result.catch(next);
			}
		};
	} else if (fn.length < 4) {
		return (req, res, next) => {
			const result = fn(req, res, next);
			if (!result.headersSent && result instanceof Promise) {
				result.catch(next);
			}
		};
	}

};

exports.asyncParamHandler = fn => (req, res, next, id, name) => {
		const result = fn(req, res, next, id, name);
		if (!result.headersSent && result instanceof Promise) {
			result.catch(next);
		}
};
