import { useState, useEffect } from "react";
import "./All.css";
import { apiEndpoint } from "../../utils/apiEndpoint";

export default function All({ token, onLogout }) {
	const [data, setData] = useState(null);
	// state variable responsible for error loading
	const [error, setError] = useState("");
	const [showAddForm, setShowAddForm] = useState(false);
	const [saving, setSaving] = useState(false);
	const [formError, setFormError] = useState("");
	const [form, setForm] = useState({ country: "", countryCode: "", year: new Date().getFullYear(), population: "", gdpUSD: "", inflation: "", unemployment: "" });

	useEffect(() => {
		const getCountries = async () => {
			try {
				const response = await fetch(apiEndpoint("routes/all"), {
					method: "GET",
					headers: new Headers({
						"Content-Type": "application/json",
						authorization: token,
					}),
				});

				if (!response.ok) {
					if (response.status === 401 || response.status === 403) onLogout();
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
	}, [token, onLogout]);

	const updateField = event => setForm({ ...form, [event.target.name]: event.target.value });
	const addCountry = async event => {
		event.preventDefault();
		setSaving(true); setFormError("");
		try {
			const response = await fetch(apiEndpoint("routes/new"), { method: "POST", headers: { "Content-Type": "application/json", authorization: token }, body: JSON.stringify(form) });
			const result = await response.json();
			if (!response.ok) { if (response.status === 401) onLogout(); throw new Error(result.message || "Could not add country."); }
			setData(current => [...(current || []), result.newCountry]);
			setForm({ country: "", countryCode: "", year: new Date().getFullYear(), population: "", gdpUSD: "", inflation: "", unemployment: "" });
			setShowAddForm(false);
		} catch (err) {
			setFormError(err.message);
		} finally { setSaving(false); }
	};

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
				<div className="headerActions">{data && <span className="countryCount">{data.length} records</span>}<button className="addCountryButton" onClick={() => setShowAddForm(current => !current)}>{showAddForm ? "Close" : "+ Add country"}</button></div>
			</header>
			{showAddForm && <form className="addCountryPanel" onSubmit={addCountry}>
				<div className="addPanelIntro"><p className="countriesEyebrow">New observation</p><h2>Add a country</h2><p>Enter the latest available figures to expand your dataset.</p></div>
				<div className="addFields">{[["country","Country name","e.g. Canada"],["countryCode","Code","CAN"],["year","Year","2026"],["population","Population","40,000,000"],["gdpUSD","GDP (USD)","2,000,000,000"],["inflation","Inflation %","2.1"],["unemployment","Unemployment %","5.2"]].map(([name, label, placeholder]) => <label key={name}>{label}<input required name={name} value={form[name]} onChange={updateField} placeholder={placeholder} type={name === "country" || name === "countryCode" ? "text" : "number"} step={name.includes("inflation") || name.includes("unemployment") ? "0.1" : "1"} /></label>)}</div>
				{formError && <p className="countriesError" role="alert">{formError}</p>}<button className="saveCountryButton" type="submit" disabled={saving}>{saving ? "Saving…" : "Save country"}</button>
			</form>}

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
