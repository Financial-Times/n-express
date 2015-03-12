next-express
============

Slightly enhanced Express.

Comes with:-
- [Handlebars](http://handlebarsjs.com/) (with added support for loading partials from `bower_components`)
- [Origami Image Service](http://image.webservices.ft.com/) integration
- [Sensible error handling](https://github.com/Financial-Times/express-errors-handler) (configurable via environment variables)
- Full [Next Flags](https://github.com/Financial-Times/next-feature-flags-client) integration
- Basic [Next Metrics](https://github.com/Financial-Times/next-metrics) integration
- Anti-search engine `GET /robots.txt` (possibly might need to change in the future)
- [Promise](https://github.com/jakearchibald/es6-promise) & [(Isomorphic)](https://github.com/matthew-andrews/isomorphic-fetch) Fetch polyfills
- Exposes everything in the app's `./public` folder via `./{{name-of-app}}`
- Exposes app name via `__name` to templates and in a `data-next-app` attribute on the html tag in templates
- By default the application's templates are outputted unchanged, but ft-next-express provides 2 [inheritable layouts](https://github.com/ericf/express-handlebars#layouts):
	 - vanilla.html - Outputs the application's template preceded by `<!DOCTYPE html>`, `<head>` and wrapped in `<html>` and `<body>` tags, and loading all standard next app styles and scripts, including cutting the mustard and tracking
	 - wrapper.html - All the above but also including the next header and footer

For vanilla and wrapper layouts scripts and styles must still be manually required/imported into your application's sass and js

- Provides `NODE_ENV` to templates via `__environment`
- `__isProduction` is `true` if `NODE_ENV` equals `PRODUCTION`
- Provides a range of [handlebars helpers](#handlebars-helpers), including template inheritance


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
		{{#dateformat "dddd, d mmmm, yyyy"}}{{date}}{{/dateformat}}
	</time>

	{{paragraphs text start=1 end=2}}

	{{#removeImageTags}}
	Image<img src="someimage.jpg" alt="This wont be shown"/>EndImage
	{{/removeImageTags}}
</body>
</html>
```

<a name="handlebars-helpers">
## Handlebars inheritance
This is achieved by means of two helpers:

- `outputBlock` used in the parent template to indicate where content should be output. Can also define default content
- `defineBlock` used in the child template to define the desired output to insert into the block

```mustache
// parent.html
{{#outputBlock 'my-block'}}default content{{/outputBlock}}

// child.html
{{#defineBlock 'my-block'}}
	Mustaches to process: {{someVar}}
{{/defineBlock}}
{{> parent}}
```

## Content helpers

### dateformat
Outputting date objects as strings
- `{{#dateformat}}{{ a date object }}{{/dateformat}}` outputs an isoString
- `{{#dateformat "dddd, d mmmm, yyyy"}}{{ a date object }}{{/dateformat}}` outputs the date formatted as 'Tuesday, 3 February, 2014'

### encode
Encoding strings to be output safely in html
- `{{encode q mode='uriComponent'}}` outputs the result of `encodeURIComponent(q)` (`{{encode q }}` will also do this)
- `{{encode q mode='uri'}}` outputs the result of `encodeURI(q)`

### topicUrl
Takes a topic identifier (currently something like `topic:"European%20Cars"`) and converts to a next stream url `/stream/topic/European%20Cars`
- `{{topicUrl searchString}}`

### paragraphs
Outputting some paragraphs from a larger chunk of html, zero indexed
- `{{{paragraphs body start=0 end=1}}}` will output the first paragraph of `body`. *Note the triple mustaches*

### removeImageTags
Strips all image tags from a chunk of html
- `{{{removeImageTags body}}}` *Note the triple mustaches*

### resize
Replaces an image url with an image service url, serving an appropriately resized image
- `{{#resize 200}}http://images.com/pic.jpg{{/resize}}`

### json
Outputs an object as json.
- `{{json obj}}` - for use within data attributes and elsewhere in html (will convert '"' to '&quot;' etc..)
- `{{{json obj}}}` - for outputting the json unencoded

### usePartial
Allows a partial to be selected based on the value of a variable
- `{{{usePartial 'path/to/partial'}}}` *Note* a '>' is not required in the path and you will normally need triple mustaches

## Logic helpers

### ifEquals
Outputs contents if a thing is equal to a value
- `{{#ifEquals thing 'value'}} some content {{else}} some fallback content {{/ifEquals}}`

### ifAll
Outputs contents if a number of things are truthy *Note that handlebars has a [slightly odd understanding of truthiness](http://stackoverflow.com/questions/21444525/what-is-truthy-or-falsy-in-mustache-and-handlebars)*
- `{{#ifAll thing1 thing2 thing3}} some content {{else}} some fallback content {{/ifAll}}`

### ifSome
Outputs contents if at least one of a number of things is truthy *Note that handlebars has a [slightly odd understanding of truthiness](http://stackoverflow.com/questions/21444525/what-is-truthy-or-falsy-in-mustache-and-handlebars)*
- `{{#ifSome thing1 thing2 thing3}} some content {{else}} some fallback content {{/ifSome}}`

## Iteration helpers

### slice
Loop through a subset of items
- `{{#slice items limit="2" offset="4"}} some content {{/slice}}

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
