module.exports = (req, res, next) => {
	res.set('X-Content-Type-Options', 'nosniff');
	res.set('X-Download-Options', 'noopen');
	res.set('X-Frame-Options', 'SAMEORIGIN');
	res.set('X-XSS-Protection', '1; mode=block');
	next();
};
