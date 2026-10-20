/* 
	? Rate Limiting
	* handling how many requests our app can accept
	* prevents DDoS attacks
	* it only handles single IP address
	* can be configured to handle different IP's
	* helmet is a dependency we can use instead
	
	? Building rate limiter
	* we need the following
	* IP of where it's coming from
	* count of attempts
	* Time constraint
	* reset after time constraint
	* res handling too many requests
*/

let requests = {}

let rateLimiter = (req, res, next) => {
	let ip = req.ip
	let now = Date.now()

	// if no record found, create a record with ip & time
	if (!requests[ip]) {
		requests[ip] = {
			count: 1,
			startTime: now
		}
		return next()
	}
	
	// if record found, check if 10s passed and reset it
	if (now - requests[ip].startTime >= 10000) {
		requests[ip] = {
			count: 1,
			startTime: now
		}
	}

	// if record exists AND its under 10s, increment count
	requests[ip].count++

	// if record found AND its under 10s, AND above 3 attempts, BLOCK
	if (requests[ip].count > 1000) {
		return res.status(429).json({
			message: "Too many requests"
		})
	}
	
	next()
}

module.exports = rateLimiter