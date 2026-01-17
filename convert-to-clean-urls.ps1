# Convert .html files to folder/index.html structure for clean URLs

$folders = @(
    'pages\science',
    'pages\technology',
    'pages\regulatory',
    'pages\industry',
    'pages\applications',
    'pages\companies',
    'pages\market',
    'pages\framework',
    'pages\guides',
    'pages\resources',
    'pages\legal',
    'technology',
    'simulations',
    'games'
)

$basePath = 'C:\Users\josep\Desktop\HYBRID FINAL926pm\HYBRID FINAL926pm'
$totalConverted = 0

foreach ($folder in $folders) {
    $fullPath = Join-Path $basePath $folder
    if (Test-Path $fullPath) {
        $files = Get-ChildItem $fullPath -Filter '*.html' -File | Where-Object { $_.Name -ne 'index.html' }
        foreach ($file in $files) {
            $folderName = $file.BaseName
            $newFolderPath = Join-Path $fullPath $folderName

            if (-not (Test-Path $newFolderPath)) {
                New-Item -ItemType Directory -Path $newFolderPath -Force | Out-Null
            }

            $newFilePath = Join-Path $newFolderPath 'index.html'
            if (-not (Test-Path $newFilePath)) {
                Copy-Item $file.FullName $newFilePath
                Remove-Item $file.FullName
                Write-Host "Converted: $folder\$($file.Name) -> $folder\$folderName\index.html"
                $totalConverted++
            }
        }
    }
}

Write-Host "`nTotal files converted: $totalConverted"
