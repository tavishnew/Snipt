<?php

declare(strict_types=1);

namespace App\Services;

use function App\Config\db;

class IdGenerator
{
    private const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    private const LENGTH = 8;
    private const MAX_ATTEMPTS = 5;

    public static function generatePublicId(): string
    {
        for ($attempt = 0; $attempt < self::MAX_ATTEMPTS; $attempt++) {
            $bytes = random_bytes(self::LENGTH);
            $id = '';
            for ($i = 0; $i < self::LENGTH; $i++) {
                $id .= self::ALPHABET[ord($bytes[$i]) % strlen(self::ALPHABET)];
            }

            $exists = self::exists($id);
            if (!$exists) {
                return $id;
            }
        }

        throw new \RuntimeException('Failed to generate unique public ID after ' . self::MAX_ATTEMPTS . ' attempts');
    }

    private static function exists(string $id): bool
    {
        $stmt = db()->prepare('SELECT COUNT(*) FROM snippets WHERE public_id = ?');
        $stmt->execute([$id]);
        return (int)$stmt->fetchColumn() > 0;
    }
}
