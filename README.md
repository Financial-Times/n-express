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

app.get("/", function(req, res) {
	res.send("Hello world");
});

app.get("/__flags.json", function(req, res) {
	res.send(res.locals.flags);
});

app.get('/templated', function(req, res, next) {
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
	<h2>Resize test</h2>
	<img src="{{#resize 150}}{{image}}{{/resize}}" />
</body>
</html>
```
