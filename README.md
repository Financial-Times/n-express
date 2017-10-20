n-express [![Circle CI](https://circleci.com/gh/Financial-Times/n-express/tree/master.svg?style=svg)](https://circleci.com/gh/Financial-Times/n-express/tree/master)[![Coverage Status](https://coveralls.io/repos/github/Financial-Times/n-express/badge.svg)](https://coveralls.io/github/Financial-Times/n-express)
============

Slightly enhanced Express.

This module is now mainly aimed at APIs. For the full box of features aimed at building a user-facing page use `@financial-times/n-ui` instead

```
npm install -S @financial-times/n-express
```

# API extensions

## App init options


Passed in to `require('@financial-times/n-express')(options)`, these (Booleans defaulting to false unless otherwise stated) turn on various optional features

### Mandatory

- `systemCode` - allows the application to communicate its [CMDB](https://cmdb.ft.com) to other services.

### Optional

- `withBackendAuthentication` - Boolean, defaults to `true` - if there is a `FT_NEXT_BACKEND_KEY[_OLD]` env variable, the app will expect requests to have an equivalent `FT-Next-Backend-Key[-Old]` header; this turns off that functionality
- `withFlags` - decorates each request with [flags](https://github.com/Financial-Times/n-flags-client) as `res.locals.flags`
- `withServiceMetrics` - instruments `fetch` to record metrics on services that the application uses. Defaults to `true`
- `healthChecks` Array - an array of healthchecks to serve on the `/__health` path (see 'Healthchecks' section below)
- `healthChecksAppName` String - the name of the application, output in the `/__health` JSON. This defaults to `Next FT.com <appname> in <region>`.

## Static properties and methods
- `Router` - `express.Router`
- `static` - `express.static` middleware
- `metrics` - `next-metrics` instance
- `flags` - `n-flags-client` instance
- `getAppContainer()` - returns an object:
	- `app`: the express app instance
	- `meta`: object containing the name, description and directory of the app
	- `addInitPromise()`: function for adding additional promises to wait for before allowing the app to accept traffic


## Cache control
Several useful cache control header values are available as constants on responses:
```
	res.FT_NO_CACHE = 'max-age=0, no-cache, no-store, must-revalidate';
	res.FT_SHORT_CACHE = 'max-age=600, stale-while-revalidate=60, stale-if-error=86400';
	res.FT_HOUR_CACHE = 'max-age=3600, stale-while-revalidate=60, stale-if-error=86400';
	res.FT_DAY_CACHE = 'max-age=86400, stale-while-revalidate=60, stale-if-error=86400';
	res.FT_WEEK_CACHE = 'max-age=604800, stale-while-revalidate=60, stale-if-error=259200';
	res.FT_LONG_CACHE = 'max-age=86400, stale-while-revalidate=60, stale-if-error=259200';
```

## Cache varying
Various vary headers are set by default (ft-flags, ft-anonymous-user, ft-edition, Accept-Encoding as of Apr 2016 ) as they are required for most responses - the user experience will break if they are not. To control these a few additional methods are provided
- `res.unvary('My-Header')` - use if your response definitely doesn't need to vary on one of the standard vary headers e.g. .rss probably doesn't need to vary on ft-edition
- `res.unvaryAll('wrapper')` removes all headers included by default for use by the usual next page layout... ideal for serving html fragments, json etc.
- `res.unvaryAll()` - remove all vary headers. *Do not use lightly!!!*
- `res.vary('My-Header')` - add to the list of vary headers

## next-metrics
As next-metrics must be a singleton to ensure reliable reporting, it is exported at `require('@financial-times/n-express').metrics`. To send metrics under a variant app name (e.g. a canary app) set the environment variable `FT_APP_VARIANT`.

# Other enhancements
- `fetch` is added as a global using [isomorphic-fetch](https://github.com/matthew-andrews/isomorphic-fetch)
- Errors are sent to sentry using [n-raven](https://github.com/Financial-Times/n-raven)
- Instrumentation of system and http (incoming and outgoing) performance using [Next Metrics](https://github.com/Financial-Times/next-metrics)
- Anti-search engine `GET /robots.txt` (possibly might need to change in the future)
- Exposes various bits of metadata about the app (e.g. name, version, env, isProduction) to templates (via `res.locals`) and the outside world (via `{appname}/__about.json`)



# Health checks

For an example set of health check results, see [ft-next-health-eu.herokuapp.com/__health](https://ft-next-health-eu.herokuapp.com/__health) and [ft-next-health-us.herokuapp.com/__health](https://ft-next-health-us.herokuapp.com/__health). For testing health checks, the [Health Status Formatter extension for Google Chrome](https://github.com/triblondon/health-status-formatter) is recommended.

Health checks can be tested for failures of a specific degree of severity by appending the severity number to the health check URL. This is particularly useful for setting up fine-grained alerting. For example, if on next.ft.com a severity level 2 health check were failing:

https://ft-next-health-eu.herokuapp.com/__health.1 would return HTTP status 200
https://ft-next-health-eu.herokuapp.com/__health.2 would return HTTP status 500
https://ft-next-health-eu.herokuapp.com/__health.3 would return HTTP status 500

Each health check must have a getStatus() property, which returns an object meeting the specifications of the [FT Health Check Standard](https://docs.google.com/document/d/18hefJjImF5IFp9WvPAm9Iq5_GmWzI9ahlKSzShpQl1s/edit) and the [FT Check Standard] (https://docs.google.com/document/edit?id=1ftlkDj1SUXvKvKJGvoMoF1GnSUInCNPnNGomqTpJaFk#). This might look roughly like the following example:

Note also that it is now required for the JSON returned at the `/__health` endpoint to contain the system code. To ensure that this happens, please ensure that the `systemCode` property of the express app init options has been supplied. See the 'App init options' section above.

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

# Troubleshooting

## Testing with flags

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
