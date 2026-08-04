<?php

declare(strict_types=1);

namespace App\Services;

use App\Config\db;

class RateLimiter
{
    public function __construct(
        private readonly string $ipHash,
        private readonly string $route,
        private readonly ?string $snippetId = null,
    ) {}

    public function allow(int $max, string $interval): bool
    {
        $pdo = db();

        $stmt = $pdo->prepare(
            'SELECT COUNT(*) FROM rate_limits WHERE ip_hash = ? AND route = ? AND created_at > NOW() - INTERVAL ?'
        );
        $stmt->execute([$this->ipHash, $this->route, $interval]);
        $count = (int)$stmt->fetchColumn();

        if ($count >= $max) {
            return false;
        }

        $this->record();
        return true;
    }

    public function remaining(int $max, string $interval): int
    {
        $pdo = db();
        $stmt = $pdo->prepare(
            'SELECT COUNT(*) FROM rate_limits WHERE ip_hash = ? AND route = ? AND created_at > NOW() - INTERVAL ?'
        );
        $stmt->execute([$this->ipHash, $this->route, $interval]);
        $count = (int)$stmt->fetchColumn();
        return max(0, $max - $count);
    }

    private function record(): void
    {
        $pdo = db();
        $stmt = $pdo->prepare(
            'INSERT INTO rate_limits (ip_hash, route, snippet_public_id) VALUES (?, ?, ?)'
        );
        $stmt->execute([$this->ipHash, $this->route, $this->snippetId]);
    }

    public static function hashIp(): string
    {
        $pepper = $_ENV['IP_PEPPER'] ?? '';
        $addr = $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
        return hash('sha256', $addr . $pepper);
    }
}
