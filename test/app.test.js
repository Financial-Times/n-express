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

});
