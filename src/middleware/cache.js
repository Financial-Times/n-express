module.exports = function(req, res, next) {
	res.FT_NO_CACHE = 'max-age=0, no-cache, no-store, must-revalidate';
	res.FT_SHORT_CACHE = 'max-age=600, stale-while-revalidate=60, stale-if-error=86400';
	res.FT_HOUR_CACHE = 'max-age=3600, stale-while-revalidate=60, stale-if-error=86400';
	res.FT_DAY_CACHE = 'max-age=86400, stale-while-revalidate=60, stale-if-error=86400';
	res.FT_WEEK_CACHE = 'max-age=604800, stale-while-revalidate=60, stale-if-error=259200';
	res.FT_LONG_CACHE = 'max-age=86400, stale-while-revalidate=60, stale-if-error=259200';
	next();
};
