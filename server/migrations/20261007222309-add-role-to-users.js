"use strict";

// ? This is an example of an 'up' script
/** @type {import('sequelize-cli').Migration} */
module.exports = {
	async up(queryInterface, Sequelize) {
		await queryInterface.addColumn("users", "role", {
			type: Sequelize.ENUM("viewer", "editor", "admin"),
			allowNull: false,
			defaultValue: "viewer",
		});
	},
};

/* 
	? Migration
	* process of updating our SQL table schema
	* done when structure of our data changes
	* for ex: we add a table or change what datatype or constraint goes
	
	? How to
	* npm i sequelize-cli --save-dev
	* create a script in your package.json
	* run command, then name your migration
	* initialize your cli by running sequelize-cli init
	* configure your config.json with db credentials
	* this will generate a migration file (this one)
	* build up() function to push it to db
	* build down() function to revert the change
	* run migrate function
	* update the model as well
*/



