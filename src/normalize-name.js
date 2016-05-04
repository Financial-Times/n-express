'use strict';

module.exports = function(name) {
	const matches = name.match(/^(?:ft-)?(?:next-)?(.*?)(?:-v[0-9]{3,})?$/);
	if (matches) {
		return matches[1];
	}
	return name;
};
