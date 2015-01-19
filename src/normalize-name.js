"use strict";

module.exports = function(name) {
	var matches = name.match(/^(?:ft-)?(?:next-)?(.*?)(?:-v[0-9]{3,})?$/);
	if (matches) {
		return matches[1];
	}
	return name;
};
