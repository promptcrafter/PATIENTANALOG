# Fix padding-top on all cluster pages to clear nav bar
$basePath = 'C:\Users\josep\Desktop\HYBRID FINAL926pm\HYBRID FINAL926pm'

for ($i = 1; $i -le 11; $i++) {
    $clusterPath = Join-Path $basePath "portfolio-cluster-$i\index.html"
    if (Test-Path $clusterPath) {
        $content = Get-Content $clusterPath -Raw

        # Add padding-top to body if not already there
        if ($content -match 'body\s*\{[^}]*padding-top') {
            # Already has padding-top, update it
            $newContent = $content -replace '(body\s*\{[^}]*?)padding-top:\s*\d+px', '$1padding-top: 140px'
        } else {
            # Add padding-top to body style
            $newContent = $content -replace '(body\s*\{)', '$1padding-top: 140px;'
        }

        # Also fix the page-header top padding
        $newContent = $newContent -replace '\.page-header\s*\{([^}]*?)padding:\s*\d+px', '.page-header{$1padding: 40px'

        Set-Content -Path $clusterPath -Value $newContent -NoNewline
        Write-Host "Fixed: portfolio-cluster-$i"
    }
}

Write-Host "`nDone!"
