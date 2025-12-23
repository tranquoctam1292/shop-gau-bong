# Export Full Codebase to full_code_context.txt
# This script exports all TypeScript, JavaScript, and related code files

Write-Host "Starting full codebase export..." -ForegroundColor Green

# Get all code files
$codeFiles = Get-ChildItem -Path . -Recurse -Include *.ts,*.tsx,*.js,*.jsx,*.json | Where-Object { 
    $_.FullName -notmatch '\\node_modules\\' -and 
    $_.FullName -notmatch '\\.next\\' -and 
    $_.FullName -notmatch '\\.git\\' -and
    $_.FullName -notmatch '\\dist\\' -and
    $_.FullName -notmatch '\\build\\' -and
    $_.FullName -notmatch '\\coverage\\' -and
    $_.FullName -notmatch '\\\.turbo\\' -and
    $_.FullName -notmatch '\\lighthouse-reports\\' -and
    $_.FullName -notmatch '\\e2e\\' -and
    $_.FullName -notmatch '\\playwright-report\\' -and
    $_.FullName -notmatch '\\test-results\\' -and
    $_.FullName -notmatch 'package-lock\.json$' -and
    $_.FullName -notmatch 'tsconfig\.json$' -and
    $_.FullName -notmatch 'next\.config\.js$' -and
    $_.FullName -notmatch 'tailwind\.config\.js$' -and
    $_.FullName -notmatch 'postcss\.config\.js$' -and
    $_.FullName -notmatch 'jest\.config\.js$' -and
    $_.FullName -notmatch 'playwright\.config\.ts$' -and
    $_.Exists 
} | Sort-Object FullName

Write-Host "Found $($codeFiles.Count) files to export" -ForegroundColor Yellow

$output = @()
$output += "=" * 80
$output += "FULL CODEBASE CONTEXT"
$output += "Generated: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
$output += "Total Files: $($codeFiles.Count)"
$output += "=" * 80
$output += ""

$fileCount = 0
foreach ($file in $codeFiles) {
    try {
        $fileCount++
        $relativePath = $file.FullName.Replace((Get-Location).Path + '\', '').Replace('\', '/')
        
        Write-Host "[$fileCount/$($codeFiles.Count)] Processing: $relativePath" -ForegroundColor Cyan
        
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
$output += "END OF CODEBASE EXPORT"
$output += "=" * 80

# Write to file
$outputPath = Join-Path (Get-Location) "full_code_context.txt"
$output | Out-File -FilePath $outputPath -Encoding UTF8 -NoNewline

Write-Host ""
Write-Host "Export completed!" -ForegroundColor Green
Write-Host "Output file: $outputPath" -ForegroundColor Green
Write-Host "Total files exported: $fileCount" -ForegroundColor Green

# Get file size
$fileSize = (Get-Item $outputPath).Length / 1MB
Write-Host "File size: $([math]::Round($fileSize, 2)) MB" -ForegroundColor Green
