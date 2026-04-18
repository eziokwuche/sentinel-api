const express = require("express");
const checkController = require("../controllers/checkController");

const router = express.Router();

router.post("/:endpointId", checkController.triggerCheck);

module.exports = router;
