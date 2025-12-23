# Script wrapper to get Telegram Chat ID
# Follows force-script-for-complex-io rule from .cursorrules

Write-Host "Getting Telegram Chat ID..." -ForegroundColor Cyan
Write-Host ""

# Load environment variables from .env.local
if (Test-Path .env.local) {
    Get-Content .env.local | ForEach-Object {
        if ($_ -match '^([^#][^=]+)=(.*)$') {
            $key = $matches[1].Trim()
            $value = $matches[2].Trim()
            [Environment]::SetEnvironmentVariable($key, $value, 'Process')
        }
    }
    Write-Host "Loaded environment variables from .env.local" -ForegroundColor Green
} else {
    Write-Host "Warning: .env.local not found" -ForegroundColor Yellow
}

Write-Host ""

# Run the script
npm run test:telegram-chat-id

