next-express [![Circle CI](https://circleci.com/gh/Financial-Times/next-express/tree/master.svg?style=svg)](https://circleci.com/gh/Financial-Times/next-express/tree/master)
============

Slightly enhanced Express.

```
npm install -S @financial-times/n-express
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
- [(Isomorphic)](https://github.com/matthew-andrews/isomorphic-fetch) Fetch polyfill
- Exposes everything in the app's `./public` folder via `./{{name-of-app}}` (only in non-production environments, please use [next-assets](https://github.com/Financial-Times/next-assets) or hashed-assets in production)
- Exposes app name via `__name` to templates and in a `data-next-app` attribute on the html tag in templates
- Adds a `/{{name-of-app}}/__about` endpoint, which exposes information about the current version of the application running
- By default the application's templates are outputted unchanged, but n-express provides 2 [inheritable layouts](https://github.com/ericf/express-handlebars#layouts)

- Exposes `express.Router`
- Provides `NODE_ENV` to templates via `__environment`
- `__isProduction` is `true` if `NODE_ENV` equals `PRODUCTION` (exposed as `data-next-is-production` on the `<html>` tag in templates)
- `__version` is set to the same value as that used by [next-build-tools/about](https://github.com/Financial-Times/next-build-tools/blob/master/lib/about.js) (exposed as `data-next-version` on the `<html>` tag in templates)
- Provides a range of [handlebars helpers](#handlebars-helpers), including template inheritance and layouts
- instruments `fetch` to send data about server-to-server requests to graphite. See main.js for a list of services already instrumented. To add more services extend the list or, for services specific to a particular app, pass in a 'serviceDependencies' option (see examples below)
- Provides a solution for implementing app health checks in adherence to the [FT Health Check Standard](https://docs.google.com/document/d/18hefJjImF5IFp9WvPAm9Iq5_GmWzI9ahlKSzShpQl1s/edit)
- Logging ([Next logger](https://github.com/Financial-Times/next-logger)), exposed via `express.logger`

## Installation

```sh
npm install --save @financial-times/n-express
```

## Example app

### `main.js`
```js
var express = require('@financial-times/n-express');

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

	// Optional
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

For an example set of health check results, see [next.ft.com/__health](https://next.ft.com/__health). For testing health checks, the [Health Status Formatter extension for Google Chrome](https://github.com/triblondon/health-status-formatter) is recommended.

Health checks can be tested for failures of a specific degree of severity by appending the severity number to the health check URL. This is particularly useful for setting up fine-grained alerting. For example, if on next.ft.com a severity level 2 health check were failing:

https://next.ft.com/__health.1 would return HTTP status 200
https://next.ft.com/__health.2 would return HTTP status 500
https://next.ft.com/__health.3 would return HTTP status 500

Each health check must have a getStatus() property, which returns an object meeting the specifications of the [FT Health Check Standard](https://docs.google.com/document/d/18hefJjImF5IFp9WvPAm9Iq5_GmWzI9ahlKSzShpQl1s/edit) and the [FT Check Standard] (https://docs.google.com/document/edit?id=1ftlkDj1SUXvKvKJGvoMoF1GnSUInCNPnNGomqTpJaFk#). This might look roughly like the following example:


```js
var exampleHealthCheck = {
	getStatus: () => {
		return {
			name: 'Some health check',
			ok: true,
			checkOutput: 'Everything is fine',
			lastUpdated: new Date(),
			panicGuide: 'Don\'t panic',
			severity: 3,
			businessImpact: "Some specific feature will fail",
			technicalSummary: "Doesn\'t actually check anything, just an example"
		};
	}
}
```
