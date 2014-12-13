var port = process.env.PORT || 3000;
var express = require('../../../main');

var app = module.exports = express({
	name: "demo-app",
	directory: __dirname
});

app.set('views', __dirname + '/views');

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

app.listen(port, function() {
	console.log("Listening on " + port);
});
