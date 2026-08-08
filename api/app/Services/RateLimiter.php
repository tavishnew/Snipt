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

    private const ALLOWED_INTERVALS = [
        '1 MINUTE' => "INTERVAL '1 minute'",
        '10 MINUTES' => "INTERVAL '10 minutes'",
    ];

    private function validateInterval(string $interval): string
    {
        $upper = strtoupper($interval);
        return array_key_exists($upper, self::ALLOWED_INTERVALS) ? $upper : '1 MINUTE';
    }

    private function getIntervalLiteral(string $interval): string
    {
        $safe = $this->validateInterval($interval);
        return self::ALLOWED_INTERVALS[$safe];
    }

    private function getIntervalParam(string $interval): string
    {
        $safeInterval = $this->validateInterval($interval);
        return match ($safeInterval) {
            '1 MINUTE' => '-1 minute',
            '10 MINUTES' => '-10 minutes',
            default => '-1 minute',
        };
    }

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
                $intervalParam = $this->getIntervalParam($interval);
                $stmt = $pdo->prepare('SELECT COUNT(*) FROM rate_limits WHERE ip_hash = ? AND route = ? AND created_at > datetime(\'now\', ?)');
                $stmt->execute([$this->ipHash, $this->route, $intervalParam]);
            } else {
                $intervalLiteral = $this->getIntervalLiteral($interval);
                $stmt = $pdo->prepare("SELECT COUNT(*) FROM rate_limits WHERE ip_hash = ? AND route = ? AND created_at > NOW() - {$intervalLiteral}");
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
            $driver = $pdo->getAttribute(\PDO::ATTR_DRIVER_NAME);

            if ($driver === 'sqlite') {
                $intervalParam = $this->getIntervalParam($interval);
                $stmt = $pdo->prepare('SELECT COUNT(*) FROM rate_limits WHERE ip_hash = ? AND route = ? AND created_at > datetime(\'now\', ?)');
                $stmt->execute([$this->ipHash, $this->route, $intervalParam]);
            } else {
                $intervalLiteral = $this->getIntervalLiteral($interval);
                $stmt = $pdo->prepare("SELECT COUNT(*) FROM rate_limits WHERE ip_hash = ? AND route = ? AND created_at > NOW() - {$intervalLiteral}");
                $stmt->execute([$this->ipHash, $this->route]);
            }

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
