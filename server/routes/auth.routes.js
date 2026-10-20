const router = require("express").Router();
const { registerUser, loginUser, resetPassword } = require("../controllers/auth.controller");
const validateSession = require("../middlewares/validate")

router.post("/register", registerUser);

router.post("/login", loginUser);

router.put("/resetpassword", validateSession, resetPassword)

module.exports = router;
