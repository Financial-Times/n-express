module.exports = headCssPromise =>
	(req, res, next) => {
		headCssPromise
			.then(headCsses => {
				res.locals.headCsses = headCsses;
				next();
			})
			.catch(err => {
				next(err);
			});
	};
