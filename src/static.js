"use strict";

var express = require('express');
express.static(directory + '/public', express.static({
	setHeaders: setHeaders
});
function setHeaders(res) {
	res.setHeaders('Cache-Control', 'max-age=120, public, stale-while-revalidate=259200, stale-if-error=259200');
}
