module.exports = headCssPromise =>
	(req, res, next) => {
		headCssPromise
			.then(headCsses => {
				res.locals.headCss = headCsses.reduce((headCss, currentHeadCss) => {
					headCss[currentHeadCss[0]] = currentHeadCss[1];
					return headCss;
				}, {});
				next();
			})
			.catch(err => {
				next(err);
			});
	};
