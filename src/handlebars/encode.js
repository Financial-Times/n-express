'use strict';

module.exports = function (str, opts) {

	// nice to add hml encoding eventually, but non-trivial to do (most js solutions online are either
	// obviously incomplete or depend on the DOM. Will add when we need {{{}}} takes care of most (?all) needs)
	// if (opts.mode === 'html') {
	//     return str.replace()
	// } else
	if (opts.hash.mode === 'uriComponent') {
		return encodeURIComponent(str);
	} else if (opts.hash.mode === 'uri') {
		return encodeURI(str);
	} else {
		return encodeURIComponent(str);
	}
};
