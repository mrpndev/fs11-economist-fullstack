const DEV_API_ORIGIN = "http://127.0.0.1:4000";

/**
 * Build an API URL for the current environment.
 *
 * Development uses the local API server. Production uses a relative URL so
 * the browser talks to the API on the same host as the deployed client.
 */
export const apiEndpoint = endpoint => {
	const normalizedEndpoint = endpoint.replace(/^\/+/, "");

	return import.meta.env.PROD
		? `/api/${normalizedEndpoint}`
		: `${DEV_API_ORIGIN}/api/${normalizedEndpoint}`;
};
