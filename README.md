next-express
============

Slightly enhanced Express.

Comes with:-
- Handlebars
- Origami Image Service integration
- Load paths for templates installed via bower.
- Sensible error handling (configurable via environment variables)
- Full Next Flags integration

## Example app

### `main.js`
```js
var express = require('next-express');

var app = express({
	name: "ft-next-xian"
});

app.get('/', function(req, res, next) {
	res.render('main', {
		title: "FT",
		image: "https://avatars0.githubusercontent.com/u/3502508?v=3"
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
</head>
<body>
	<h1>{{title}}</h1>
	<h2>An image resized to 150px wide</h2>
	<img src="{{#resize 150}}{{image}}{{/resize}}" />

	{{#flags.myFlag.isSwitchedOn}}
	The 'myFlag' flag is switched on
	{{/flags.myFlag.isSwitchedOn}}
</body>
</html>
```
