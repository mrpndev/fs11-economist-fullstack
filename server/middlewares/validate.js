/* 
	? Protected Routes
	* routes requiring authorization or authentication to access
	* done using session or token
	* we will use JSONWebToken to accomplish this
*/
const jwt = require("jsonwebtoken")
const JWT_KEY = process.env.JWT_KEY
const { User } = require("../models/auth.model")

let validateSession = (req, res, next) => {
	// ? prefilght request - checks what's allowed by the server
	if (req.method === "OPTIONS") {
		next()
	}

	// ? check if token exists
	// ? token passed in headers, may have Bearer prefix
	if (!req.headers.authorization) {
		return res.status(403).json({
			message: "Forbidden"
		})
	}

	// ? handle the auth header as Bearer or naked token
	let authToken = req.headers.authorization.includes("Bearer")
		? req.headers.authorization.split(" ")[1]
		: req.headers.authorization

	// Debug the incoming token before verification; decoded data is untrusted.
	console.log("Received JWT:", authToken)
	console.log("Received JWT payload (unverified):", jwt.decode(authToken))

	// ? jwt verifies if token generated using our key
	let payload = jwt.verify(authToken, JWT_KEY, async (err, payload) => {
		if (err) {
			console.error(err)
			return res.status(403).json({
				message: "Forbidden"
			})
		}

		let user = await User.findByPk(payload.id)

		// ? Safer than trusting the request
		// ? Comes from database and can be validated
		req.user = user
		console.log(req.user)

		next()
	})

}

module.exports = validateSession
