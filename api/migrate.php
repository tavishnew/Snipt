<?php
declare(strict_types=1);

$envPath = __DIR__ . '/.env';
$env = [];
if (file_exists($envPath)) {
  foreach (file($envPath, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) as $line) {
    if (str_starts_with($line, '#') || !str_contains($line, '=')) { continue; }
    [$k, $v] = explode('=', $line, 2);
    $env[trim($k)] = trim($v);
  }
}

$host = $env['DB_HOST'] ?? '127.0.0.1';
$port = (int)($env['DB_PORT'] ?? 5432);
$dbname = $env['DB_NAME'] ?? 'neondb';
$user = $env['DB_USER'] ?? 'neondb_owner';
$pass = $env['DB_PASS'] ?? '';
$driver = $env['DB_DRIVER'] ?? (stripos($host, 'neon') !== false || stripos($dbname, 'neon') !== false ? 'pgsql' : 'mysql');

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
} catch (Throwable $e) {
  fwrite(STDERR, "Connection failed: " . $e->getMessage() . PHP_EOL);
  exit(1);
}

$migrations = [
  __DIR__ . '/database/migrations/001_create_snippets_table.sql',
  __DIR__ . '/database/migrations/002_create_rate_limits_table.sql',
  __DIR__ . '/database/migrations/003_add_zip_support_to_snippets.sql',
];

foreach ($migrations as $path) {
  if (!file_exists($path)) {
    echo "Skip: missing {$path}\n";
    continue;
  }
  $sql = file_get_contents($path);
  try {
    $pdo->exec($sql);
    echo "Applied: {$path}\n";
  } catch (Throwable $e) {
    $msg = $e->getMessage();
    if (stripos($msg, 'already exists') !== false || stripos($msg, 'exists') !== false) {
      echo "Exists: {$path}\n";
      continue;
    }
    fwrite(STDERR, "Migration failed ({$path}): {$msg}\n");
    exit(1);
  }
}

echo "Done\n";
