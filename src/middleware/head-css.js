module.exports = headCssPromise =>
	(req, res, next) => {
		headCssPromise
			.then(headCsses => {
				// turn the array of arrays into an object, key the filename, value the data
				res.locals.headCsses = headCsses.reduce((currentHeadCsses, currentHeadCss) => {
					currentHeadCsses[currentHeadCss[0]] = currentHeadCss[1];
					return currentHeadCsses;
				}, {});
				next();
			})
			.catch(err => {
				next(err);
			});
	};
