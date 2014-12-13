var port = process.env.PORT || 3000;
var express = require('../../../main');

var app = module.exports = express({
	name: "demo-app",
	public: __dirname+'/public'  	
});

app.get("/", function(req, res) {
	res.send("Hello world");
});

app.get("/__flags.json", function(req, res) {
	res.send(res.locals.flags);
});

app.listen(port, function() {
	console.log("Listening on " + port);
});
