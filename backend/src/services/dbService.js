const pool = require("../config/db");

const createEndpoint = async (
  name,
  url,
  method = "GET",
  checkIntervalMinutes = 5,
  alertEmail = null
) => {
  const query = `
    INSERT INTO endpoints (name, url, method, check_interval_minutes, alert_email)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *;
  `;

  const values = [name, url, method, checkIntervalMinutes, alertEmail];
  const result = await pool.query(query, values);
  return result.rows[0];
};

const getAllEndpoints = async () => {
  const query = `
    SELECT *
    FROM endpoints
    ORDER BY created_at DESC;
  `;

  const result = await pool.query(query);
  return result.rows;
};

const getActiveEndpoints = async () => {
  const query = `
    SELECT *
    FROM endpoints
    WHERE is_active = true
    ORDER BY created_at DESC;
  `;

  const result = await pool.query(query);
  return result.rows;
};

const getEndpointById = async (id) => {
  const query = `
    SELECT e.*,
      COALESCE(
        (
          SELECT json_agg(hc ORDER BY hc.checked_at DESC)
          FROM (
            SELECT id, endpoint_id, status, status_code, response_time_ms, error_message, checked_at
            FROM health_checks
            WHERE endpoint_id = e.id
            ORDER BY checked_at DESC
            LIMIT 10
          ) hc
        ),
        '[]'::json
      ) AS recent_checks
    FROM endpoints e
    WHERE e.id = $1;
  `;

  const result = await pool.query(query, [id]);
  return result.rows[0] || null;
};

const updateEndpoint = async (id, fields) => {
  const updates = [];
  const values = [];
  let paramIndex = 1;

  Object.entries(fields).forEach(([key, value]) => {
    if (value !== undefined) {
      updates.push(`${key} = $${paramIndex}`);
      values.push(value);
      paramIndex += 1;
    }
  });

  if (updates.length === 0) {
    return getEndpointById(id);
  }

  const query = `
    UPDATE endpoints
    SET ${updates.join(", ")}
    WHERE id = $${paramIndex}
    RETURNING *;
  `;

  values.push(id);
  const result = await pool.query(query, values);
  return result.rows[0] || null;
};

const deleteEndpoint = async (id) => {
  const query = `
    DELETE FROM endpoints
    WHERE id = $1
    RETURNING id;
  `;

  const result = await pool.query(query, [id]);
  return result.rows[0] || null;
};

const saveHealthCheck = async (
  endpointId,
  status,
  statusCode = null,
  responseTimeMs = null,
  errorMessage = null
) => {
  const query = `
    INSERT INTO health_checks (endpoint_id, status, status_code, response_time_ms, error_message)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *;
  `;

  const values = [endpointId, status, statusCode, responseTimeMs, errorMessage];
  const result = await pool.query(query, values);
  return result.rows[0];
};

const getLastCheckForEndpoint = async (endpointId) => {
  const query = `
    SELECT *
    FROM health_checks
    WHERE endpoint_id = $1
    ORDER BY checked_at DESC
    LIMIT 1;
  `;

  const result = await pool.query(query, [endpointId]);
  return result.rows[0] || null;
};

const getRecentChecksForEndpoint = async (endpointId, limit = 3) => {
  const query = `
    SELECT *
    FROM health_checks
    WHERE endpoint_id = $1
    ORDER BY checked_at DESC
    LIMIT $2;
  `;

  const result = await pool.query(query, [endpointId, limit]);
  return result.rows;
};

const saveAlert = async (endpointId, alertType, message) => {
  const query = `
    INSERT INTO alerts (endpoint_id, alert_type, message)
    VALUES ($1, $2, $3)
    RETURNING *;
  `;

  const values = [endpointId, alertType, message];
  const result = await pool.query(query, values);
  return result.rows[0];
};

const getEndpointStats = async (endpointId) => {
  const query = `
    SELECT
      e.id AS endpoint_id,
      e.name,
      COUNT(hc.id)::INTEGER AS total_checks,
      COALESCE(
        ROUND(
          (
            SUM(CASE WHEN hc.status = 'UP' THEN 1 ELSE 0 END)::DECIMAL
            / NULLIF(COUNT(hc.id), 0)
          ) * 100,
          2
        ),
        0
      ) AS uptime_percentage,
      COALESCE(ROUND(AVG(hc.response_time_ms), 0), 0)::INTEGER AS avg_response_time_ms
    FROM endpoints e
    LEFT JOIN health_checks hc ON hc.endpoint_id = e.id
    WHERE e.id = $1
    GROUP BY e.id, e.name;
  `;

  const result = await pool.query(query, [endpointId]);
  return result.rows[0] || null;
};

const getEndpointHistory = async (endpointId, limit = 100) => {
  const query = `
    SELECT id, endpoint_id, status, status_code, response_time_ms, error_message, checked_at
    FROM health_checks
    WHERE endpoint_id = $1
    ORDER BY checked_at DESC
    LIMIT $2;
  `;

  const result = await pool.query(query, [endpointId, limit]);
  return result.rows;
};

const getDashboardSummary = async () => {
  const query = `
    SELECT
      e.id,
      e.name,
      e.url,
      e.method,
      e.is_active,
      latest.status AS current_status,
      latest.status_code AS current_status_code,
      latest.response_time_ms AS current_response_time_ms,
      latest.checked_at AS last_checked_at,
      COUNT(hc.id)::INTEGER AS total_checks,
      COALESCE(
        ROUND(
          (
            SUM(CASE WHEN hc.status = 'UP' THEN 1 ELSE 0 END)::DECIMAL
            / NULLIF(COUNT(hc.id), 0)
          ) * 100,
          2
        ),
        0
      ) AS uptime_percentage,
      COALESCE(ROUND(AVG(hc.response_time_ms), 0), 0)::INTEGER AS avg_response_time_ms
    FROM endpoints e
    LEFT JOIN health_checks hc ON hc.endpoint_id = e.id
    LEFT JOIN LATERAL (
      SELECT status, status_code, response_time_ms, checked_at
      FROM health_checks
      WHERE endpoint_id = e.id
      ORDER BY checked_at DESC
      LIMIT 1
    ) latest ON true
    GROUP BY
      e.id,
      e.name,
      e.url,
      e.method,
      e.is_active,
      latest.status,
      latest.status_code,
      latest.response_time_ms,
      latest.checked_at
    ORDER BY e.created_at DESC;
  `;

  const result = await pool.query(query);
  return result.rows;
};

module.exports = {
  createEndpoint,
  getAllEndpoints,
  getActiveEndpoints,
  getEndpointById,
  updateEndpoint,
  deleteEndpoint,
  saveHealthCheck,
  getLastCheckForEndpoint,
  getRecentChecksForEndpoint,
  saveAlert,
  getEndpointStats,
  getEndpointHistory,
  getDashboardSummary,
};
