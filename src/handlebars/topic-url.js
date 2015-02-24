'use strict';

module.exports = function(id, options) {
	// we treat id as a search string (what we're using as identifiers in v1)
	var parts = id.match(/^(.+)\:"([^"]+)"$/);

	if (parts) {
		parts = parts.slice(1, 3);
		if(['page'].indexOf(parts[0]) === -1) {
			return '/stream/' + parts.join('/');
		} else {
			return '/' + parts.join('/');
		}
	}

	// currently don't understand any other kinds of id e.g. capi2 id... to be fleshed out later
	// just return noop url for now, with something we can track
	return '#" data-tracking="invalid-url';
};
