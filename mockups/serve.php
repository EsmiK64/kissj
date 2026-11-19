<?php

declare(strict_types=1);

require __DIR__ . '/../vendor/autoload.php';

$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH) ?: '/';
$repoRoot = dirname(__DIR__);

// Serve static assets from /public or /mockups
if (preg_match('/\.(css|js|png|jpg|jpeg|svg|woff2?|ttf|otf|webp)$/i', $path) === 1) {
    $candidates = [
        $repoRoot . $path,
        $repoRoot . '/public' . $path,
        __DIR__ . $path,
    ];
    foreach ($candidates as $file) {
        if (is_file($file)) {
            $ext = strtolower(pathinfo($file, PATHINFO_EXTENSION));
            $mimeTypes = [
                'css' => 'text/css; charset=utf-8',
                'js' => 'application/javascript; charset=utf-8',
                'svg' => 'image/svg+xml',
                'png' => 'image/png',
                'jpg' => 'image/jpeg',
                'jpeg' => 'image/jpeg',
                'webp' => 'image/webp',
                'woff' => 'font/woff',
                'woff2' => 'font/woff2',
                'ttf' => 'font/ttf',
                'otf' => 'font/otf',
            ];
            header('Content-Type: ' . ($mimeTypes[$ext] ?? 'application/octet-stream'));
            readfile($file);

            return true;
        }
    }
    http_response_code(404);
    echo 'Asset not found';

    return true;
}

$template = ltrim($path, '/');
if ($template === '') {
    $template = 'alt-1-command-tiles.twig';
}

if (
    !str_ends_with($template, '.twig')
    || str_contains($template, '..')
    || !is_file(__DIR__ . '/' . $template)
) {
    http_response_code(404);
    echo 'Mockup not found';

    return true;
}

$loader = new \Twig\Loader\FilesystemLoader(__DIR__);
$twig = new \Twig\Environment($loader, ['cache' => false, 'auto_reload' => true]);

echo $twig->render($template);
