# Fix internal links to use clean URLs
$basePath = 'C:\Users\josep\Desktop\HYBRID FINAL926pm\HYBRID FINAL926pm'

# Fix inquiry folder
$inquiryPath = Join-Path $basePath 'inquiry'
Get-ChildItem $inquiryPath -Filter '*.html' | ForEach-Object {
    $content = Get-Content $_.FullName -Raw
    $newContent = $content -replace 'href="/portfolio\.html"', 'href="/portfolio"'
    if ($content -ne $newContent) {
        Set-Content -Path $_.FullName -Value $newContent -NoNewline
        Write-Host "Updated: $($_.Name)"
    }
}

Write-Host "`nDone fixing inquiry folder links"
