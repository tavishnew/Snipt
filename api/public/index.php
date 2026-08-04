<?php

declare(strict_types=1);

// ── Bootstrap ──────────────────────────────────────────────────────────────

$autoload = __DIR__ . '/../vendor/autoload.php';
if (file_exists($autoload)) {
    require $autoload;
}

// Load .env if present (no framework, no dotenv lib — kept to 3 lines)
$envFile = __DIR__ . '/../.env';
if (file_exists($envFile)) {
    $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (str_starts_with($line, '#') || !str_contains($line, '=')) {
            continue;
        }
        [$k, $v] = explode('=', $line, 2);
        $k = trim($k);
        $v = trim($v);
        if (!isset($_ENV[$k])) {
            $_ENV[$k] = $v;
        }
    }
}

use App\Config\apply_cors;
use App\Config\apply_security_headers;
use App\Config\db;
use App\Controllers\SnippetController;
use App\Middleware\JsonBodyParser;
use App\Middleware\RateLimitMiddleware;

apply_cors();
apply_security_headers();

// ── JSON sink (reads php://input once, stores in request attr) ──────────────

$bodyRaw = file_get_contents('php://input');
$requestBody = [];
if ($bodyRaw !== false && $bodyRaw !== '') {
    $decoded = json_decode($bodyRaw, true);
    if (is_array($decoded)) {
        $requestBody = $decoded;
    }
}

// Lazy DB — fails closed (returns 500) if not reachable, so routing doesn't crash
$pdo = null;
try {
    $pdo = db();
} catch (\Throwable $e) {
    // db() already emitted a 500 response
    exit;
}

// ── Routing (manual, no framework) ─────────────────────────────────────────

$method = $_SERVER['REQUEST_METHOD'];
$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

// Strip API prefix
$path = preg_replace('#^/api#', '', $uri) ?: '/';
$segments = array_values(array_filter(explode('/', $path)));

// Default response for unknown routes
http_response_code(404);
header('Content-Type: application/json');
echo json_encode(['error' => ['code' => 'NOT_FOUND', 'message' => 'Endpoint not found']], JSON_UNESCAPED_UNICODE);
exit;
