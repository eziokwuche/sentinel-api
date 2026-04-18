const dbService = require("./dbService");
const alertService = require("./alertService");

const fetch = (...args) =>
  import("node-fetch").then(({ default: nodeFetch }) => nodeFetch(...args));

const sendAlertWithDebug = async (endpoint, savedCheck, alertType) => {
  try {
    console.log(
      `[monitorService] Sending ${alertType} alert for endpoint ${endpoint.id} (${endpoint.name})`
    );
    const alertResult = await alertService.sendAlert(endpoint, savedCheck, alertType);
    console.log("[monitorService] sendAlert result:", alertResult);
  } catch (error) {
    console.error(
      `[monitorService] sendAlert/saveAlert failed for ${alertType} on endpoint ${endpoint.id}:`,
      error.message
    );
    console.error(error);
  }
};

const checkEndpoint = async (endpoint) => {
  const previousCheck = await dbService.getLastCheckForEndpoint(endpoint.id);
  console.log(
    `[monitorService] Previous check status for endpoint ${endpoint.id}:`,
    previousCheck?.status || "none"
  );

  const startTime = Date.now();
  let status = "DOWN";
  let statusCode = null;
  let responseTimeMs = null;
  let errorMessage = null;

  try {
    const response = await fetch(endpoint.url, { method: endpoint.method });
    responseTimeMs = Date.now() - startTime;
    statusCode = response.status;

    if (statusCode >= 200 && statusCode <= 299) {
      status = responseTimeMs > 2000 ? "DEGRADED" : "UP";
    } else {
      status = "DOWN";
      errorMessage = `Received non-success status code: ${statusCode}`;
    }
  } catch (error) {
    responseTimeMs = Date.now() - startTime;
    status = "DOWN";
    errorMessage = error.message;
  }

  const savedCheck = await dbService.saveHealthCheck(
    endpoint.id,
    status,
    statusCode,
    responseTimeMs,
    errorMessage
  );

  console.log("[monitorService] Current check status after saving:", savedCheck.status);

  const isCurrentDown = savedCheck.status === "DOWN";
  const hasNoPreviousCheck = !previousCheck;
  const previousWasNotDown = previousCheck?.status !== "DOWN";
  const shouldTriggerDownAlert = isCurrentDown && (hasNoPreviousCheck || previousWasNotDown);
  console.log("[monitorService] DOWN alert condition triggered:", shouldTriggerDownAlert);

  if (shouldTriggerDownAlert) {
    await sendAlertWithDebug(endpoint, savedCheck, "DOWN");
  }

  if (status === "DEGRADED") {
    const recentChecks = await dbService.getRecentChecksForEndpoint(endpoint.id, 3);
    const isThreeConsecutiveDegraded =
      recentChecks.length === 3 && recentChecks.every((check) => check.status === "DEGRADED");

    if (isThreeConsecutiveDegraded) {
      await sendAlertWithDebug(endpoint, savedCheck, "DEGRADED");
    }
  }

  if (
    status === "UP" &&
    previousCheck &&
    (previousCheck.status === "DOWN" || previousCheck.status === "DEGRADED")
  ) {
    await sendAlertWithDebug(endpoint, savedCheck, "RECOVERED");
  }

  return savedCheck;
};

const runCheckForEndpoint = async (endpointId) => {
  const endpoint = await dbService.getEndpointById(endpointId);

  if (!endpoint) {
    return null;
  }

  const result = await checkEndpoint(endpoint);
  return result;
};

module.exports = {
  checkEndpoint,
  runCheckForEndpoint,
};
