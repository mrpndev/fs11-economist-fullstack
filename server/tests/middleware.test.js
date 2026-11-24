const authValidator = require("../middlewares/authValidator");
const errorHandler = require("../middlewares/errorHandler");
const requireRole = require("../middlewares/requireRole");

const createResponse = () => ({
	status: jest.fn().mockReturnThis(),
	json: jest.fn(),
});

describe("authValidator", () => {
	test("rejects registration with an invalid email", () => {
		const req = { url: "/register", body: { full_name: "Ada", email: "not-an-email", password: "password123" } };
		const res = createResponse();
		const next = jest.fn();

		authValidator(req, res, next);

		expect(res.status).toHaveBeenCalledWith(400);
		expect(res.json).toHaveBeenCalledWith({ message: "Valid email is required" });
		expect(next).not.toHaveBeenCalled();
	});

	test("accepts a valid registration request", () => {
		const req = { url: "/register", body: { full_name: "Ada", email: "ada@example.com", password: "password123" } };
		const res = createResponse();
		const next = jest.fn();

		authValidator(req, res, next);

		expect(next).toHaveBeenCalledTimes(1);
		expect(res.status).not.toHaveBeenCalled();
	});
});

describe("requireRole", () => {
	test("blocks users without an allowed role", () => {
		const req = { user: { role: "viewer" } };
		const res = createResponse();
		const next = jest.fn();

		requireRole("admin")(req, res, next);

		expect(res.status).toHaveBeenCalledWith(403);
		expect(res.json).toHaveBeenCalledWith({ message: "Forbidden" });
		expect(next).not.toHaveBeenCalled();
	});
});

describe("errorHandler", () => {
	test("returns a generic internal error response", () => {
		const res = createResponse();
		const consoleError = jest.spyOn(console, "error").mockImplementation(() => {});

		errorHandler(new Error("database failure"), {}, res, jest.fn());

		expect(res.status).toHaveBeenCalledWith(500);
		expect(res.json).toHaveBeenCalledWith({ message: "Internal Error Occured" });
		consoleError.mockRestore();
	});
});

describe("authValidator non-registration routes", () => {
	test("passes requests that are not registration requests", () => {
		const req = { url: "/login", body: {} };
		const res = createResponse();
		const next = jest.fn();

		authValidator(req, res, next);

		expect(next).toHaveBeenCalledTimes(1);
		expect(res.status).not.toHaveBeenCalled();
	});
});
