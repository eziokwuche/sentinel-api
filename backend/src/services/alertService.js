const nodemailer = require("nodemailer");
require("dotenv").config();
const dbService = require("./dbService");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

const buildAlertSubject = (alertType, endpointName) => {
  if (alertType === "DOWN") {
    return `[Sentinel API] DOWN: ${endpointName}`;
  }

  if (alertType === "DEGRADED") {
    return `[Sentinel API] DEGRADED: ${endpointName}`;
  }

  return `[Sentinel API] RECOVERED: ${endpointName}`;
};

const buildAlertMessage = (endpoint, check, alertType) => {
  if (alertType === "DOWN") {
    return `${endpoint.name} is DOWN. URL: ${endpoint.url}. Status code: ${
      check.status_code ?? "N/A"
    }. Error: ${check.error_message ?? "No error message"}.`;
  }

  if (alertType === "DEGRADED") {
    return `${endpoint.name} is DEGRADED for 3 consecutive checks. URL: ${
      endpoint.url
    }. Latest response time: ${check.response_time_ms}ms.`;
  }

  return `${endpoint.name} has RECOVERED and is UP again. URL: ${endpoint.url}. Latest response time: ${check.response_time_ms}ms.`;
};

const getAlertRecipient = (endpoint) => {
  const override = process.env.ALERT_TO_EMAIL?.trim();
  if (override) {
    return override;
  }
  return endpoint.alert_email?.trim() || null;
};

const sendAlert = async (endpoint, check, alertType) => {
  const message = buildAlertMessage(endpoint, check, alertType);
  await dbService.saveAlert(endpoint.id, alertType, message);

  const to = getAlertRecipient(endpoint);
  if (!to) {
    return {
      sent: false,
      reason: "No alert recipient (set ALERT_TO_EMAIL or endpoint alert_email)",
      message,
    };
  }

  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    return { sent: false, reason: "SMTP credentials missing", message };
  }

  await transporter.sendMail({
    from: process.env.GMAIL_USER,
    to,
    subject: buildAlertSubject(alertType, endpoint.name),
    text: message,
  });

  return { sent: true, message };
};

module.exports = {
  sendAlert,
};
