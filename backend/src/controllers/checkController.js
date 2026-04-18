const monitorService = require("../services/monitorService");

const triggerCheck = async (req, res, next) => {
  try {
    const { endpointId } = req.params;
    const result = await monitorService.runCheckForEndpoint(endpointId);

    if (!result) {
      return res.status(404).json({ error: "Endpoint not found." });
    }

    return res.json(result);
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  triggerCheck,
};
