CREATE TABLE IF NOT EXISTS rate_limits (
  id BIGSERIAL PRIMARY KEY,
  ip_hash VARCHAR(64) NOT NULL,
  route VARCHAR(50) NOT NULL,
  snippet_public_id CHAR(8) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_rate_limits_lookup ON rate_limits (ip_hash, route, created_at);
