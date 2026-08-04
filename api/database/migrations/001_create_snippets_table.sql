CREATE TABLE IF NOT EXISTS snippets (
  id BIGSERIAL PRIMARY KEY,
  uuid CHAR(36) NOT NULL UNIQUE,
  public_id CHAR(8) NOT NULL UNIQUE,
  title VARCHAR(100) NULL,
  language VARCHAR(20) NOT NULL DEFAULT 'Auto Detect',
  code TEXT NOT NULL,
  password_hash VARCHAR(255) NULL,
  expires_at TIMESTAMP NULL,
  views INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  ip_hash VARCHAR(64) NULL
);
CREATE INDEX IF NOT EXISTS idx_snippets_expires ON snippets (expires_at);
CREATE INDEX IF NOT EXISTS idx_snippets_ip_created ON snippets (ip_hash, created_at);
