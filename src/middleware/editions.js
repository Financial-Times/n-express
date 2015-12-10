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
	res.locals.editions = editions.map(edition => {
		edition.isCurrent = edition.id === currentEdition;
		return edition;
	});
	next();
};

module.exports = editions;
