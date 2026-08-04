<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Config\db;
use App\Models\Snippet;
use App\Services\Expiration;
use App\Services\IdGenerator;
use App\Services\RateLimiter;

class SnippetController
{
    private const ALLOWED_LANGUAGES = [
        'Auto Detect', 'JavaScript', 'TypeScript', 'Python', 'PHP',
        'Java', 'Go', 'Rust', 'C++', 'HTML', 'CSS', 'JSON', 'Markdown', 'Text',
    ];
    private const ALLOWED_EXPIRATIONS = ['10m', '1h', '24h', '7d', 'never'];
    private const MAX_CODE_BYTES = 500_000;
    private const MAX_TITLE_LENGTH = 100;
    private const TOKEN_TTL_SECONDS = 900; // 15 min

    private static function ipHash(): string
    {
        return RateLimiter::hashIp();
    }

    private static function respondJson(int $status, array $data): void
    {
        header('Content-Type: application/json');
        http_response_code($status);
        echo json_encode($data, JSON_UNESCAPED_UNICODE);
    }

    private static function validationError(array $fields, string $message = 'Validation failed'): void
    {
        self::respondJson(422, [
            'error' => [
                'code' => 'VALIDATION_ERROR',
                'message' => $message,
                'fields' => $fields,
            ],
        ]);
    }

    public static function create(): void
    {
        $limiter = new RateLimiter(self::ipHash(), 'create');
        if (!$limiter->allow(10, '1 MINUTE')) {
            self::respondJson(429, [
                'error' => ['code' => 'RATE_LIMITED', 'message' => 'Too many requests. Try again later.'],
            ]);
            return;
        }

        $payload = self::readJson();
        $fields = [];

        $code = $payload['code'] ?? null;
        if ($code === null || !is_string($code) || trim($code) === '') {
            $fields['code'] = 'Code is required';
        } elseif (strlen($code) > self::MAX_CODE_BYTES) {
            $fields['code'] = 'Code exceeds 500KB limit';
        }

        $title = $payload['title'] ?? null;
        if (is_string($title) && strlen($title) > self::MAX_TITLE_LENGTH) {
            $fields['title'] = 'Title exceeds 100 characters';
        }
        $title = is_string($title) ? trim($title) : null;
        if ($title === '') {
            $title = null;
        }

        $language = $payload['language'] ?? 'Auto Detect';
        if (!in_array($language, self::ALLOWED_LANGUAGES, true)) {
            $fields['language'] = 'Invalid language';
        }

        $expiration = $payload['expiration'] ?? '24h';
        if (!in_array($expiration, self::ALLOWED_EXPIRATIONS, true)) {
            $fields['expiration'] = 'Invalid expiration';
        }

        $password = $payload['password'] ?? null;
        if (is_string($password) && strlen($password) > 0 && strlen($password) < 4) {
            $fields['password'] = 'Password must be at least 4 characters';
        }

        if ($fields !== []) {
            self::validationError($fields);
            return;
        }

        $passwordHash = null;
        if (is_string($password) && strlen($password) >= 4) {
            $passwordHash = password_hash($password, PASSWORD_BCRYPT);
        }

        try {
            $expiresAt = Expiration::resolve($expiration);
        } catch (\InvalidArgumentException) {
            self::validationError(['expiration' => 'Invalid expiration']);
            return;
        }

        $uuid = self::generateUuid();
        $publicId = IdGenerator::generatePublicId();
        $ipHash = self::ipHash();

        Snippet::create($uuid, $publicId, $title, $language, $code, $passwordHash, $expiresAt, $ipHash);

        $link = ($_ENV['APP_URL'] ?? 'http://localhost:8000') . '/s/' . $publicId;

        self::respondJson(201, [
            'publicId' => $publicId,
            'link' => $link,
        ]);
    }

    public static function view(string $publicId): void
    {
        $limiter = new RateLimiter(self::ipHash(), 'query', $publicId);
        if (!$limiter->allow(30, '1 MINUTE')) {
            self::respondJson(429, [
                'error' => ['code' => 'RATE_LIMITED', 'message' => 'Too many requests. Try again later.'],
            ]);
            return;
        }

        $snippet = Snippet::findByPublicId($publicId);

        if (!$snippet) {
            self::respondJson(404, [
                'error' => ['code' => 'SNIPPET_NOT_FOUND', 'message' => 'Snippet not found'],
            ]);
            return;
        }

        if (Snippet::isExpired($snippet['expires_at'])) {
            self::respondJson(404, [
                'error' => ['code' => 'SNIPPET_EXPIRED', 'message' => 'This snippet has expired'],
            ]);
            return;
        }

        if ($snippet['password_hash'] !== null) {
            $token = self::readAuthToken();
            if (!$token || !self::validateToken($token, $publicId)) {
                self::respondJson(200, ['protected' => true, 'publicId' => $publicId]);
                return;
            }
        }

        Snippet::incrementViews((int)$snippet['id']);

        self::respondJson(200, [
            'title' => $snippet['title'],
            'language' => $snippet['language'],
            'code' => $snippet['code'],
            'createdAt' => $snippet['created_at'],
            'expiresAt' => $snippet['expires_at'],
            'views' => (int)$snippet['views'] + 1,
        ]);
    }

    public static function unlock(string $publicId): void
    {
        $limiter = new RateLimiter(self::ipHash(), 'unlock', $publicId);
        if (!$limiter->allow(5, '10 MINUTES')) {
            self::respondJson(429, [
                'error' => ['code' => 'RATE_LIMITED', 'message' => 'Too many attempts. Try again later.'],
            ]);
            return;
        }

        $snippet = Snippet::findByPublicId($publicId);

        if (!$snippet) {
            self::respondJson(404, [
                'error' => ['code' => 'SNIPPET_NOT_FOUND', 'message' => 'Snippet not found'],
            ]);
            return;
        }

        if (Snippet::isExpired($snippet['expires_at'])) {
            self::respondJson(404, [
                'error' => ['code' => 'SNIPPET_EXPIRED', 'message' => 'This snippet has expired'],
            ]);
            return;
        }

        if ($snippet['password_hash'] === null) {
            // No password required — return code directly
            self::respondJson(200, self::snippetPayload($snippet));
            return;
        }

        $payload = self::readJson();
        $password = $payload['password'] ?? null;

        if (!is_string($password) || strlen($password) === 0) {
            self::respondJson(401, [
                'error' => ['code' => 'INVALID_PASSWORD', 'message' => 'Password is required'],
            ]);
            return;
        }

        if (!Snippet::verifyPassword((int)$snippet['id'], $password)) {
            self::respondJson(401, [
                'error' => ['code' => 'INVALID_PASSWORD', 'message' => 'Invalid password'],
            ]);
            return;
        }

        Snippet::incrementViews((int)$snippet['id']);

        $token = self::signToken($publicId);

        self::respondJson(200, [
            'token' => $token,
            ...self::snippetPayload($snippet),
        ]);
    }

    public static function download(string $publicId): void
    {
        $limiter = new RateLimiter(self::ipHash(), 'download', $publicId);
        if (!$limiter->allow(20, '1 MINUTE')) {
            self::respondJson(429, [
                'error' => ['code' => 'RATE_LIMITED', 'message' => 'Too many requests. Try again later.'],
            ]);
            return;
        }

        $snippet = Snippet::findByPublicId($publicId);

        if (!$snippet) {
            self::respondJson(404, [
                'error' => ['code' => 'SNIPPET_NOT_FOUND', 'message' => 'Snippet not found'],
            ]);
            return;
        }

        if (Snippet::isExpired($snippet['expires_at'])) {
            self::respondJson(404, [
                'error' => ['code' => 'SNIPPET_EXPIRED', 'message' => 'This snippet has expired'],
            ]);
            return;
        }

        if ($snippet['password_hash'] !== null) {
            $token = self::readAuthToken();
            if (!$token || !self::validateToken($token, $publicId)) {
                self::respondJson(401, [
                    'error' => ['code' => 'UNAUTHORIZED', 'message' => 'Password required'],
                ]);
                return;
            }
        }

        $ext = self::extensionFor((string)$snippet['language']);
        $title = $snippet['title'] ?: 'snippet';
        $safeTitle = preg_replace('/[^a-zA-Z0-9_-]/', '_', $title) ?: 'snippet';
        $filename = $safeTitle . '.' . $ext;

        header('Content-Type: text/plain; charset=utf-8');
        header('Content-Disposition: attachment; filename="' . $filename . '"');
        header('X-Content-Type-Options: nosniff');
        echo $snippet['code'];
    }

    // ── helpers ──────────────────────────────────────────────────────────────

    private static function readJson(): array
    {
        $body = file_get_contents('php://input');
        if ($body === false || $body === '') {
            return [];
        }
        $data = json_decode($body, true);
        return is_array($data) ? $data : [];
    }

    private static function generateUuid(): string
    {
        $data = random_bytes(16);
        $data[6] = chr((ord($data[6]) & 0x0f) | 0x40);
        $data[8] = chr((ord($data[8]) & 0x3f) | 0x80);
        return vsprintf('%s%s-%s-%s-%s-%s%s%s', str_split(bin2hex($data), 4));
    }

    private static function signToken(string $publicId): string
    {
        $secret = $_ENV['TOKEN_SECRET'] ?? 'fallback-secret-change-me';
        $expiry = time() + self::TOKEN_TTL_SECONDS;
        $payload = base64_encode($publicId . '|' . $expiry);
        $sig = hash_hmac('sha256', $payload, $secret, true);
        return $payload . '.' . rtrim(strtr(base64_encode($sig), '+/', '-_'), '=');
    }

    private static function validateToken(string $token, string $publicId): bool
    {
        $secret = $_ENV['TOKEN_SECRET'] ?? 'fallback-secret-change-me';

        $parts = explode('.', $token);
        if (count($parts) !== 2) {
            return false;
        }

        [$payloadB64, $sigB64] = $parts;
        $sig = base64_decode(strtr($sigB64, '-_', '+/'), true);
        if ($sig === false) {
            return false;
        }

        $expected = hash_hmac('sha256', $payloadB64, $secret, true);
        if (!hash_equals($expected, $sig)) {
            return false;
        }

        $decoded = base64_decode($payloadB64, true);
        if ($decoded === false) {
            return false;
        }

        [$kid, $expiryStr] = explode('|', (string)$decoded);
        if ($kid !== $publicId || (int)$expiryStr < time()) {
            return false;
        }

        return true;
    }

    private static function readAuthToken(): ?string
    {
        $header = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
        if (preg_match('/^Bearer\s+(\S+)$/', $header, $m)) {
            return $m[1];
        }
        return null;
    }

    private static function snippetPayload(array $snippet): array
    {
        return [
            'title' => $snippet['title'],
            'language' => $snippet['language'],
            'code' => $snippet['code'],
            'createdAt' => $snippet['created_at'],
            'expiresAt' => $snippet['expires_at'],
            'views' => (int)$snippet['views'] + 1,
        ];
    }

    private static function extensionFor(string $language): string
    {
        return match ($language) {
            'JavaScript' => 'js',
            'TypeScript' => 'ts',
            'Python' => 'py',
            'PHP' => 'php',
            'Java' => 'java',
            'Go' => 'go',
            'Rust' => 'rs',
            'C++' => 'cpp',
            'HTML' => 'html',
            'CSS' => 'css',
            'JSON' => 'json',
            'Markdown' => 'md',
            default => 'txt',
        };
    }
}
