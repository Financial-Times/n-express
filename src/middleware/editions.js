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
		current: editions.find(edition => edition.id === currentEdition),
		others: editions.filter(edition => edition.id !== currentEdition)
	};
	next();
};

module.exports = editions;
