"use strict";
const availableEditions = [
	{
		id: 'uk',
		name: 'UK'
	},
	{
		id: 'international',
		name: 'International'
	}
];

module.exports = class EditionsModel {

	get available(){
		return availableEditions;
	}

	get ids(){
		return availableEditions.map(e => e.id);
	}

	middleware(req, res, next){
		let currentEdition = req.get('FT-Edition') || 'uk';

		// if query string contains ?edition=..., switch to that edition (and save in a cookie)
		const selectedEdition = req.query.edition;
		if (selectedEdition && this.ids.indexOf(selectedEdition) > -1) {
			currentEdition = selectedEdition;
			// set cookie for a year
			res.cookie('next-edition', currentEdition, { domain: 'ft.com', maxAge: 1000 * 60 * 60 * 24 * 365 });
		}

		res.locals.editions = {
			current: this.available.find(edition => edition.id === currentEdition),
			others: this.available.filter(edition => edition.id !== currentEdition)
		};

		res.vary('FT-Edition');

		next();
	}
};
