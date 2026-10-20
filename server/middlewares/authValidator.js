function authValidator(req, res, next) {

	if (req.url === "/register") {
		let { full_name, email, password } = req.body;
	
		if (!full_name) {
			// ? Guard Clauses
			return res.status(400).json({
				message: "Name, email, address, and password required",
			});
		}
	
		email = email.trim()
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!email || !emailRegex.test(email.trim())) {
			return res.status(400).json({
				message: "Valid email is required",
			});
		}
	
		if (!password || !(password.length >= 8)) {
			console.log("here");
			return res.status(400).json({
				message:
					"Valid password is required. It must be 8 or more characters",
			});
		}
	}

	next()
}

module.exports = authValidator