const express = require("express");
const { login, loginFree } = require("../controller/loginController");

const router = express.Router();

router.post("/login", login);
router.post("/free/login", loginFree);

module.exports = router;
