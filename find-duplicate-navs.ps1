# Find files with duplicate nav bars
$basePath = 'C:\Users\josep\Desktop\HYBRID FINAL926pm\HYBRID FINAL926pm'

Get-ChildItem $basePath -Recurse -Filter '*.html' | ForEach-Object {
    $content = Get-Content $_.FullName -Raw
    $matches = [regex]::Matches($content, '<nav class="nav-bar"')
    if ($matches.Count -gt 1) {
        Write-Host "$($_.FullName): $($matches.Count) nav bars"
    }
}
