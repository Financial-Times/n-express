const nExpress = require('../../main');
const {expect} = require('chai');
const supertest = require('supertest');
const {asyncHandler, asyncParamHandler} = nExpress;

	describe('patch-express-async-support.js', () => {

	describe('route handlers', () => {
		let request;
		before(() => {
			const app = nExpress({systemCode: 'async-patch-test'});
			app.get('/hello', asyncHandler((req, res) => res.sendStatus(200)));
			app.get('/hello/async', asyncHandler(async (req, res) => res.sendStatus(200)));
			app.get('/error', asyncHandler(() => {throw new Error('foo');}));
			app.get('/error/async', asyncHandler(async () => {throw new Error('foo');}));
			app.use((err, req, res, next) => res.status(500).send(err.message)); // eslint-disable-line no-unused-vars
			app.listen();
			request = supertest(app);
		});

		it('should still allow synchronous handlers to execute successfully', done => {
			request.get('/hello')
				.expect(200)
				.end(done);
		});

		it('should allow asynchronous handlers to execute successfully', done => {
			request.get('/hello/async')
				.expect(200)
				.end(done);
		});

		it('should still catch errors in synchronous handlers', done => {
			request.get('/error')
				.expect(500)
				.end((err, res) => {
					expect(res.text).to.equal('foo');
					done();
				});
		});

		it('should catch errors in asynchronous handlers', done => {
			request.get('/error')
				.expect(500)
				.end((err, res) => {
					expect(res.text).to.equal('foo');
					done();
				});
		});
	});

	describe('middleware', () => {
		let request;
		before(() => {
			const app = nExpress({systemCode: 'async-patch-test'});
			const routeHandler = (req, res) => res.sendStatus(200);
			app.get('/hello', asyncHandler((req, res, next) => next()), routeHandler);
			app.get('/hello/async', asyncHandler(async (req, res, next) => next()), routeHandler);
			app.get('/error', asyncHandler((req, res, next) => {throw new Error('foo');}), routeHandler); // eslint-disable-line no-unused-vars
			app.get('/error/async', asyncHandler(async (req, res, next) => {throw new Error('foo');}), routeHandler); // eslint-disable-line no-unused-vars
			app.use((err, req, res, next) => res.status(500).send(err.message)); // eslint-disable-line no-unused-vars
			app.listen();
			request = supertest(app);
		});

		it('should still allow synchronous middleware to execute successfully', done => {
			request.get('/hello')
				.expect(200)
				.end(done);
		});

		it('should allow asynchronous middleware to execute successfully', done => {
			request.get('/hello/async')
				.expect(200)
				.end(done);
		});

		it('should still catch errors in synchronous middleware', done => {
			request.get('/error')
				.expect(500)
				.end((err, res) => {
					expect(res.text).to.equal('foo');
					done();
				});
		});

		it('should catch errors in asynchronous middleware', done => {
			request.get('/error')
				.expect(500)
				.end((err, res) => {
					expect(res.text).to.equal('foo');
					done();
				});
		});
	});

	describe('error handlers', () => {
		let request;
		before(() => {
			const app = nExpress({systemCode: 'async-patch-test'});
			const thrower = () => {throw new Error('bar');};
			app.get('/hello', thrower, asyncHandler((err, req, res, next) => res.sendStatus(400))); // eslint-disable-line no-unused-vars
			app.get('/hello/async', thrower, asyncHandler(async (err, req, res, next) => res.sendStatus(400))); // eslint-disable-line no-unused-vars
			app.get('/error', thrower, asyncHandler((err, req, res, next) => {throw new Error('foo');})); // eslint-disable-line no-unused-vars
			app.get('/error/async', thrower, asyncHandler(async (err, req, res, next) => {throw new Error('foo');})); // eslint-disable-line no-unused-vars
			app.use((err, req, res, next) => res.status(500).send(err.message)); // eslint-disable-line no-unused-vars
			app.listen();
			request = supertest(app);
		});

		it('should still allow synchronous error handlers to execute successfully', done => {
			request.get('/hello')
				.expect(400)
				.end(done);
		});

		it('should allow asynchronous error handlers to execute successfully', done => {
			request.get('/hello/async')
				.expect(400)
				.end(done);
		});

		it('should still catch errors in synchronous error handlers', done => {
			request.get('/error')
				.expect(500)
				.end((err, res) => {
					expect(res.text).to.equal('foo');
					done();
				});
		});

		it('should catch errors in asynchronous error handlers', done => {
			request.get('/error')
				.expect(500)
				.end((err, res) => {
					expect(res.text).to.equal('foo');
					done();
				});
		});
	});

	describe('param handlers', () => {
		let request;
		before(() => {
			const app = nExpress({systemCode: 'async-patch-test'});

			const handler = (req, res) => res.status(200).send(res.locals.id);

			app.param('world', asyncParamHandler((req, res, next, id) => {
				res.locals.id = id;
				next();
			}));
			app.param('asyncWorld', asyncParamHandler(async (req, res, next, id) => {
				res.locals.id = id;
				next();
			}));
			app.param('oops',asyncParamHandler((req, res, next, id) => {throw new Error(id);}));
			app.param('asyncOops', asyncParamHandler(async (req, res, next, id) => {throw new Error(id);}));

			app.get('/hello/:world', handler);
			app.get('/asyncHello/:asyncWorld', handler);
			app.get('/error/:oops', handler);
			app.get('/asyncError/:asyncOops', handler);
			app.use((err, req, res, next) => res.status(500).send(err.message)); // eslint-disable-line no-unused-vars
			app.listen();
			request = supertest(app);
		});

		it('should still allow synchronous error handlers to execute successfully', done => {
			request.get('/hello/london')
				.expect(200)
				.end((err, res) => {
					expect(res.text).to.equal('london');
					done();
				});
		});

		it('should allow asynchronous error handlers to execute successfully', done => {
			request.get('/asyncHello/london')
				.expect(200)
				.end((err, res) => {
					expect(res.text).to.equal('london');
					done();
				});
		});

		it('should still catch errors in synchronous error handlers', done => {
			request.get('/error/booboo')
				.expect(500)
				.end((err, res) => {
					expect(res.text).to.equal('booboo');
					done();
				});
		});

		it('should catch errors in asynchronous error handlers', done => {
			request.get('/asyncError/booboo')
				.expect(500)
				.end((err, res) => {
					expect(res.text).to.equal('booboo');
					done();
				});
		});
	});

});
