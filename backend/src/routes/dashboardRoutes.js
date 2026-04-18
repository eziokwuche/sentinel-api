const express = require("express");
const endpointController = require("../controllers/endpointController");

const router = express.Router();

router.get("/", endpointController.getDashboard);

module.exports = router;
