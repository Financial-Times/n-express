'use strict';


class StatusHealth {
	constructor (status, severity, threshold) {

	}
}


module.exports = (status, severity, threshold) => {
	return new StatusHealth(status, severity, threshold)
}
