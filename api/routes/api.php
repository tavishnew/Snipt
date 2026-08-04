<?php

declare(strict_types=1);

// This file is include'd from public/index.php and must call exit after dispatch.

namespace App\Routes;

use App\Controllers\SnippetController;
use App\Middleware\JsonBodyParser;
use App\Middleware\RateLimitMiddleware;

// ── helpers ────────────────────────────────────────────────────────────────

function body(): array
{
    static $cache = null;
    if ($cache === null) {
        $raw = file_get_contents('php://input');
        $cache = [];
        if ($raw !== false && $raw !== '') {
            $d = json_decode($raw, true);
            if (is_array($d)) {
                $cache = $d;
            }
        }
    }
    return $cache;
}

function json(int $status, array $data): void
{
    header('Content-Type: application/json');
    http_response_code($status);
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

// ── actual router ──────────────────────────────────────────────────────────

$method = $_SERVER['REQUEST_METHOD'];
$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$path = preg_replace('#^/api#', '', $uri) ?: '/';
$segments = array_values(array_filter(explode('/', $path)));

// /snippets
if ($segments[0] ?? '' === 'snippets') {

    // POST /api/snippets — create
    if ($method === 'POST' && count($segments) === 1) {
        SnippetController::create();
        exit;
    }

    $publicId = $segments[1] ?? null;
    if ($publicId === null) {
        json(404, ['error' => ['code' => 'NOT_FOUND', 'message' => 'Missing snippet ID']]);
    }

    // /api/snippets/:id
    if (count($segments) === 2) {

        // GET — view / protected check
        if ($method === 'GET') {
            SnippetController::view($publicId);
            exit;
        }

        // POST /api/snippets/:id/unlock
        if ($method === 'POST') {
            $action = $segments[2] ?? null;
            if ($action === 'unlock') {
                SnippetController::unlock($publicId);
                exit;
            }
        }

        // GET /api/snippets/:id/download
        if ($method === 'GET' && ($segments[2] ?? '') === 'download') {
            SnippetController::download($publicId);
            exit;
        }
    }
}

// health (useful for uptime probes)
if ($method === 'GET' && ($segments[0] ?? '') === 'health') {
    json(200, ['status' => 'ok', 'time' => date('c')]);
}

// catch-all 404
json(404, ['error' => ['code' => 'NOT_FOUND', 'message' => 'Endpoint not found']]);
