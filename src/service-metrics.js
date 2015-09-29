'use strict';
var errorsHandler = require('express-errors-handler');
var metrics = require('next-metrics');
var debounce = require('debounce');
var unregisteredServices = {};

var getMessage = function () {
	var message = Object.keys(unregisteredServices).join(', ') + ' services called but no metrics set up. See next-express/src/service-metrics.js';
	unregisteredServices = {};
	return message;
};

var alerter = debounce(function () {
	errorsHandler.captureMessage(getMessage());
}, 5 * 60 * 1000, true);

var serviceMatchers = {
	'capi-v1-article': /^https?:\/\/api\.ft\.com\/content\/items\/v1\/[\w\-]+/,
	'capi-v1-page': /^https?:\/\/api\.ft\.com\/site\/v1\/pages\/[\w\-]+/,
	'capi-v1-pages-list': /^https?:\/\/api\.ft\.com\/site\/v1\/pages/,
	'capi-v1-navigations': /^https?:\/\/api\.ft\.com\/site\/v1\/navigations/,
	'sapi': /^https?:\/\/api\.ft\.com\/content\/search\/v1/,
	'elastic-v1-article': /^https?:\/\/[\w\-]+\.foundcluster\.com(:\d+)?\/v1_api_v2\/item/,
	'elastic-v2-article': /^https?:\/\/[\w\-]+\.foundcluster\.com(:\d+)?\/v2_api_v[12]\/item/,
	'elastic-v1-item-search': /^https?:\/\/[\w\-]+\.foundcluster\.com(:\d+)?\/v1_api_v2\/item\/_search/,
	'elastic-v2-item-search': /^https:\/\/[\w\-]+\.foundcluster\.com(:\d+)?\/v2_api_v2\/item\/_search/,
	'elastic-v1-search': /^https?:\/\/[\w\-]+\.foundcluster\.com(:\d+)?\/v1_api_v2\/_search/,
	'elastic-v2-search': /^https:\/\/[\w\-]+\.foundcluster\.com(:\d+)?\/v2_api_v2\/_search/,
	'ft-next-api-user-prefs-v002': /^https?:\/\/ft-next-api-user-prefs-v002\.herokuapp\.com/,
	'api-feature-flags': /^https?:\/\/(?:ft-next-feature-flags-prod\..*\.amazonaws\.com|next-flags\.ft\.com)/,
	// 'elastic-search':
	'capi-v2-article': /^https?:\/\/api\.ft\.com\/content\/[\w\-]+/,
	'capi-v2-concordances': /^https?:\/\/api\.ft\.com\/concordances\?/,
	'capi-v2-enriched-article': /^https?:\/\/api\.ft\.com\/enrichedcontent\/[\w\-]+/,
	'capi-v2-lists': /^https?:\/\/api\.ft\.com\/lists\/[\w\-]+/,
	'capi-v2-thing': /^https?:\/\/api\.ft\.com\/things\/[\w\-]+/,
	'capi-v2-people': /^https?:\/\/api\.ft\.com\/people\/[\w\-]+/,
	'capi-v2-organisation': /^https?:\/\/api\.ft\.com\/organisations\/[\w\-]+/,
	'capi-v2-content-by-concept': /^https?:\/\/api\.ft\.com\/content\?isAnnotatedBy=http:\/\/api\.ft\.com\/things\/[\w\-]+/,
	// fastft
	'fastft': /https?:\/\/clamo\.ftdata\.co\.uk\/api/,
	// ft.com (temporary for article comment hack)
	'ft-com': /^https?:\/\/www\.ft\.com\/cms\/s\/[\w\-]+\.html$/,
	'ft-next-beacon': /^https?:\/\/next-beacon\.ft\.com\/px\.gif/,
	'ft-next-session-service': /^https?:\/\/session-next\.ft\.com/,
	'ft-next-ab': /^https?:\/\/ft-next-ab\.herokuapp\.com/,
	'ft-next-concepts-api': /^https?:\/\/ft-next-concepts-api\.herokuapp\.com/,
	'ft-next-markets-proxy-api': /^https?:\/\/next-markets-proxy\.ft\.com/,
	'barriers-api': /^https:\/\/subscribe.ft.com\/memb\/barrier/,
	'barriers-api-direct': /^https?:\/\/barrier-app\.memb\.ft\.com\/memb\/barrier/,
	'brightcove': /^http:\/\/api\.brightcove\.com\/services\/library/,
	'bertha': /^http:\/\/bertha\.ig\.ft\.com/,
	'markets': /^http:\/\/markets\.ft\.com/,
	'fastly': /^https?:\/\/next\.ft\.com/,
	'fastly-api': /^https:\/\/api\.fastly\.com/,
	'ft-next-harrier-eu': /^https:\/\/ft-next-harrier-eu\.herokuapp\.com\//,
	'ft-next-personalised-feed-api': /^https?:\/\/(personalised-feed\.ft\.com|ft-next-personalised-feed-api\.herokuapp\.com)\/v1\/feed/,
	'portfolio': /https?\:\/\/(?:209\.234\.235\.243|portfolio\.ft\.com)/,
	'graphite': /^https:\/\/www\.hostedgraphite\.com\//,
	'ft-next-sharedcount-api': /^https:\/\/ft-next-sharedcount-api\.herokuapp\.com/,
	'next-sapi-capi-slurp': /https?\:\/\/next-slurp\.ft\.com/,
	'spoor-uuid-counter': /https?\:\/\/spoor-uuid-counter\.herokuapp\.com/,
	'spoor-ingest': /https:\/\/spoor-api\.ft\.com\/ingest/,
	'livefyre': /https?\:\/\/ft.bootstrap.fyre.co/,
	'ft-next-myft-api': /https?\:\/\/ft-next-myft-api\.herokuapp\.com/,
	'myft-api': /https:\/\/myft-api\.ft\.com/,
	'ft-next-service-registry': /http\:\/\/next-registry\.ft\.com/,
	'pingdom': /https\:\/\/api\.pingdom\.com/,
	'popular': /http:\/\/mostpopular\.sp\.ft-static.com/,
	'popular-topics': /https:\/\/ft-next-popular-api\.herokuapp\.com/,
	'konstructor': /https:\/\/konstructor\.ft\.com/,
	'video': /http:\/\/next-video\.ft\.com/,
	's3o': /https:\/\/s3o.ft.com/
};

module.exports = {
	init: function (additionalServices) {
		if (additionalServices) {
			Object.keys(additionalServices).forEach(function(serv) {
				if (serv.toLowerCase() !== serv || serv.indexOf('.') > -1) {
					throw new Error("service dependency names should not have full stops in them and should be lowercase");
				}
				serviceMatchers[serv] = additionalServices[serv];
			});
		}
		metrics.fetch.instrument({
			serviceMatchers: serviceMatchers,
			onUninstrumented: function (url, opts) {
				unregisteredServices[url.split('?')[0]] = true;
				alerter();
			}
		});
	},
	services: serviceMatchers
};
