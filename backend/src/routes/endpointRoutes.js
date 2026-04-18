const express = require("express");
const endpointController = require("../controllers/endpointController");

const router = express.Router();

router.post("/", endpointController.createEndpoint);
router.get("/", endpointController.getAllEndpoints);
router.get("/:id/stats", endpointController.getEndpointStats);
router.get("/:id/history", endpointController.getEndpointHistory);
router.get("/:id", endpointController.getEndpointById);
router.put("/:id", endpointController.updateEndpoint);
router.delete("/:id", endpointController.deleteEndpoint);

module.exports = router;
