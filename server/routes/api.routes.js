const router = require("express").Router();
const {
	getAll,
	createNew,
	getByCountry,
	updateByID,
	deleteByID,
} = require("../controllers/api.controller");
const requireRole = require("../middlewares/requireRole");

router.get("/all", getAll);

// Any authenticated user can contribute a country observation.
router.post("/new", createNew);

router.get("/:country", getByCountry);

router.put("/:id", requireRole("admin"), updateByID);

router.delete("/:id", requireRole("admin"), deleteByID);

module.exports = router;
