<?php

declare(strict_types=1);

namespace App\Config;

function apply_cors(): void
{
    $frontend = $_ENV['FRONTEND_URL'] ?? 'http://localhost:3000';

    header('Access-Control-Allow-Origin: ' . $frontend);
    header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization');
    header('Access-Control-Max-Age: 86400');

    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        http_response_code(204);
        exit;
    }
}
