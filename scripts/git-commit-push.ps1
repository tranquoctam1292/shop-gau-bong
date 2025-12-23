# Script to commit and push changes to GitHub
# Follows force-script-for-complex-io rule from .cursorrules

Write-Host "Preparing to commit and push changes..." -ForegroundColor Cyan
Write-Host ""

# Add modified files
Write-Host "Adding modified files..." -ForegroundColor Yellow
git add app/api/cms/orders/route.ts
git add components/checkout/QuickCheckoutModal.tsx
git add lib/hooks/useCheckoutREST.ts
git add package-lock.json
git add package.json

# Add new documentation files
Write-Host "Adding documentation files..." -ForegroundColor Yellow
git add docs/EMAIL_NOTIFICATION_SETUP.md
git add docs/MOBILE_NOTIFICATION_OPTIONS.md
git add docs/TELEGRAM_NOTIFICATION_SETUP.md
git add docs/VERCEL_ENV_SETUP_NOTIFICATIONS.md

# Add new service files
Write-Host "Adding service files..." -ForegroundColor Yellow
git add lib/services/email.ts
git add lib/services/telegram.ts

# Add new scripts
Write-Host "Adding scripts..." -ForegroundColor Yellow
git add scripts/add-telegram-chat-id.ps1
git add scripts/check-email-config.ps1
git add scripts/check-telegram-config.ps1
git add scripts/get-telegram-chat-id.ts
git add scripts/run-email-test.ps1
git add scripts/run-get-telegram-chat-id.ps1
git add scripts/run-telegram-test.ps1
git add scripts/test-email-service.ts
git add scripts/test-telegram-service.ts
git add scripts/update-email-config.ps1

Write-Host ""
Write-Host "Files staged for commit:" -ForegroundColor Green
git status --short

Write-Host ""
Write-Host "Committing changes..." -ForegroundColor Yellow
git commit -m "feat: Add email and Telegram notifications for new orders

- Add email notification service using Resend
- Add Telegram bot notification service
- Integrate notifications into order creation API
- Fix order validation: change 'total' to 'grandTotal'
- Improve email generation in QuickCheckoutModal
- Add detailed validation error messages
- Add comprehensive documentation and setup guides
- Add test scripts for email and Telegram services"

Write-Host ""
Write-Host "Pushing to GitHub..." -ForegroundColor Yellow
git push origin main

Write-Host ""
Write-Host "Done! Changes have been pushed to GitHub." -ForegroundColor Green
Write-Host "Vercel will automatically deploy from GitHub push." -ForegroundColor Cyan

