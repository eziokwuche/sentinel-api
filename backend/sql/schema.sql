CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS endpoints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  url TEXT NOT NULL,
  method VARCHAR(10) DEFAULT 'GET',
  check_interval_minutes INTEGER DEFAULT 5,
  alert_email VARCHAR(255),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS health_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  endpoint_id UUID REFERENCES endpoints(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL,
  status_code INTEGER,
  response_time_ms INTEGER,
  error_message TEXT,
  checked_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  endpoint_id UUID REFERENCES endpoints(id) ON DELETE CASCADE,
  alert_type VARCHAR(50) NOT NULL,
  message TEXT,
  sent_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS endpoint_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  endpoint_id UUID REFERENCES endpoints(id) ON DELETE CASCADE,
  uptime_percentage DECIMAL(5,2),
  avg_response_time_ms INTEGER,
  total_checks INTEGER DEFAULT 0,
  total_downtime_minutes INTEGER DEFAULT 0,
  last_calculated_at TIMESTAMP DEFAULT NOW()
);
