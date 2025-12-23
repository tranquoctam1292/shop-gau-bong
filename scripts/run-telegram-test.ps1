# Script wrapper to run Telegram test
# Follows force-script-for-complex-io rule from .cursorrules

Write-Host "Running Telegram notification test..." -ForegroundColor Cyan
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

# Run the test script
npm run test:telegram

