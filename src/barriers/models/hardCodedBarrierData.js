'use strict';

var TRIAL_OFFER = "TRIAL_OFFER";
var STANDARD_OFFER = "STANDARD_OFFER";
var PREMIUM_OFFER = "PREMIUM_OFFER";
var NEWSPAPER_OFFER = "NEWSPAPER_OFFER";
var OTHER_OPTIONS = "OTHER_OPTIONS";

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
	},
	"OTHER_OPTIONS" : {
		corporate : 'http://ftcorporate.ft.com/',
		newspaper : 'https://www.ftnewspaper.com/map2',
		epaper : 'http://ftepaper.ft.com/',
		weekendApp : 'https://sub.ft.com/ukweb/?ftcamp=subs/sem/print_weekend_sub/ppc/search/acquisition&utm_source=ppc&utm_medium=sem&utm_term=print_weekend_sub&utm_campaign=search&utm_uk=WSMABD&gclid=CMShtfX1mMYCFWbKtAodGBEA6Q'
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
	model.otherOptions.corporate.link = data[OTHER_OPTIONS].corporate;
	model.otherOptions.newspaper.link = data[OTHER_OPTIONS].newspaper;
	model.otherOptions.ePaper.link = data[OTHER_OPTIONS].epaper;
	model.otherOptions.weekendAppEdition.link = data[OTHER_OPTIONS].weekendApp;
	return model;
};

module.exports.data = data;
module.exports.keys = [
	NEWSPAPER_OFFER,
	PREMIUM_OFFER,
	STANDARD_OFFER,
	TRIAL_OFFER,
	OTHER_OPTIONS
];
