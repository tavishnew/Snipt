<?php

declare(strict_types=1);

namespace App\Routes;

use App\Controllers\SnippetController;

function json(int $status, array $data): void
{
    header('Content-Type: application/json');
    http_response_code($status);
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];
$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$path = preg_replace('#^/api#', '', $uri) ?: '/';
$segments = array_values(array_filter(explode('/', $path)));

// /snippets
if (($segments[0] ?? '') === 'snippets') {

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
        if ($method === 'GET') {
            SnippetController::view($publicId);
            exit;
        }
    }

    // /api/snippets/:id/:action
    if (count($segments) === 3) {
        $action = $segments[2];
        if ($action === 'unlock' && $method === 'POST') {
            SnippetController::unlock($publicId);
            exit;
        }
        if ($action === 'download' && $method === 'GET') {
            SnippetController::download($publicId);
            exit;
        }
    }
}

// GET /api/health
if ($method === 'GET' && ($segments[0] ?? '') === 'health') {
    json(200, ['status' => 'ok', 'time' => date('c')]);
}

json(404, ['error' => ['code' => 'NOT_FOUND', 'message' => 'Endpoint not found']]);
