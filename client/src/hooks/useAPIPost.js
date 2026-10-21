import { useState } from "react";

// A custom hook is a JavaScript function that can use React hooks and share
// reusable behavior between components. The `use` prefix lets React recognize it.
export const useAPIPost = () => {
	// These state values belong to the component that calls this hook.
	// Updating them causes that component to render again with the new values.
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState(null);

	const post = async (endpoint, body, method) => {
		setLoading(true);
		setError(null); // A new request should not keep showing an old error.

		try {
			const response = await fetch(`http://127.0.0.1:4000/${endpoint}`, {
				method: method,
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(body),
			});

			const data = await response.json();

			// fetch only rejects for network problems, so check the HTTP status too.
			if (!response.ok) {
				throw new Error(data.message || "Request failed");
			}

			return data; // The component can use the successful response (for example, its token).
		} catch (requestError) {
			setError(requestError.message);
			throw requestError; // Let the component know the request did not succeed.
		} finally {
			// This runs after success or failure, so the loading indicator always ends.
			setLoading(false);
		}
	};

	// Returning these values makes them available wherever the hook is used.
	return { post, loading, error };
};
