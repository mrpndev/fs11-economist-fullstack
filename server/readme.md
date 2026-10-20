# Economics of Countries API

An Express practice project for building a country economics API using an MVC structure, route controllers, middleware, and reusable helpers.

## The Challenge

Build the foundation of an API that supports user registration, login, and country management.

- Organize the server using MVC conventions and helper functions.
- Install dependencies and configure environment variables.
- Keep authentication routes in `controllers/authRoutes.js` and country routes in `controllers/routes.js`.
- Implement the endpoints below and test each one in Postman.

## Getting Started

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create a `.env` file in the project root:

   ```dotenv
   HOST=127.0.0.1
   PORT=3000
   ```

3. Start the development server:

   ```bash
   npm run dev
   ```

   The API will be available at `http://127.0.0.1:3000`. Use `npm start` to run without automatic restarts.

## API Endpoints

These are the target endpoints for the challenge. The project is currently a starter implementation.

| Method | Endpoint | Purpose | Current status |
| --- | --- | --- | --- |
| `POST` | `/register` | Register a user | Placeholder response with input validation |
| `POST` | `/login` | Log in a user | Placeholder response |
| `GET` | `/all` | Get all countries | Returns a test response |
| `POST` | `/new` | Add a country | Appends the request body to an in-memory array |
| `GET` | `/:country` | Get one country | To do |
| `PUT` | `/:id` | Update a country | To do |
| `DELETE` | `/:id` | Delete a country | To do |

Country data is stored in memory and resets when the server restarts. Registration and login do not yet persist users or authenticate requests.

## Project Structure

```text
app.js          # Server entry point and middleware setup
controllers/    # Authentication and country routes
helpers/        # Shared error handler
middlewares/    # Custom headers and rate limiting
models/         # Reserved for data models
validators/     # Registration input validation
```

## Testing with Postman

- Use the configured host and port as your base URL.
- Send JSON request bodies with `Content-Type: application/json`.
- For `/register`, include `fullName`, a valid `email`, `address`, and a `password` of at least eight characters.
- Check response bodies and status codes for each implemented route.
- If you receive `429 Too Many Requests`, wait at least 10 seconds before retrying.

Automated tests are not configured yet; `npm test` currently exits with a placeholder error.
