# Script to check TypeScript errors
# Usage: .\scripts\check-type-errors.ps1

npm run type-check 2>&1 | Select-String -Pattern "error" | Select-Object -First 5

