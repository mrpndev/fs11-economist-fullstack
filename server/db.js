/* 
	? Object Relational Mapper (ORM)
	* tool which allows communication with the database
	* it allows db communication using native programming language instead of SQL
	* allows full CRUD operations on the dtabase
	* holds all transactions up to ACID standards
	* allows handling of schema and model creation and modification
*/

/* 
	? Database Setup Notes
	* install using npm i sequelize pg pg-hstore
	* add db path to our .env file
	* "postgres://user:password@ip:port/nameofdb"
	* ex: postgres://paul@pwd123@localhost:5432/mydb
	* db.js will store connection instance
	* create an instance of teh database using pgAdmin or psql
	* import contents of this file into app.js
	* follow along with comments in app.js to learn more
*/

// import and destructure Sequelize class from the import
const { Sequelize, DataTypes } = require("sequelize")

// instantiate sequelizeand provide it with location and credentials

const db = new Sequelize(process.env.DB_URL, {
	logging: true
})

// export for use in other areas of the project
module.exports = { db, Sequelize, DataTypes }
