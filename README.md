n-express [![Circle CI](https://circleci.com/gh/Financial-Times/n-express/tree/master.svg?style=svg)](https://circleci.com/gh/Financial-Times/n-express/tree/master)
============

Slightly enhanced Express.

```
npm install -S @financial-times/n-express
```

# API extensions

## App init options
Passed in to `require('@financial-times/n-express')(options)`, these (Booleans defaulting to false unless otherwise stated) turn on various optional features
- `systemCode` - ensures that the system code is present in the JSON that is returned at the `/__health` endpoint. Note that the value of this property must correspond with the `systemCode` property of the [service registry](http://next-registry.ft.com/) entry of the app in question
- `withFlags` - decorates each request with feature flags as `res.locals.flags`
- `withHandlebars` - adds handlebars as the rendering engine
- `withAssets` - adds asset handling middleware, see [Linked Resources (preload)](#linked-resources-preload). Ignored if `withHandlebars` is not `true`
- `withNavigation` - adds a data model for the navigation to each request (see below)
- `withNavigationHierarchy` - adds additional data to the navigation model concerning the current page's ancestors and children
- `withAnonMiddleware` - sets the user's signed in state in the data model, and varies the response accordingly
- `withBackendAuthentication` - will reject requests not decorated with an `FT-Next-Backend-Key`. *Must be true for any apps accessed via our CDN and router*
- `withServiceMetrics` - instruments `fetch` to record metrics on services that the application uses. Defaults to `true`
- `hasHeadCss` - if the app outputs a `head.css` file, read it (assumes it's in the `public` dir) and store in the `res.locals.headCss`
- `healthChecks` Array - an array of healthchecks to serve on the `/__health` path (see 'Healthchecks' section below)
- `healthChecksAppName` String - the name of the application, output in the `/__health` JSON. This defaults to `Next FT.com <appname> in <region>`.

## Cache control
Several useful cache control header values are available as constants on responses:
```
	res.FT_NO_CACHE = 'max-age=0, no-cache, no-store, must-revalidate';
	res.FT_SHORT_CACHE = 'max-age=600, stale-while-revalidate=60, stale-if-error=86400';
	res.FT_HOUR_CACHE = 'max-age=3600, stale-while-revalidate=60, stale-if-error=86400';
	res.FT_DAY_CACHE = 'max-age=86400, stale-while-revalidate=60, stale-if-error=86400';
	res.FT_LONG_CACHE = 'max-age=86400, stale-while-revalidate=60, stale-if-error=259200';
```

## Linked Resources (preload)
Adds link headers to enable service workers to optimise requests for assets, defaulting to preload behaviour
e.g:
- res.linkResource('//path/to/file.css', {as: 'style'}) => adds a link header to `//path/to/file.css` with `as="style"` and `rel="preload"`
- res.linkResource('//path/to/file.js', {rel: 'prefetch', as: 'script'}) => adds a link header to `//path/to/file.js` with `as="script"` and `rel="prefetch"`
- res.linkResource('main.css', {as: 'style'}, {hashed: true}) => adds a link header to the hashed asset path generated for the app's `main.css` file

Link headers for `main.css` and `main.js` are added by default to any `text/html` request.

e.g `res.linkResource('comments.css', {as: 'style', rel: 'prefetch'})`


## Cache varying
Various vary headers are set by default (ft-flags, ft-anonymous-user, ft-edition, Accept-Encoding as of Apr 2016 ) as they are required for most responses - the user experience will break if they are not. To control these a few additional methods are provided
- `res.unvary('My-Header')` - use if your response definitely doesn't need to vary on one of the standard vary headers e.g. .rss probably doesn't need to vary on ft-edition
- `res.unvaryAll('wrapper')` removes all headers included by default for use by the usual next page layout... ideal for serving html fragments, json etc.
- `res.unvaryAll()` - remove all vary headers. *Do not use lightly!!!*
- `res.vary('My-Header')` - add to the list of vary headers

## next-metrics
As next-metrics must be a singleton to ensure reliable reporting, it is exported at `require('@financial-times/n-express').metrics`

## Navigation
If you pass `withNavigation:true` in the init options, you will have navigation data available in `res.locals.navigation`.  this data comes from polling the [navigation API](https://github.com/Financial-Times/next-navigation-api).  This data is used to populate the various menus and navigation items on the apps.  The following data is available

	res.locals.navigation = {
		lists: {
			navbar_desktop: // data for the main nav in the header (only on large screens)
			navbar_mobile: //data for the white strip that appears on the homepage and fastFT pages only on small screens
			drawer: //data for the slide-out menu
			footer: // data for the footer
		}
	}

### Navigation Hierarchy
If you also pass `withNavigationHierarchy: true` in the init options you get some additonal properties detailing the current page's position in the hierarchy.  This is only currently useful on stream pages.  The following properties are added:

	res.locals.navigation.currentItem // the current item
	res.locals.navigation.children //an array of the direct decendents of the current page
	res.locals.navigation.ancestors // an array of the parent items of the current page (top level first)

### Editions
The navigation model also controls the edition switching logic.  The following properties are added

	res.locals.editions.current // the currently selected edition
	res.locals.editions.others //  and array of other possible editions


# Other enhancements
- `fetch` is added as a global using [isomorphic-fetch](https://github.com/matthew-andrews/isomorphic-fetch)
- Our [Handlebars](http://handlebarsjs.com/) engine loads partials from `bower_components` and has a number of [additional helpers](https://github.com/Financial-Times/n-handlebars). It also points to [n-layout](https://github.com/Financial-Times/n-layout) to provide a vanilla and 'wrapper' layout
- Errors are sent to sentry using [n-raven](https://github.com/Financial-Times/n-raven)
- Instrumentation of system and http (incoming and outgoing) performance using [Next Metrics](https://github.com/Financial-Times/next-metrics)
- Anti-search engine `GET /robots.txt` (possibly might need to change in the future)
- Exposes everything in the app's `./public` folder via `./{{name-of-app}}` (only in non-production environments, please use [next-assets](https://github.com/Financial-Times/next-assets) or hashed-assets in production)
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
