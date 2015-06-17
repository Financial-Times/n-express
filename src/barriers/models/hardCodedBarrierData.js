'use strict';

var TRIAL_OFFER = "TRIAL_OFFER";
var STANDARD_OFFER = "STANDARD_OFFER";
var PREMIUM_OFFER = "PREMIUM_OFFER";
var NEWSPAPER_OFFER = "NEWSPAPER_OFFER";

var data = {
	"TRIAL_OFFER" : {
		name : 'ONLINE TRIAL',
		title : '',
		items : [
			{description : "For 4 weeks receive unlimited digital access the FT's trusted, award-winning business news"},
			{description: "* Terms and conditions apply"},
			{description: "<a href=\"#\">Learn more</a>"}
		]
	},
	"STANDARD_OFFER" : {
		name : 'STANDARD DIGITAL',
		title : '',
		items : [
			{description : 'Unlimited access to all FT.com articles and blogs on desktop, mobile and tablet access'},
			{description : 'Personalised email briefings by industry, columnist or sector'},
			{description : 'Portfolio tools to help you manage your investments'},
			{description : 'Fast FT - market-moving news and views, 24 hours a day'}
		]
	},
	"PREMIUM_OFFER" : {
		name : 'PREMIUM DIGITAL',
		title : 'All the benefits of a standard digital subscription plus:',
		items : [
			{description : 'ePaper - the digitalreplica of the printed newspaper'},
			{description : 'Full access to Lex - our agenda setting daily commentary'},
			{description : 'Exclusive emails, including a weekly correspondence from our editor, Lionel Barber'},
			{description : 'Full access to EM Squared - data-driven news and analysis service on emerging markets'}
		]
	},
	"NEWSPAPER_OFFER" : {
		name : 'NEWSPAPER + PREMIUM DIGITAL',
		title : 'All the benefits of a Premium Digital Subscription, plus:',
		items : [
			{description : 'Free delivery to your home or office, Monday to Saturday'},
			{description : 'FT Weekend - a stimulating blend of news and lifestyle'}
		]
	}
};

function hydrate(packageModel, data){
	packageModel.name = data.name;
	packageModel.details.title = data.title;
	packageModel.details.items = data.items;
}

module.exports = function(model){
	hydrate(model.packages.trial, data[TRIAL_OFFER]);
	hydrate(model.packages.standard, data[STANDARD_OFFER]);
	hydrate(model.packages.premium, data[PREMIUM_OFFER]);
	hydrate(model.packages.newspaper, data[NEWSPAPER_OFFER]);
	return model;
};

module.exports.data = data;
module.exports.keys = [
	NEWSPAPER_OFFER,
	PREMIUM_OFFER,
	STANDARD_OFFER,
	TRIAL_OFFER
];
