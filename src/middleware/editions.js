const editions = (req, res, next) => {
	const editions = [
		{
			id: 'uk',
			name: 'UK'
		},
		{
			id: 'international',
			name: 'International'
		}
	];
	const currentEdition = req.get('X-FT-Edition') || 'uk';
	res.locals.editions = {
		current: editions.find(({ id }) => id === currentEdition),
		others: editions.filter(({ id }) => id !== currentEdition)
	};
	next();
};

module.exports = editions;
