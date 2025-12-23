# Script to check email configuration in .env.local
if (Test-Path .env.local) {
    Write-Host "=== Email Configuration Check ===" -ForegroundColor Cyan
    Write-Host ""
    
    $content = Get-Content .env.local -Raw
    
    # Check RESEND_API_KEY
    if ($content -match 'RESEND_API_KEY=(.+)') {
        $apiKey = $matches[1].Trim()
        if ($apiKey -match '^re_') {
            Write-Host "✅ RESEND_API_KEY: Đã cấu hình (bắt đầu với 're_')" -ForegroundColor Green
        } else {
            Write-Host "⚠️  RESEND_API_KEY: Có vẻ không đúng format (nên bắt đầu với 're_')" -ForegroundColor Yellow
        }
    } else {
        Write-Host "❌ RESEND_API_KEY: Chưa được cấu hình" -ForegroundColor Red
    }
    
    # Check EMAIL_FROM
    if ($content -match 'EMAIL_FROM=(.+)') {
        $emailFrom = $matches[1].Trim()
        Write-Host "✅ EMAIL_FROM: $emailFrom" -ForegroundColor Green
        if ($emailFrom -match 'lienhe\.teddyland\.vn') {
            Write-Host "   ✅ Domain đúng với domain đã verify (lienhe.teddyland.vn)" -ForegroundColor Green
        } else {
            Write-Host "   ⚠️  Domain không khớp với domain đã verify (lienhe.teddyland.vn)" -ForegroundColor Yellow
        }
    } else {
        Write-Host "❌ EMAIL_FROM: Chưa được cấu hình" -ForegroundColor Red
    }
    
    # Check ADMIN_EMAIL
    if ($content -match 'ADMIN_EMAIL=(.+)') {
        $adminEmail = $matches[1].Trim()
        Write-Host "✅ ADMIN_EMAIL: $adminEmail" -ForegroundColor Green
    } else {
        Write-Host "❌ ADMIN_EMAIL: Chưa được cấu hình" -ForegroundColor Red
    }
    
    # Check EMAIL_REPLY_TO
    if ($content -match 'EMAIL_REPLY_TO=(.+)') {
        $replyTo = $matches[1].Trim()
        Write-Host "✅ EMAIL_REPLY_TO: $replyTo" -ForegroundColor Green
    } else {
        Write-Host "⚠️  EMAIL_REPLY_TO: Chưa được cấu hình (optional)" -ForegroundColor Yellow
    }
    
    # Check NEXT_PUBLIC_SITE_URL
    if ($content -match 'NEXT_PUBLIC_SITE_URL=(.+)') {
        $siteUrl = $matches[1].Trim()
        Write-Host "✅ NEXT_PUBLIC_SITE_URL: $siteUrl" -ForegroundColor Green
    } else {
        Write-Host "⚠️  NEXT_PUBLIC_SITE_URL: Chưa được cấu hình" -ForegroundColor Yellow
    }
    
    Write-Host ""
    Write-Host "=== Recommended Configuration ===" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Với domain 'lienhe.teddyland.vn' đã verify, nên cấu hình:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "EMAIL_FROM=Shop Gấu Bông <noreply@lienhe.teddyland.vn>" -ForegroundColor White
    Write-Host "EMAIL_REPLY_TO=support@lienhe.teddyland.vn" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host "ERROR: File .env.local khong ton tai" -ForegroundColor Red
    Write-Host "Tao file .env.local va them cac bien moi truong can thiet" -ForegroundColor Yellow
}

