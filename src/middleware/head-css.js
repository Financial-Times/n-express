module.exports = function(headCssPromise) {

	return function(req, res, next) {
		headCssPromise
			.then(function(headCss) {
				res.locals.headCss = headCss;
				next();
			});
	}

};
