const { Countries } = require("../models/api.model");
const { Sequelize } = require("../db");

let getAll = async (req, res) => {
	console.log(req.headers)

	let foundCountries = await Countries.findAll()

	res.status(200).json({
		message: foundCountries
	});
};

let createNew = async (req, res) => {
	console.log(req.body);

	// data mismatch for educational purposes ONLY

	let newCountry = await Countries.create({
		country: req.body.country,
		country_code: req.body.countryCode,
		year: req.body.year,
		population: req.body.population,
		gdp_usd: req.body.gdpUSD,
		inflation: req.body.inflation,
		unemployment: req.body.unemployment,
	});

	res.status(201).json({
		message: `Country created`,
		newCountry,
	});
};

let getByCountry = async (req, res) => {
	let { country } = req.params;
	console.log(country);

	const foundCountry = await Countries.findAll({
		where: Sequelize.where(
			Sequelize.fn("LOWER", Sequelize.col("country")),
			country
		),
	});

	if (!foundCountry.length) {
		res.status(200).json({
			message: `${country} not found`
		})
		return
	}

	res.status(200).json({
		message: foundCountry
	});
};

let updateByID = async (req, res) => {

	console.log(req.params, req.body)

	let { id } = req.params

	let foundCountry = await Countries.findByPk(id)
	console.log(foundCountry)

	if (!foundCountry) {
		res.status(200).json({
			message: "Country not found"
		})

		return
	}

	/* 
		? Nullish Coalescing Operator
		* compares left and right values
		* returns first not null or undefined value
		* in our example, it updates property
			* with left ?? value if not null or undefined
			* with ?? right value if left was null or undefined
		* avoids having to update unchanged data
	*/

	let updatedCountry = {
		country: req.body.country ?? country,
		country_code: req.body.country_code ?? country_code,
		year: req.body.year ?? year,
		population: req.body.population ?? population,
		gdp_usd: req.body.gdp_usd ?? gdp_usd,
		inflation: req.body.inflation ?? inflation
	}

	foundCountry.update(updatedCountry)

	res.status(200).json({
		message: "Country updated",
		updatedCountry
	});
};

let deleteByID = async (req, res) => {
	/* 
		? Challenge
		* try to delete a country using its id
	*/
	const { id } = req.params
	
	let foundCountry = await Countries.findByPk(id)
	
	if (!foundCountry) {
		res.status(200).json({
			message: "No country found"
		})

		return
	}

	await foundCountry.destroy()

	res.status(200).json({
		message: "Country deleted",
		foundCountry
	});
};

module.exports = { getAll, createNew, getByCountry, updateByID, deleteByID };
