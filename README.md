next-express [![Codeship Status for Financial-Times/next-express](https://codeship.com/projects/4911c880-66c9-0132-eecf-7259638a7ad7/status)](https://codeship.com/projects/52937)
============

Slightly enhanced Express.

Comes with:-
- [Handlebars](http://handlebarsjs.com/) (with added support for loading partials from `bower_components`)
- [Origami Image Service](http://image.webservices.ft.com/) integration
- [Sensible error handling](https://github.com/Financial-Times/express-errors-handler) (configurable via environment variables)
- Full [Next Flags](https://github.com/Financial-Times/next-feature-flags-client) integration
- Anti-search engine `GET /robots.txt` (possibly might need to change in the future)
- [Promise](https://github.com/jakearchibald/es6-promise) & [(Isomorphic)](https://github.com/matthew-andrews/isomorphic-fetch) Fetch polyfills
- Exposes everything in the app's `./public` folder via `./{{name-of-app}}`
- Exposes app name via `__name` to templates
- Provides `NODE_ENV` to templates via `__environment`
- `__isProduction` is `true` if `NODE_ENV` equals `PRODUCTION`
- Provides a [date formatter](https://github.com/felixge/node-dateformat) that outputs in an `o-date` compatible way (but can be overridden to any format)
- Provides a handlebars helper to take a subsection of paragraphs (\<p>\</p>) from a HTML blob
- Provides a handlebars helper to strip image tags from a HTML blob

## Installation

```sh
npm install --save ft-next-express
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
	}
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

	{{#flags.myFlag.isSwitchedOn}}
	The 'myFlag' flag is switched on
	{{/flags.myFlag.isSwitchedOn}}

	<time data-o-component="o-date" class="o-date" datetime="{{#dateformat}}{{date}}{{/dateformat}}">
		{{#dateformat "dddd, d mmmm, yyyy"}}{{date}}{/dateformat}}
	</time>
	
	{{paragraphs text start=1 end=2}}
	
	{{#removeImageTags}}
	Image<img src="someimage.jpg" alt="This wont be shown"/>EndImage
	{{/removeImageTags}}
</body>
</html>
```
