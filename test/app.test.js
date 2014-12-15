var request = require('supertest');
var app = require('./fixtures/app/main');

describe('simple app', function() {

	it('should have its own route', function(done) {
		request(app)
			.get('/')
			.expect('Vary', 'X-Flags')
			.expect(200, 'Hello world', done);
	});

	it('should have a robots.txt', function(done) {
		request(app)
			.get('/robots.txt')
			.expect(200, done);
	});

	it('should have a static resource', function(done) {
		request(app)
			.get('/demo-app/test.txt')
			.expect(200, 'Static file\n', done);
	});

	it('should do something templating', function(done) {
		request(app)
			.get('/templated')
			.expect(200, /FT/, done);
	});

	it('should do integrate with the image service', function(done) {
		request(app)
			.get('/templated')
			.expect(200, /\/\/image.webservices.ft.com\/v1\/images\/raw\//, done);
	});

	it('should do support loading partials via bower', function(done) {
		request(app)
			.get('/templated')
			.expect(200, /End of dep 2 partial/, done);
	});

	it('should support app-specific helpers', function(done) {
		request(app)
			.get('/templated')
			.expect(200, /HELLO/, done);
	});

	it('should expose app name to views', function(done) {
		request(app)
			.get('/templated')
			.expect(200, /on app demo-app!/, done);
	});

	it('should provide a nice date helper', function(done) {
		request(app)
			.get('/templated')
			.expect(200, /Full date: Friday, 1 August, 2014/, done);
	});

	it('should provide a nice date helper that lets you easily output the date in an o-date compatible format', function(done) {
		request(app)
			.get('/templated')
			.expect(200, /ISO date: 2014-08-01T01:00:00\+0100/, done);
	});
});
