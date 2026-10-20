/* 
	? Challenge
	* retrieve your /new route body from Postman
	* create a model in here
	* the table should be named Countries
	* create columns we have outlined before
	* create validators you believe we will need
	* (dont need to go fancy on above)
	* once done
	* import to the api controller
	* rebuild your createNew function to add a country into your db
	* it should also return the data from the db in the response
	* HINT utilize the pattern from auth.controller and auth.model
*/

const { db, DataTypes } = require("../db");

const Countries = db.define(
	"countries",
	{
		country: {
			type: DataTypes.STRING(50),
			allowNull: false
		},
		country_code: {
			type: DataTypes.STRING(3),
			allowNull: false,
			validate: {
				is: /^[a-zA-Z]{1,3}$/
			}
		},
		year: {
			type: DataTypes.INTEGER,
			allowNull: false
		},
		population: {
			type: DataTypes.INTEGER,
			allowNull: false
		},
		gdp_usd: {
			type: DataTypes.INTEGER,
			allowNull: false
		},
		inflation: {
			type: DataTypes.FLOAT,
			allowNull: false
		},
		unemployment: {
			type: DataTypes.FLOAT,
			allowNull: false
		},
	},
	{
		timestamps: true,
	}
);

module.exports = { Countries }