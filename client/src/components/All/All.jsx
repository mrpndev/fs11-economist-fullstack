import React, { useState, useEffect } from "react";
import "./All.css";
import Vulnerability from "../Vulnerability"

export default function All({ token }) {
	const [data, setData] = useState(null);
	// state variable responsible for error loading
	const [error, setError] = useState("");

	useEffect(() => {
		const getCountries = async () => {
			try {
				const response = await fetch("http://127.0.0.1:4000/all", {
					method: "GET",
					headers: new Headers({
						"Content-Type": "application/json",
						authorization: token,
					}),
				});

				if (!response.ok) {
					throw new Error(
						`Could not load countries (${response.status}).`,
					);
				}

				const result = await response.json();
				setData(Array.isArray(result.message) ? result.message : []);
			} catch (err) {
				// handling error display and collection
				setError(err.message || "Could not load countries.");
			}
		};

		getCountries();
	}, [token]);

	const formatNumber = value => new Intl.NumberFormat("en-US").format(value);
	const formatDate = value =>
		new Intl.DateTimeFormat("en-US", {
			month: "short",
			day: "numeric",
			year: "numeric",
		}).format(new Date(value));

	return (
		<section className="allCountries" aria-labelledby="countries-heading">
			<header className="countriesHeader">
				<div>
					<p className="countriesEyebrow">Country data</p>
					<h1 id="countries-heading">All countries</h1>
				</div>
				{/* SUCCESS STATE: if data is truthy, it will render span; else it wont' render anything */}
				{data && (
					<span className="countryCount">{data.length} records</span>
				)}
			</header>

			{/* ERROR STATE: inverse of above, show error if an error exists else do nothing */}
			{error && (
				<p className="countriesMessage countriesError" role="alert">
					{error}
				</p>
			)}
			{/* LOADING STATE: if no error AND no data, render this */}
			{!error && data === null && (
				<p className="countriesMessage" role="status">
					Loading country data…
				</p>
			)}
			{!error && data?.length === 0 && (
				<p className="countriesMessage">No country data available.</p>
			)}

			{data?.length > 0 && (
				<div className="countryGrid">
					{data.map(country => (
						<article className="countryCard" key={country.id}>
							<div className="countryCardHeader">
								<div>
									<h2>{country.country}</h2>
									<p className="countryCode">
										{country.country_code}
									</p>
								</div>
								<span className="countryYear">
									{country.year}
								</span>
							</div>

							<dl className="countryStats">
								<div className="countryStat">
									<dt>GDP (USD)</dt>
									<dd>${formatNumber(country.gdp_usd)}</dd>
								</div>
								<div className="countryStat">
									<dt>Population</dt>
									<dd>{formatNumber(country.population)}</dd>
								</div>
								<div className="countryStat">
									<dt>Inflation</dt>
									<dd>{country.inflation}%</dd>
								</div>
								<div className="countryStat">
									<dt>Unemployment</dt>
									<dd>{country.unemployment}%</dd>
								</div>
							</dl>

							<p className="countryUpdated">
								Updated {formatDate(country.updatedAt)}
							</p>
						</article>
					))}
				</div>
			)}
		{/* <Vulnerability /> */}
		</section>
	);
}
