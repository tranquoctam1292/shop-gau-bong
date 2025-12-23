# Script to check for exposed secrets in codebase
# Follows force-script-for-complex-io rule from .cursorrules

Write-Host "Checking for exposed secrets..." -ForegroundColor Cyan
Write-Host ""

$foundSecrets = $false

# Check for Telegram Bot Token (only in source files, not in .next, node_modules, .git)
$telegramToken = "8321066924"
$sourceFiles = Get-ChildItem -Recurse -File -Include *.ts,*.tsx,*.js,*.jsx,*.md,*.ps1 | 
    Where-Object { $_.FullName -notmatch '\\node_modules\\' -and $_.FullName -notmatch '\\.next\\' -and $_.FullName -notmatch '\\.git\\' }
$foundToken = $sourceFiles | Select-String -Pattern $telegramToken -Quiet
if ($foundToken) {
    Write-Host "WARNING: Found Telegram Bot Token in source files!" -ForegroundColor Red
    $sourceFiles | Select-String -Pattern $telegramToken | ForEach-Object {
        Write-Host "  - $($_.Path):$($_.LineNumber)" -ForegroundColor Yellow
    }
    Write-Host "Please remove or replace with placeholder" -ForegroundColor Yellow
    $foundSecrets = $true
} else {
    Write-Host "OK: No Telegram Bot Token found in source files" -ForegroundColor Green
}

# Check for Resend API Key pattern (should only be placeholders)
$resendPattern = "re_[A-Za-z0-9]{20,}"
$filesWithResend = Get-ChildItem -Recurse -File -Exclude node_modules,.next,.git,.env*.local | Select-String -Pattern $resendPattern | Where-Object { $_.Line -notmatch "re_xxxxxxxx" -and $_.Line -notmatch "your.*token" }
if ($filesWithResend) {
    Write-Host "WARNING: Found potential Resend API Key in files!" -ForegroundColor Red
    $filesWithResend | ForEach-Object {
        Write-Host "  - $($_.Path):$($_.LineNumber)" -ForegroundColor Yellow
    }
    $foundSecrets = $true
} else {
    Write-Host "OK: No Resend API Key found (only placeholders)" -ForegroundColor Green
}

Write-Host ""
if ($foundSecrets) {
    Write-Host "ERROR: Secrets found in codebase. Please fix before committing." -ForegroundColor Red
    exit 1
} else {
    Write-Host "OK: No secrets found in codebase." -ForegroundColor Green
    exit 0
}

