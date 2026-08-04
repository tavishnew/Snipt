<?php

declare(strict_types=1);

namespace App\Services;

class Expiration
{
    private const ALLOWED = ['10m', '1h', '24h', '7d', 'never'];

    public static function resolve(string $code): ?string
    {
        if (!in_array($code, self::ALLOWED, true)) {
            throw new \InvalidArgumentException('Invalid expiration code');
        }

        return match ($code) {
            '10m' => date('Y-m-d H:i:s', time() + 10 * 60),
            '1h' => date('Y-m-d H:i:s', time() + 60 * 60),
            '24h' => date('Y-m-d H:i:s', time() + 24 * 60 * 60),
            '7d' => date('Y-m-d H:i:s', time() + 7 * 24 * 60 * 60),
            'never' => null,
        };
    }
}
