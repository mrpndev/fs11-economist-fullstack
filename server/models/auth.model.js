// import db for connection & DataTypes for validators
const { db, DataTypes } = require("../db");

/* 
	? Schema
	* a well defined structure of our data
	* allows us to outline
		* columns
		* constraints
		* requirements /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
		* additional built-in functionality
*/

const User = db.define(
	"user",
	{
		full_name: {
			type: DataTypes.STRING(100),
			allowNull: false,
		},
		email: {
			type: DataTypes.STRING(100),
			allowNull: false,
			unique: true,
			validate: {
				is: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
			},
		},
		password: {
			type: DataTypes.STRING,
			allowNull: false,
			validate: {
				min: 10,
			},
		},
		role: {
			type: DataTypes.ENUM(
				"viewer",
				"editor",
				"admin"
			),
			allowNull: false,
			defaultValue: "viewer"
		}
	},
	{
		timestamps: true,
	}
);

module.exports = { User }