<?php

declare(strict_types=1);

namespace App\Models;

use function App\Config\db;

class Snippet
{
    public static function create(
        string $uuid,
        string $publicId,
        ?string $title,
        string $language,
        string $code,
        ?string $passwordHash,
        ?string $expiresAt,
        string $ipHash,
        string $type = 'code',
        ?string $filePath = null
    ): int {
        $stmt = db()->prepare(
            'INSERT INTO snippets (uuid, public_id, title, language, code, password_hash, expires_at, ip_hash, type, file_path)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
        );
        $stmt->execute([
            $uuid,
            $publicId,
            $title,
            $language,
            $code,
            $passwordHash,
            $expiresAt,
            $ipHash,
            $type,
            $filePath,
        ]);

        return (int)db()->lastInsertId();
    }

    public static function findByPublicId(string $publicId): ?array
    {
        $stmt = db()->prepare('SELECT * FROM snippets WHERE public_id = ?');
        $stmt->execute([$publicId]);
        $row = $stmt->fetch();
        return $row !== false ? $row : null;
    }

    public static function isExpired(?string $expiresAt): bool
    {
        if ($expiresAt === null) {
            return false;
        }
        return $expiresAt < date('Y-m-d H:i:s');
    }

    public static function incrementViews(int $id): void
    {
        $stmt = db()->prepare('UPDATE snippets SET views = views + 1 WHERE id = ?');
        $stmt->execute([$id]);
    }

    public static function verifyPassword(int $id, string $password): bool
    {
        $stmt = db()->prepare('SELECT password_hash FROM snippets WHERE id = ?');
        $stmt->execute([$id]);
        $hash = $stmt->fetchColumn();
        return $hash !== false && password_verify($password, (string)$hash);
    }

    public static function updatePasswordHash(int $id, string $hash): void
    {
        $stmt = db()->prepare('UPDATE snippets SET password_hash = ? WHERE id = ?');
        $stmt->execute([$hash, $id]);
    }
}
