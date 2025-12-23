# Export Product Components Source Code
# This script exports all product-related components to components_product_code.txt

Write-Host "Starting product components export..." -ForegroundColor Green

# Get all product component files
$productFiles = Get-ChildItem -Path . -Recurse -Include *.tsx,*.ts | Where-Object { 
    $_.FullName -notmatch '\\node_modules\\' -and 
    $_.FullName -notmatch '\\.next\\' -and 
    $_.FullName -notmatch '\\.git\\' -and 
    ($_.FullName -match 'components\\admin\\products' -or $_.FullName -match 'components\\product') -and 
    $_.Exists 
} | Sort-Object FullName

Write-Host "Found $($productFiles.Count) files to export" -ForegroundColor Yellow

$output = @()
$output += "=" * 80
$output += "PRODUCT COMPONENTS SOURCE CODE"
$output += "Generated: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
$output += "Total Files: $($productFiles.Count)"
$output += "=" * 80
$output += ""

$fileCount = 0
foreach ($file in $productFiles) {
    try {
        $fileCount++
        $relativePath = $file.FullName.Replace((Get-Location).Path + '\', '').Replace('\', '/')
        
        Write-Host "[$fileCount/$($productFiles.Count)] Processing: $relativePath" -ForegroundColor Cyan
        
        $content = Get-Content $file.FullName -ErrorAction SilentlyContinue -Encoding UTF8 | Out-String
        
        if ($content) {
            $output += ""
            $output += "=" * 80
            $output += "FILE: $relativePath"
            $output += "=" * 80
            $output += $content
            $output += ""
        }
    } catch {
        Write-Host "Error processing $($file.FullName): $_" -ForegroundColor Red
    }
}

$output += ""
$output += "=" * 80
$output += "END OF PRODUCT COMPONENTS EXPORT"
$output += "=" * 80

# Write to file
$outputPath = Join-Path (Get-Location) "components_product_code.txt"
$output | Out-File -FilePath $outputPath -Encoding UTF8 -NoNewline

Write-Host ""
Write-Host "Export completed!" -ForegroundColor Green
Write-Host "Output file: $outputPath" -ForegroundColor Green
Write-Host "Total files exported: $fileCount" -ForegroundColor Green

# Get file size
$fileSize = (Get-Item $outputPath).Length / 1MB
Write-Host "File size: $([math]::Round($fileSize, 2)) MB" -ForegroundColor Green

