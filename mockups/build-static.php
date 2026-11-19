<?php

declare(strict_types=1);

require __DIR__ . '/../vendor/autoload.php';

$mockupsDir = __DIR__;
$repoRoot = dirname(__DIR__);
$distDir = $mockupsDir . '/dist';

$copyRecursive = static function (string $src, string $dst) use (&$copyRecursive): void {
    if (!file_exists($src)) {
        return;
    }
    if (is_dir($src)) {
        if (!is_dir($dst)) {
            mkdir($dst, 0775, true);
        }
        $items = scandir($src);
        if ($items === false) {
            return;
        }
        foreach ($items as $item) {
            if ($item === '.' || $item === '..') {
                continue;
            }
            $copyRecursive($src . '/' . $item, $dst . '/' . $item);
        }

        return;
    }
    copy($src, $dst);
};

// Clean & recreate dist/
if (is_dir($distDir)) {
    $it = new RecursiveIteratorIterator(
        new RecursiveDirectoryIterator($distDir, FilesystemIterator::SKIP_DOTS),
        RecursiveIteratorIterator::CHILD_FIRST
    );
    foreach ($it as $file) {
        $file->isDir() ? rmdir($file->getPathname()) : unlink($file->getPathname());
    }
    rmdir($distDir);
}
mkdir($distDir . '/pages', 0775, true);

// Copy static assets
foreach (['mockups.css', 'calendar.css', 'mockups.js'] as $asset) {
    copy($mockupsDir . '/' . $asset, $distDir . '/' . $asset);
}
copy($repoRoot . '/public/styles.css', $distDir . '/styles.css');
$copyRecursive($repoRoot . '/public/eventSpecificCss', $distDir . '/eventSpecificCss');
$copyRecursive($repoRoot . '/public/obrok27', $distDir . '/obrok27');
foreach (['background_mozaika_light.svg', 'background_mozaika_dark.svg', 'background_cej26.jpg', 'background_dark_cej26.png'] as $bg) {
    if (is_file($repoRoot . '/public/' . $bg)) {
        copy($repoRoot . '/public/' . $bg, $distDir . '/' . $bg);
    }
}

$loader = new \Twig\Loader\FilesystemLoader($mockupsDir);
$twig = new \Twig\Environment($loader, ['cache' => false]);

$rewriteHtml = static function (string $html, string $prefix): string {
    // Rewrite root-relative template links to static .html paths
    $html = str_replace('href="/alt-1-command-tiles.twig"', 'href="' . $prefix . 'index.html"', $html);
    $html = preg_replace('#href="/(pages/[a-z0-9\-]+)\.twig([^"]*)"#i', 'href="' . $prefix . '$1.html$2"', $html) ?? $html;

    // Rewrite root-relative CSS/JS assets
    foreach (['styles.css', 'mockups.css', 'calendar.css', 'mockups.js'] as $asset) {
        $html = str_replace('"' . '/' . $asset . '"', '"' . $prefix . $asset . '"', $html);
    }

    return $html;
};

// Build index.html
$indexHtml = $rewriteHtml($twig->render('alt-1-command-tiles.twig'), './');
file_put_contents($distDir . '/index.html', $indexHtml);

// Build pages/*.html
$pageFiles = glob($mockupsDir . '/pages/*.twig') ?: [];
foreach ($pageFiles as $file) {
    $base = basename($file);
    if (str_starts_with($base, '_')) {
        continue;
    }
    $outName = preg_replace('/\.twig$/', '.html', $base);
    $html = $rewriteHtml($twig->render('pages/' . $base), '../');
    file_put_contents($distDir . '/pages/' . $outName, $html);
}

echo "Static mockups built in mockups/dist/\n";
