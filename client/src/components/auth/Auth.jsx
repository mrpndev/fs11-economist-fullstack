import { useState } from "react";
import "./auth.css";

export default function Auth({ setDebugValues, setToken }) {
	let [fullName, setFullName] = useState("");
	let [email, setEmail] = useState("");
	let [password, setPassword] = useState("");
	let [login, setLogin] = useState(false);

	/* 
		? Conditional Rendering
		* allows us to render parts of UI based on a condition
		* can ONLY use expressions within React's return statement
	*/

	let apiPOST = (e) => {
		let url = login ? "http://127.0.0.1:4000/login" : "http://127.0.0.1:4000/register"
		
		let body = login ? { email, password } : { full_name: fullName, email, password }

		fetch(url, {
			method: "POST",
			body: JSON.stringify(body),
			headers: new Headers({
				"Content-Type": "application/json"
			})
		})
		.then(res => res.json())
		.then(data => {
			console.log(data)
			// set the token each time an auth request is made
			if (data.token) {
				// in local storage
				localStorage.setItem("token", data.token)
				// within the state variable that holds it
				setToken(data.token)
			}
		})
		.catch(err => console.log(err))

		/* 
			? Fetch + POST
			* we can send all types of requests using fetch
			* second parameter has options { }
			* can define method, body, headers, and so on
		*/
	}

	let register = () => login ? null : (
		<input
				type="text"
				name="full-name"
				id="full_name"
				value={fullName}
				placeholder="Full Name"
				onChange={e => {
					setFullName(e.target.value);
					setDebugValues(e.target.value);
				}}
			/>
	)

	return (
		<form
			action=""
			className="form-wrapper"
		>	
			{register()}
			<input
				type="email"
				name="email"
				id="email"
				value={email}
				placeholder="Enter Email"
				onChange={e => setEmail(e.target.value)}
			/>
			<input
				type="text"
				name="password"
				id="password"
				placeholder="Enter Password"
				value={password}
				onChange={e => setPassword(e.target.value)}
			/>
			<button type="button" onClick={apiPOST}>Go</button>
			<button type="button"
				onClick={() => setLogin(!login)}
			>
				{ login ? "Register" : "Login" }
			</button>
		</form>
	);
}

/* 
	? Storing Stuff in the Browser
	* browsers can temporarily store data
	* this data is related to the website(s) or web app(s)
	* accessed iva inspector > application tab
	* these are all examples of client-side cache
	* cookies, session, and local storage can be accessed in JS
	* key:value pairs
	! source of XSS and XSRF attacks

	? three ways to store data in the browser
	* cookie
		* sent to the server with each HTTP request
		* around 4kb size limit
		* expiration configurable
		* shared across tabs (same domain)
		* can be secure (HTTP or HTTPS) but XSS vulnerable
		* slow performance because sent with requests
		* auth, tracking, and server comms
	* session storage
		* not sent to the server
		* 5mb limit
		* expires the moment tab or window is closed
		* available in current tab only
		* XSS vulnerability
		* fast
		* UI state changes (data lists, session, form data)
	* local storage
		* not sent to the server
		* 5mb limit
		* stays around unless cleared
		* shared across same origin tabs
		* XSS vulnerable
		* fast
		* auth, and persistent data such as theme, preferences, tokens, etc
*/