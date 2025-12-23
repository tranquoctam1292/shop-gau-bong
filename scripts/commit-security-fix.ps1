# Script to commit security fix
# Follows force-script-for-complex-io rule from .cursorrules

Write-Host "Committing security fix..." -ForegroundColor Cyan
Write-Host ""

# Add fixed files
git add docs/VERCEL_ENV_SETUP_NOTIFICATIONS.md
git add docs/SECURITY_FIX_TELEGRAM_TOKEN.md
git add scripts/add-telegram-chat-id.ps1
git add scripts/fix-security-secrets.ps1
git add .gitignore

Write-Host "Files staged:" -ForegroundColor Green
git status --short

Write-Host ""
Write-Host "Committing..." -ForegroundColor Yellow
git commit -m "security: Remove exposed Telegram Bot Token from documentation

- Replace hardcoded Telegram Bot Token with placeholder in docs
- Update add-telegram-chat-id.ps1 to accept chat ID as parameter
- Add security check script to detect exposed secrets
- Update .gitignore to exclude backup files
- Add SECURITY_FIX_TELEGRAM_TOKEN.md with rotation instructions

BREAKING: Token must be rotated immediately via BotFather"

Write-Host ""
Write-Host "Pushing to GitHub..." -ForegroundColor Yellow
git push origin main

Write-Host ""
Write-Host "Done! Security fix has been pushed." -ForegroundColor Green
Write-Host ""
Write-Host "⚠️  IMPORTANT: Rotate Telegram Bot Token immediately!" -ForegroundColor Red
Write-Host "   See docs/SECURITY_FIX_TELEGRAM_TOKEN.md for instructions" -ForegroundColor Yellow

