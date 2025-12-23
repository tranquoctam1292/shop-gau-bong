# Cron Jobs Setup Guide

## ⚠️ Vercel Cron Jobs Disabled

Cron jobs have been temporarily disabled in `vercel.json` due to Vercel plan limit (maximum 2 cron jobs per team).

## Available Cron Job Endpoints

The following API endpoints are available for scheduled tasks:

### 1. Auto Cleanup Trash Products
- **Endpoint:** `POST /api/admin/products/auto-cleanup-trash`
- **Schedule:** Daily at 2:00 AM UTC (`0 2 * * *`)
- **Purpose:** Automatically delete products in trash older than 30 days
- **Authentication:** Requires admin authentication

### 2. Auto Cancel Pending Orders (Optional)
- **Endpoint:** `POST /api/admin/orders/auto-cancel`
- **Schedule:** Recommended every 30 minutes or hourly
- **Purpose:** Automatically cancel pending orders that have timed out
- **Authentication:** Requires admin authentication

## Setup Options

### Option 1: Upgrade Vercel Plan
Upgrade your Vercel plan to allow more cron jobs:
- Visit: https://vercel.com/pricing
- Contact sales for custom limits

### Option 2: Use External Cron Service (Recommended for Free Plan)

#### Using cron-job.org (Free)
1. Sign up at https://cron-job.org
2. Create a new cron job:
   - **URL:** `https://your-domain.com/api/admin/products/auto-cleanup-trash`
   - **Method:** POST
   - **Schedule:** `0 2 * * *` (Daily at 2:00 AM UTC)
   - **Headers:** 
     - `Authorization: Bearer YOUR_API_KEY` (if using API key auth)
     - `Content-Type: application/json`
3. Add authentication header if your API requires it

#### Using EasyCron
1. Sign up at https://www.easycron.com
2. Create a new cron job with similar settings

#### Using GitHub Actions (Free)
Create `.github/workflows/cron-jobs.yml`:

```yaml
name: Scheduled Tasks

on:
  schedule:
    - cron: '0 2 * * *'  # Daily at 2:00 AM UTC
  workflow_dispatch:  # Allow manual trigger

jobs:
  cleanup-trash:
    runs-on: ubuntu-latest
    steps:
      - name: Call Auto Cleanup API
        run: |
          curl -X POST https://your-domain.com/api/admin/products/auto-cleanup-trash \
            -H "Authorization: Bearer ${{ secrets.API_KEY }}" \
            -H "Content-Type: application/json"
```

### Option 3: Combine Multiple Tasks into One Route

Create a single cron job that calls multiple tasks:

1. Create `/api/admin/cron/all-tasks/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { autoCleanupTrash } from '../products/auto-cleanup-trash/route';
import { autoCancelOrders } from '../orders/auto-cancel/route';

export async function POST(request: NextRequest) {
  const results = [];
  
  // Run all scheduled tasks
  try {
    const cleanupResult = await autoCleanupTrash(request);
    results.push({ task: 'cleanup-trash', success: true });
  } catch (error) {
    results.push({ task: 'cleanup-trash', success: false, error: error.message });
  }
  
  try {
    const cancelResult = await autoCancelOrders(request);
    results.push({ task: 'auto-cancel', success: true });
  } catch (error) {
    results.push({ task: 'auto-cancel', success: false, error: error.message });
  }
  
  return NextResponse.json({ results });
}
```

2. Then add only one cron job in `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/admin/cron/all-tasks",
      "schedule": "0 2 * * *"
    }
  ]
}
```

## Re-enabling Vercel Cron Jobs

To re-enable cron jobs in `vercel.json`, uncomment the `crons` section:

```json
{
  "crons": [
    {
      "path": "/api/admin/products/auto-cleanup-trash",
      "schedule": "0 2 * * *"
    }
  ]
}
```

## Notes

- All cron job endpoints require proper authentication
- Make sure to set up proper error handling and logging
- Monitor cron job execution to ensure they run successfully
- Consider adding webhook notifications for failed cron jobs
