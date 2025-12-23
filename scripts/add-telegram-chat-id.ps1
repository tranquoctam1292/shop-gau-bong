# Script to add TELEGRAM_CHAT_ID to .env.local
# Follows force-script-for-complex-io rule from .cursorrules

$chatId = "1899159757"

if (-not (Test-Path .env.local)) {
    Write-Host "ERROR: File .env.local khong ton tai" -ForegroundColor Red
    exit 1
}

$content = Get-Content .env.local -Raw

# Check if TELEGRAM_CHAT_ID already exists
if ($content -match 'TELEGRAM_CHAT_ID=(.+)') {
    $oldChatId = $matches[1].Trim()
    Write-Host "TELEGRAM_CHAT_ID da ton tai: $oldChatId" -ForegroundColor Yellow
    Write-Host "Cap nhat thanh: $chatId" -ForegroundColor Cyan
    
    # Replace existing
    $content = $content -replace 'TELEGRAM_CHAT_ID=.*', "TELEGRAM_CHAT_ID=$chatId"
} else {
    Write-Host "Them TELEGRAM_CHAT_ID vao .env.local..." -ForegroundColor Cyan
    
    # Add new line
    if (-not $content.EndsWith("`n") -and -not $content.EndsWith("`r`n")) {
        $content += "`n"
    }
    $content += "TELEGRAM_CHAT_ID=$chatId`n"
}

# Backup original file
Copy-Item .env.local .env.local.backup-telegram -Force
Write-Host "Backup created: .env.local.backup-telegram" -ForegroundColor Gray

# Write updated content
[System.IO.File]::WriteAllText((Resolve-Path .env.local), $content, [System.Text.Encoding]::UTF8)

Write-Host ""
Write-Host "OK Da them TELEGRAM_CHAT_ID=$chatId vao .env.local" -ForegroundColor Green
Write-Host ""
Write-Host "Ban co the test bang:" -ForegroundColor Cyan
Write-Host "  npm run test:telegram" -ForegroundColor White
Write-Host ""

