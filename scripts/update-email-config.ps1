# Script to update email configuration in .env.local
# This script updates EMAIL_FROM and EMAIL_REPLY_TO to use the verified domain

if (-not (Test-Path .env.local)) {
    Write-Host "ERROR: File .env.local khong ton tai" -ForegroundColor Red
    exit 1
}

$content = Get-Content .env.local -Raw
$updated = $false

# Update EMAIL_FROM
if ($content -match 'EMAIL_FROM=(.+)') {
    $oldFrom = $matches[1].Trim()
    $newFrom = "Shop Gau Bong <noreply@lienhe.teddyland.vn>"
    $content = $content -replace "EMAIL_FROM=.*", "EMAIL_FROM=$newFrom"
    Write-Host "Updated EMAIL_FROM: $oldFrom -> $newFrom" -ForegroundColor Green
    $updated = $true
} else {
    # Add EMAIL_FROM if not exists
    $content += "`nEMAIL_FROM=Shop Gau Bong <noreply@lienhe.teddyland.vn>`n"
    Write-Host "Added EMAIL_FROM: Shop Gau Bong <noreply@lienhe.teddyland.vn>" -ForegroundColor Green
    $updated = $true
}

# Update EMAIL_REPLY_TO
if ($content -match 'EMAIL_REPLY_TO=(.+)') {
    $oldReplyTo = $matches[1].Trim()
    $newReplyTo = "support@lienhe.teddyland.vn"
    $content = $content -replace "EMAIL_REPLY_TO=.*", "EMAIL_REPLY_TO=$newReplyTo"
    Write-Host "Updated EMAIL_REPLY_TO: $oldReplyTo -> $newReplyTo" -ForegroundColor Green
    $updated = $true
} else {
    # Add EMAIL_REPLY_TO if not exists
    $content += "`nEMAIL_REPLY_TO=support@lienhe.teddyland.vn`n"
    Write-Host "Added EMAIL_REPLY_TO: support@lienhe.teddyland.vn" -ForegroundColor Green
    $updated = $true
}

if ($updated) {
    # Backup original file
    Copy-Item .env.local .env.local.backup -Force
    Write-Host "`nBackup created: .env.local.backup" -ForegroundColor Cyan
    
    # Write updated content
    [System.IO.File]::WriteAllText((Resolve-Path .env.local), $content, [System.Text.Encoding]::UTF8)
    Write-Host "Updated .env.local successfully!" -ForegroundColor Green
    Write-Host "`nPlease review the changes and update ADMIN_EMAIL if needed." -ForegroundColor Yellow
} else {
    Write-Host "No changes needed." -ForegroundColor Cyan
}

