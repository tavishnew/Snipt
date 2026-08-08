<?php

declare(strict_types=1);

namespace App\Services;

use function App\Config\db;

class RateLimiter
{
    public function __construct(
        private readonly string $ipHash,
        private readonly string $route,
        private readonly ?string $snippetId = null,
    ) {}

    public function allow(int $max, string $interval): bool
    {
        try {
            $pdo = db();
            $driver = $pdo->getAttribute(\PDO::ATTR_DRIVER_NAME);

            if ($driver === 'sqlite') {
                $pdo->exec("CREATE TABLE IF NOT EXISTS rate_limits (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    ip_hash VARCHAR(64) NOT NULL,
                    route VARCHAR(50) NOT NULL,
                    snippet_public_id VARCHAR(8) NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )");
                $stmt = $pdo->prepare('SELECT COUNT(*) FROM rate_limits WHERE ip_hash = ? AND route = ?');
                $stmt->execute([$this->ipHash, $this->route]);
            } else {
                $stmt = $pdo->prepare('SELECT COUNT(*) FROM rate_limits WHERE ip_hash = ? AND route = ? AND created_at > NOW() - INTERVAL 1 MINUTE');
                $stmt->execute([$this->ipHash, $this->route]);
            }

            $count = (int)$stmt->fetchColumn();

            if ($count >= $max) {
                return false;
            }

            $this->record();
            return true;
        } catch (\Throwable $e) {
            return true;
        }
    }

    public function remaining(int $max, string $interval): int
    {
        try {
            $pdo = db();
            $stmt = $pdo->prepare('SELECT COUNT(*) FROM rate_limits WHERE ip_hash = ? AND route = ?');
            $stmt->execute([$this->ipHash, $this->route]);
            $count = (int)$stmt->fetchColumn();
            return max(0, $max - $count);
        } catch (\Throwable $e) {
            return $max;
        }
    }

    private function record(): void
    {
        try {
            $pdo = db();
            $stmt = $pdo->prepare(
                'INSERT INTO rate_limits (ip_hash, route, snippet_public_id) VALUES (?, ?, ?)'
            );
            $stmt->execute([$this->ipHash, $this->route, $this->snippetId]);
        } catch (\Throwable $e) {
            // ignore failure to record rate limit
        }
    }

    public static function hashIp(): string
    {
        $pepper = $_ENV['IP_PEPPER'] ?? '';
        $addr = $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
        return hash('sha256', $addr . $pepper);
    }
}
