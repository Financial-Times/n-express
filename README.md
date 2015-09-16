next-express [![Build Status](https://travis-ci.org/Financial-Times/next-express.svg?branch=master)](https://travis-ci.org/Financial-Times/next-express)
============

Slightly enhanced Express.

```
npm install -S ft-next-express
```

Comes with:-
- [Handlebars](http://handlebarsjs.com/) (with added support for loading partials from `bower_components`)
- [Origami Image Service](http://image.webservices.ft.com/) integration
- [Sensible error handling](https://github.com/Financial-Times/express-errors-handler) (configurable via environment variables)
- Full [Next Flags](https://github.com/Financial-Times/next-feature-flags-client) integration
- [Next Metrics](https://github.com/Financial-Times/next-metrics) integration
  - measures sytem performance
  - measures performance of service dependencies (if called using the `fetch` api)
  - measures request and response performance
  - exposes the configured metrics instance as `express.metrics`
- Anti-search engine `GET /robots.txt` (possibly might need to change in the future)
- [Symbol](https://github.com/medikoo/es6-symbol) & [(Isomorphic)](https://github.com/matthew-andrews/isomorphic-fetch) Fetch polyfills
- Exposes everything in the app's `./public` folder via `./{{name-of-app}}` (only in non-production environments, please use [next-assets](https://github.com/Financial-Times/next-assets) or hashed-assets in production)
- Exposes app name via `__name` to templates and in a `data-next-app` attribute on the html tag in templates
- Adds a `/{{name-of-app}}/__about` endpoint, which exposes information about the current version of the application running
- By default the application's templates are outputted unchanged, but ft-next-express provides 2 [inheritable layouts](https://github.com/ericf/express-handlebars#layouts)

- Exposes `express.Router`
- Provides `NODE_ENV` to templates via `__environment`
- `__isProduction` is `true` if `NODE_ENV` equals `PRODUCTION` (exposed as `data-next-is-production` on the `<html>` tag in templates)
- `__version` is set to the same value as that used by [next-build-tools/about](https://github.com/Financial-Times/next-build-tools/blob/master/lib/about.js) (exposed as `data-next-version` on the `<html>` tag in templates)
- Provides a range of [handlebars helpers](#handlebars-helpers), including template inheritance and layouts
- instruments `fetch` to send data about server-to-server requests to graphite. See main.js for a list of services already instrumented. To add more services extend the list or, for services specific to a particular app, pass in a 'serviceDependencies' option (see examples below)
- Provides an solution for returning health checks that adhere to the [FT Health Check Standard](https://docs.google.com/document/d/18hefJjImF5IFp9WvPAm9Iq5_GmWzI9ahlKSzShpQl1s/edit#)

## Installation

```sh
npm install --save ft-next-express
```
When using the default layout there is also a hard dependency on some bower components. To install them (and add to your app's bower.json) run the following on your local machine. It's assumed you will have bower installed globally.

```sh
$ ./path/to/ft-next-express/bower-install.sh
```

## Example app

### `main.js`
```js
var express = require('ft-next-express');

var app = express({

	// Optional.  If name is not provided, next-express will try to infer it from package.json
	name: "xian",

	// Optional
	helpers: {
		uppercase: function(options) {
			return options.fn(this).toUpperCase();
		}
	},
	serviceDependencies: {
		// service dependencies should be listed with a regex that matches urls for that service.
		// regexes can be whatever you like so it's possible to treat paths within a given service
		// as separate services
		'youtube': /https?:\/\/youtube\.com/
	},
	// the following default to true but should normally be set to false if your app is an api
	withFlags: false, // disable feature flag middleware
	withHandlebars: false // disable handlebars middleware
	withBackendAuthentication: false // disable authentication which only allows requests in via fastly

	// Optional, defaults to empty array
	healthChecks: []
});

app.get('/', function(req, res, next) {
	res.render('main', {
		title: "FT",
		image: "https://avatars0.githubusercontent.com/u/3502508?v=3",
		date: new Date(),
		text : "<p>This wont be shown</p><p>This will be shown</p><p>This wont be shown</p>"
	});
});

app.listen(process.env.PORT, function() {
	console.log("Listening on " + process.env.PORT);
});
```

### `views/main.html`

```html
<!DOCTYPE html>
<html>
<head>
	<meta charset="utf-8">
	<title>{{title}}</title>
	<!-- this will be output as <link rel="stylesheet" href="/xian/main.css"> -->
	<link rel="stylesheet" href="/{{__name}}/main.css">
</head>
<body>
	<h1>{{title}}</h1>
	{{#uppercase}}this text will be uppercase{{/uppercase}}
	<h2>An image resized to 150px wide</h2>
	<img src="{{#resize 150}}{{image}}{{/resize}}" />

	{{#flags.myFlag}}
	The 'myFlag' flag is switched on
	{{/flags.myFlag}}

	<time data-o-component="o-date" class="o-date" datetime="{{#dateformat}}{{date}}{{/dateformat}}">
		{{#dateformat "dddd, d mmmm, yyyy"}}{{date}}{{/dateformat}}
	</time>

	{{paragraphs text start=1 end=2}}

	{{#removeImageTags}}
	Image<img src="someimage.jpg" alt="This wont be shown"/>EndImage
	{{/removeImageTags}}
</body>
</html>
```

## Testing flags

If you’re using flags and testing with mocha, you’ll need to expose listen in your app:

```
module.exports.listen = app.listen(port);
```

And in your tests, add this:

```
before(function() {
	return app.listen;
});
```

This’ll make sure your tests wait for flags to be ready.


## Health checks

Each health check should take the form of an object with a getStatus function. The getStatus function must return a valid check object (see the [FT Check Standard](https://docs.google.com/document/edit?id=1ftlkDj1SUXvKvKJGvoMoF1GnSUInCNPnNGomqTpJaFk)).

This check object can optionally be wrapped in a promise. The promise should be designed to always resolve. If the check fails, the promise should return the check object with its 'ok' attribute set to false.
