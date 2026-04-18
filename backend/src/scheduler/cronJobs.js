const cron = require("node-cron");
const monitorService = require("../services/monitorService");
const dbService = require("../services/dbService");

const activeJobs = new Map();

const scheduleEndpoint = (endpoint) => {
  if (!endpoint || !endpoint.id) {
    return;
  }

  removeEndpointJob(endpoint.id);

  const interval = Number(endpoint.check_interval_minutes) || 5;
  const safeInterval = interval > 0 ? interval : 5;
  const expression = `*/${safeInterval} * * * *`;

  const job = cron.schedule(expression, async () => {
    console.log(
      `Running scheduled check for endpoint ${endpoint.id} at ${new Date().toISOString()}`
    );

    try {
      await monitorService.runCheckForEndpoint(endpoint.id);
    } catch (error) {
      console.error(`Scheduled check failed for endpoint ${endpoint.id}:`, error.message);
    }
  });

  activeJobs.set(endpoint.id, job);
};

const removeEndpointJob = (endpointId) => {
  const existingJob = activeJobs.get(endpointId);

  if (!existingJob) {
    return;
  }

  existingJob.stop();
  activeJobs.delete(endpointId);
};

const initializeScheduler = async () => {
  const activeEndpoints = await dbService.getActiveEndpoints();

  activeEndpoints.forEach((endpoint) => {
    scheduleEndpoint(endpoint);
  });

  console.log(`Scheduler initialized. ${activeEndpoints.length} endpoint(s) scheduled.`);
};

module.exports = {
  scheduleEndpoint,
  removeEndpointJob,
  initializeScheduler,
};
