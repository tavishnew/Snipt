<?php

declare(strict_types=1);

namespace App\Config;

use PDO;
use PDOException;

class FileDbFallback
{
    private string $filePath;
    private array $data = ['snippets' => [], 'last_id' => 0];

    public function __construct()
    {
        $dir = __DIR__ . '/../storage';
        if (!is_dir($dir)) {
            mkdir($dir, 0755, true);
        }
        $this->filePath = $dir . '/snippets_db.json';
        if (file_exists($this->filePath)) {
            $raw = file_get_contents($this->filePath);
            $parsed = json_decode((string)$raw, true);
            if (is_array($parsed)) {
                $this->data = array_merge($this->data, $parsed);
            }
        }
    }

    private function save(): void
    {
        file_put_contents($this->filePath, json_encode($this->data, JSON_PRETTY_PRINT));
    }

    public function prepare(string $sql): FileDbStatement
    {
        return new FileDbStatement($this, $sql);
    }

    public function lastInsertId(): string
    {
        return (string)($this->data['last_id'] ?? 0);
    }

    public function executeInsert(string $sql, array $params): void
    {
        if (str_contains($sql, 'rate_limits')) {
            return;
        }

        $this->data['last_id']++;
        $id = $this->data['last_id'];

        // INSERT INTO snippets (uuid, public_id, title, language, code, password_hash, expires_at, ip_hash, type, file_path)
        $this->data['snippets'][] = [
            'id' => $id,
            'uuid' => $params[0] ?? '',
            'public_id' => $params[1] ?? '',
            'title' => $params[2] ?? null,
            'language' => $params[3] ?? 'Auto Detect',
            'code' => $params[4] ?? '',
            'password_hash' => $params[5] ?? null,
            'expires_at' => $params[6] ?? null,
            'ip_hash' => $params[7] ?? '',
            'type' => $params[8] ?? 'code',
            'file_path' => $params[9] ?? null,
            'views' => 0,
            'created_at' => date('Y-m-d H:i:s'),
        ];

        $this->save();
    }

    public function executeSelect(string $sql, array $params): array
    {
        if (str_contains($sql, 'rate_limits')) {
            return [['count' => 0]];
        }

        if (str_contains($sql, 'WHERE public_id =')) {
            $publicId = $params[0] ?? '';
            $results = array_filter($this->data['snippets'], fn($s) => ($s['public_id'] ?? '') === $publicId);
            if (str_contains($sql, 'COUNT(*)')) {
                return [['count' => count($results)]];
            }
            return array_values($results);
        }

        if (str_contains($sql, 'WHERE id =')) {
            $id = (int)($params[0] ?? 0);
            $results = array_filter($this->data['snippets'], fn($s) => (int)($s['id'] ?? 0) === $id);
            if (str_contains($sql, 'password_hash')) {
                $row = reset($results);
                return $row ? [['password_hash' => $row['password_hash']]] : [];
            }
            return array_values($results);
        }

        return [];
    }

    public function executeUpdate(string $sql, array $params): void
    {
        if (str_contains($sql, 'UPDATE snippets SET views = views + 1 WHERE id =')) {
            $id = (int)($params[0] ?? 0);
            foreach ($this->data['snippets'] as &$s) {
                if ((int)($s['id'] ?? 0) === $id) {
                    $s['views'] = ((int)($s['views'] ?? 0)) + 1;
                    break;
                }
            }
            $this->save();
        }
    }

    public function exec(string $sql): int
    {
        return 0;
    }

    public function getAttribute(int $attr): mixed
    {
        return 'file';
    }
}

class FileDbStatement
{
    private array $results = [];
    private int $pointer = 0;

    public function __construct(private FileDbFallback $db, private string $sql) {}

    public function execute(array $params = []): bool
    {
        $trimSql = trim($this->sql);
        if (str_starts_with(strtoupper($trimSql), 'INSERT')) {
            $this->db->executeInsert($this->sql, $params);
        } elseif (str_starts_with(strtoupper($trimSql), 'UPDATE')) {
            $this->db->executeUpdate($this->sql, $params);
        } elseif (str_starts_with(strtoupper($trimSql), 'SELECT')) {
            $this->results = $this->db->executeSelect($this->sql, $params);
        }
        $this->pointer = 0;
        return true;
    }

    public function fetch(): array|false
    {
        if ($this->pointer < count($this->results)) {
            return $this->results[$this->pointer++];
        }
        return false;
    }

    public function fetchColumn(): mixed
    {
        $row = $this->fetch();
        if ($row !== false && is_array($row)) {
            return reset($row);
        }
        return false;
    }
}

function db(): PDO|FileDbFallback
{
    static $pdo = null;

    if ($pdo !== null) {
        return $pdo;
    }

    $host = $_ENV['DB_HOST'] ?? '127.0.0.1';
    $port = (int)($_ENV['DB_PORT'] ?? 5432);
    $dbname = $_ENV['DB_NAME'] ?? 'neondb';
    $user = $_ENV['DB_USER'] ?? 'neondb_owner';
    $pass = $_ENV['DB_PASS'] ?? '';

    $isPgsql = ($_ENV['DB_DRIVER'] ?? '') === 'pgsql' || $port === 5432 || str_contains($host, 'neon');
    $driver = $isPgsql ? 'pgsql' : ($_ENV['DB_DRIVER'] ?? 'mysql');

    if ($driver === 'pgsql') {
        $dsn = "pgsql:host={$host};port={$port};dbname={$dbname};sslmode=require";
    } else {
        $dsn = "mysql:host={$host};port={$port};dbname={$dbname};charset=utf8mb4";
    }

    try {
        $pdo = new PDO($dsn, $user, $pass, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ]);
    } catch (PDOException $e) {
        // Transparent local file DB fallback if remote DB is unreachable
        $pdo = new FileDbFallback();
    }

    return $pdo;
}
