require("dotenv").config();

module.exports = {
	development: {
		username: process.env.DB_USER,
		password: process.env.DB_PWD,
		database: "economist",
		host: "127.0.0.1",
		dialect: "postgres",
	},
	test: {
		username: process.env.DB_USER,
		password: process.env.DB_PWD,
		database: "database_test",
		host: "127.0.0.1",
		dialect: "postgres",
	},
	production: {
		username: process.env.DB_USER,
		password: process.env.PWD,
		database: "database_production",
		host: "127.0.0.1",
		dialect: "postgres",
	},
};
