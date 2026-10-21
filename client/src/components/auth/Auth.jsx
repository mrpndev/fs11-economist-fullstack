import { useState } from "react";
import "./auth.css";
import { useAPIPost } from "../../hooks/useAPIPost";

export default function Auth({ setDebugValues, setToken }) {
	const [fullName, setFullName] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [isLogin, setIsLogin] = useState(false);

	// Calling the hook gives this component its request function and request state.
	const { post, loading, error } = useAPIPost();

	const handleSubmit = async event => {
		// Prevent the browser's default form navigation so React can handle the submit.
		event.preventDefault();

		const endpoint = isLogin ? "login" : "register";
		const body = isLogin
			? { email, password }
			: { full_name: fullName, email, password };

		try {
			// `await` pauses here until the hook returns the server's response.
			const data = await post(endpoint, body, "POST");

			if (data.token) {
				// Keep the token across reloads and update App's state right away.
				localStorage.setItem("token", data.token);
				setToken(data.token);
			}
		} catch {
			// The hook saves the message in `error`, which is displayed below.
			// Catching it here also prevents an unhandled promise error in the console.
		}
	};

	return (
		<form className="form-wrapper" onSubmit={handleSubmit}>
			{!isLogin && (
				<input
					type="text"
					name="full-name"
					id="full_name"
					value={fullName}
					placeholder="Full Name"
					onChange={event => {
						setFullName(event.target.value);
						setDebugValues(event.target.value);
					}}
				/>
			)}
			<input
				type="email"
				name="email"
				id="email"
				value={email}
				placeholder="Enter Email"
				onChange={event => setEmail(event.target.value)}
			/>
			<input
				type="password"
				name="password"
				id="password"
				value={password}
				placeholder="Enter Password"
				onChange={event => setPassword(event.target.value)}
			/>
			<button type="submit" disabled={loading}>
				{loading ? "Submitting..." : "Go"}
			</button>
			<button type="button" onClick={() => setIsLogin(current => !current)}>
				{isLogin ? "Register" : "Login"}
			</button>
			{error && <p role="alert">{error}</p>}
		</form>
	);
}
