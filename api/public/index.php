<?php

declare(strict_types=1);

// ── Bootstrap ──────────────────────────────────────────────────────────────

$autoload = __DIR__ . '/../vendor/autoload.php';
if (file_exists($autoload)) {
    require $autoload;
}

// Load .env if present
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

// Require config files containing procedural helper functions
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/security_headers.php';
require_once __DIR__ . '/../config/database.php';

\App\Config\apply_cors();
\App\Config\apply_security_headers();

// ── Load & Dispatch API Routes ──────────────────────────────────────────────

require_once __DIR__ . '/../routes/api.php';
