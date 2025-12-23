# Script to check Telegram configuration in .env.local
if (Test-Path .env.local) {
    Write-Host "=== Telegram Configuration Check ===" -ForegroundColor Cyan
    Write-Host ""
    
    $content = Get-Content .env.local -Raw
    
    # Check TELEGRAM_BOT_TOKEN
    if ($content -match 'TELEGRAM_BOT_TOKEN=(.+)') {
        $botToken = $matches[1].Trim()
        if ($botToken -match '^\d+:[A-Za-z0-9_-]+$') {
            Write-Host "OK TELEGRAM_BOT_TOKEN: Da cau hinh (dung format)" -ForegroundColor Green
            Write-Host "   Token: $($botToken.Substring(0, [Math]::Min(20, $botToken.Length)))..." -ForegroundColor Gray
        } else {
            Write-Host "WARNING TELEGRAM_BOT_TOKEN: Co ve khong dung format (nen co dang: 123456789:ABC...)" -ForegroundColor Yellow
        }
    } else {
        Write-Host "ERROR TELEGRAM_BOT_TOKEN: Chua duoc cau hinh" -ForegroundColor Red
        Write-Host ""
        Write-Host "Huong dan:" -ForegroundColor Yellow
        Write-Host "  1. Mo Telegram app, tim @BotFather" -ForegroundColor White
        Write-Host "  2. Gui lenh /newbot" -ForegroundColor White
        Write-Host "  3. Lam theo huong dan de tao bot" -ForegroundColor White
        Write-Host "  4. Copy bot token va them vao .env.local:" -ForegroundColor White
        Write-Host "     TELEGRAM_BOT_TOKEN=your_bot_token_here" -ForegroundColor White
    }
    
    # Check TELEGRAM_CHAT_ID
    if ($content -match 'TELEGRAM_CHAT_ID=(.+)') {
        $chatId = $matches[1].Trim()
        Write-Host "OK TELEGRAM_CHAT_ID: $chatId" -ForegroundColor Green
    } else {
        Write-Host "ERROR TELEGRAM_CHAT_ID: Chua duoc cau hinh" -ForegroundColor Red
        Write-Host ""
        Write-Host "Huong dan:" -ForegroundColor Yellow
        Write-Host "  1. Chat voi bot tren Telegram (gui bat ky message nao)" -ForegroundColor White
        Write-Host "  2. Chay script: npm run test:telegram-chat-id" -ForegroundColor White
        Write-Host "  3. Copy chat ID tu output va them vao .env.local:" -ForegroundColor White
        Write-Host "     TELEGRAM_CHAT_ID=your_chat_id_here" -ForegroundColor White
    }
    
    Write-Host ""
    Write-Host "=== Next Steps ===" -ForegroundColor Cyan
    Write-Host ""
    
    if (-not ($content -match 'TELEGRAM_BOT_TOKEN=(.+)')) {
        Write-Host "1. Tao bot va lay bot token (xem huong dan tren)" -ForegroundColor Yellow
    } elseif (-not ($content -match 'TELEGRAM_CHAT_ID=(.+)')) {
        Write-Host "1. Chat voi bot tren Telegram" -ForegroundColor Yellow
        Write-Host "2. Chay: npm run test:telegram-chat-id" -ForegroundColor Yellow
    } else {
        Write-Host "OK Tat ca da duoc cau hinh!" -ForegroundColor Green
        Write-Host "Ban co the test bang: npm run test:telegram" -ForegroundColor Cyan
    }
    
    Write-Host ""
} else {
    Write-Host "ERROR File .env.local khong ton tai" -ForegroundColor Red
    Write-Host "Tao file .env.local va them cac bien moi truong can thiet" -ForegroundColor Yellow
}

