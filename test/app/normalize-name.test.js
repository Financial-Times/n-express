/*global it, describe*/
'use strict';

const normalize = require('../../src/normalize-name');
const assert = require('assert');

describe('normalize', function() {

	it('should normalize ft-next-engels to engels', function() {
		assert.equal(normalize('ft-next-engels'), 'engels');
	});

	it('should normalize next-engels to engels', function() {
		assert.equal(normalize('next-engels'), 'engels');
	});

	it('should normalize engels to engels', function() {
		assert.equal(normalize('engels'), 'engels');
	});

	it('should normalize ft-engels to engels', function() {
		assert.equal(normalize('ft-engels'), 'engels');
	});

	it('should normalize ft-engels-v002 to engels', function() {
		assert.equal(normalize('ft-engels-v002'), 'engels');
	});

});
