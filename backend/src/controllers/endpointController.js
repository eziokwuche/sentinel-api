const dbService = require("../services/dbService");
const cronJobs = require("../scheduler/cronJobs");

const createEndpoint = async (req, res, next) => {
  try {
    const {
      name,
      url,
      method = "GET",
      checkIntervalMinutes = 5,
      alertEmail = null,
    } = req.body;

    if (!name || !url) {
      return res.status(400).json({
        error: "Both name and url are required.",
      });
    }

    const newEndpoint = await dbService.createEndpoint(
      name,
      url,
      method,
      checkIntervalMinutes,
      alertEmail
    );

    cronJobs.scheduleEndpoint(newEndpoint);

    return res.status(201).json(newEndpoint);
  } catch (error) {
    return next(error);
  }
};

const getAllEndpoints = async (req, res, next) => {
  try {
    const endpoints = await dbService.getAllEndpoints();
    return res.json(endpoints);
  } catch (error) {
    return next(error);
  }
};

const getEndpointById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const endpoint = await dbService.getEndpointById(id);

    if (!endpoint) {
      return res.status(404).json({ error: "Endpoint not found." });
    }

    return res.json(endpoint);
  } catch (error) {
    return next(error);
  }
};

const updateEndpoint = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = {};

    if (req.body.name !== undefined) updates.name = req.body.name;
    if (req.body.url !== undefined) updates.url = req.body.url;
    if (req.body.method !== undefined) updates.method = req.body.method;
    if (req.body.checkIntervalMinutes !== undefined) {
      updates.check_interval_minutes = req.body.checkIntervalMinutes;
    }
    if (req.body.alertEmail !== undefined) updates.alert_email = req.body.alertEmail;
    if (req.body.isActive !== undefined) updates.is_active = req.body.isActive;

    const endpoint = await dbService.updateEndpoint(id, updates);

    if (!endpoint) {
      return res.status(404).json({ error: "Endpoint not found." });
    }

    return res.json(endpoint);
  } catch (error) {
    return next(error);
  }
};

const deleteEndpoint = async (req, res, next) => {
  try {
    const { id } = req.params;
    const deleted = await dbService.deleteEndpoint(id);

    if (!deleted) {
      return res.status(404).json({ error: "Endpoint not found." });
    }

    cronJobs.removeEndpointJob(id);

    return res.json({ message: "Endpoint deleted successfully." });
  } catch (error) {
    return next(error);
  }
};

const getEndpointStats = async (req, res, next) => {
  try {
    const { id } = req.params;
    const endpoint = await dbService.getEndpointById(id);

    if (!endpoint) {
      return res.status(404).json({ error: "Endpoint not found." });
    }

    const stats = await dbService.getEndpointStats(id);
    return res.json(stats);
  } catch (error) {
    return next(error);
  }
};

const getEndpointHistory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const endpoint = await dbService.getEndpointById(id);

    if (!endpoint) {
      return res.status(404).json({ error: "Endpoint not found." });
    }

    const history = await dbService.getEndpointHistory(id, 100);
    return res.json(history);
  } catch (error) {
    return next(error);
  }
};

const getDashboard = async (req, res, next) => {
  try {
    const summary = await dbService.getDashboardSummary();
    return res.json(summary);
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  createEndpoint,
  getAllEndpoints,
  getEndpointById,
  updateEndpoint,
  deleteEndpoint,
  getEndpointStats,
  getEndpointHistory,
  getDashboard,
};
