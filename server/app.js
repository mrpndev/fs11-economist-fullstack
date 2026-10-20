require("dotenv").config()
const express = require("express")
const app = express()
const cors = require("cors")

const PORT = process.env.PORT
const HOST = process.env.HOST
const authRoutes = require("./routes/auth.routes")
const routes = require("./routes/api.routes")
const authValidator = require("./middlewares/authValidator")
const errorHandler = require("./middlewares/errorHandler")
const headers = require("./middlewares/headers")
const rateLimiter = require("./middlewares/rateLimiter")
const { db } = require("./db")
const validateRoutes = require("./middlewares/validate")

/* 
	? Middleware Chaining
	* process of taking our helpers, validators, etc
	* we apply them to the middleware lifeycle
	* we put them before, in the middle, or after routes
*/
const corsOptions = {
	"origin": "*"
}

app.use(rateLimiter)
app.use(express.json())
app.use(cors())
// app.use(headers)
// we add the validator preceeding auth routes
app.use(authValidator, authRoutes)
app.use(validateRoutes, routes)
app.use((req, res) => {
	res.status(404).sendFile(`${__dirname}/public/index.html`)
})
app.use(errorHandler);

app.listen(PORT, HOST, async () => {
	try {
		// establish connection to existing database
		await db.authenticate()
		// syncs all of our schemas to the database
		await db.sync()
		// got rid of { force: false } to let migrations handle schema changes
		console.log(`[server] running on ${HOST}:${PORT}`)
		console.log(`[database] running`)
	} catch(err) {
		console.error(err)
	}
})

/* 
	? CORS
	* Cross Origin Resource Sharing
	* Security System for permissions between client and server
	* works by modifying the headers for request and response
	* CORS IS NOT ACCESS CONTROL!!!! - this would require its own mechanism
	* CORS is enforced by web browsers only, not by express server
	* authentication & authorization is not CORS
*/

