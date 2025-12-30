# Documentation Index

**Last updated:** 2025-12-30
**Project:** Shop Gau Bong - Vietnamese Teddy Bear E-commerce

---

## Directory Structure

```
docs/
├── deployment/      # Deployment guides, Vercel setup
├── fixes/           # Critical bug fixes documentation
├── implementation/  # Implementation plans and specs
├── modules/         # Module-specific docs (Media, SKU)
├── performance/     # Performance optimization
├── phases/          # Phase completion summaries
├── plans/           # Project plans and specifications
├── product-module/  # Product module detailed docs
├── progress/        # Progress tracking
├── reports/         # Project reports and audits
├── security/        # Security audits and fixes
├── setup/           # Setup guides and checklists
├── testing/         # Testing docs and checklists
└── troubleshooting/ # Error fixes and solutions
```

---

## Quick Start

| Document | Description |
|----------|-------------|
| [SCHEMA_CONTEXT.md](./SCHEMA_CONTEXT.md) | MongoDB schema reference |
| [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md) | UI/UX design guidelines |
| [PRODUCT_MODULE_REFERENCE.md](./PRODUCT_MODULE_REFERENCE.md) | Product module complete reference |

---

## Core Documentation

### Database & Schema
- [SCHEMA_CONTEXT.md](./SCHEMA_CONTEXT.md) - MongoDB collections and fields
- [SCHEMA_CONTEXT_ORDERS.md](./SCHEMA_CONTEXT_ORDERS.md) - Order schema details

### Design & UI
- [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md) - Colors, typography, components
- [UI_DESIGN_SPEC.md](./UI_DESIGN_SPEC.md) - UI specifications

### Product Module
- [PRODUCT_MODULE_REFERENCE.md](./PRODUCT_MODULE_REFERENCE.md) - Main reference
- [product-module/API.md](./product-module/API.md) - API endpoints
- [product-module/COMPONENTS.md](./product-module/COMPONENTS.md) - React components
- [product-module/HOOKS.md](./product-module/HOOKS.md) - Custom hooks
- [product-module/BUSINESS_LOGIC.md](./product-module/BUSINESS_LOGIC.md) - Business rules

### Admin & RBAC
- [ADMIN_ACCOUNT_RBAC_COMPLETE.md](./ADMIN_ACCOUNT_RBAC_COMPLETE.md) - RBAC system
- [ADMIN_ACCOUNT_RBAC_USER_GUIDE.md](./ADMIN_ACCOUNT_RBAC_USER_GUIDE.md) - User guide
- [quan_ly_tai_khoan.md](./quan_ly_tai_khoan.md) - Account management (Vietnamese)

---

## Setup & Deployment

### Setup Guides
- [setup/README.md](./setup/README.md) - Setup overview
- [setup/CHECKLIST_KHOI_TAO.md](./setup/CHECKLIST_KHOI_TAO.md) - Init checklist
- [setup/CRON_JOBS_SETUP.md](./setup/CRON_JOBS_SETUP.md) - Cron jobs configuration
- [MONGODB_SETUP_GUIDE.md](./MONGODB_SETUP_GUIDE.md) - MongoDB setup
- [TELEGRAM_NOTIFICATION_SETUP.md](./TELEGRAM_NOTIFICATION_SETUP.md) - Telegram notifications
- [EMAIL_NOTIFICATION_SETUP.md](./EMAIL_NOTIFICATION_SETUP.md) - Email notifications

### Deployment
- [deployment/README.md](./deployment/README.md) - Deployment overview
- [deployment/DEPLOYMENT_GUIDE.md](./deployment/DEPLOYMENT_GUIDE.md) - Full guide
- [deployment/VERCEL_ENV_SETUP.md](./deployment/VERCEL_ENV_SETUP.md) - Vercel environment
- [deployment/VERCEL_BLOB_SETUP.md](./deployment/VERCEL_BLOB_SETUP.md) - Vercel Blob storage

---

## Implementation & Plans

### Implementation Plans
- [implementation/README.md](./implementation/README.md) - Overview
- [implementation/PRODUCT_QUICK_EDIT_PLAN.md](./implementation/PRODUCT_QUICK_EDIT_PLAN.md) - Quick Edit
- [implementation/MEDIA_LIBRARY_IMPLEMENTATION_PLAN.md](./implementation/MEDIA_LIBRARY_IMPLEMENTATION_PLAN.md) - Media Library
- [implementation/SMART_SKU_IMPLEMENTATION_PLAN.md](./implementation/SMART_SKU_IMPLEMENTATION_PLAN.md) - SKU System

### Specifications
- [plans/README.md](./plans/README.md) - Plans overview
- [plans/SPEC_MODULE_ADMIN_ACCOUNT.md](./plans/SPEC_MODULE_ADMIN_ACCOUNT.md) - Admin account spec
- [plans/SPEC_PRODUCT_QUICK_EDIT.md](./plans/SPEC_PRODUCT_QUICK_EDIT.md) - Quick Edit spec

---

## Bug Fixes & Troubleshooting

### Critical Fixes
- [fixes/CRITICAL_FIX_COSTPRICE_SNAPSHOT.md](./fixes/CRITICAL_FIX_COSTPRICE_SNAPSHOT.md) - Cost price snapshot
- [fixes/CRITICAL_FIX_ORDER_OPTIMISTIC_LOCKING.md](./fixes/CRITICAL_FIX_ORDER_OPTIMISTIC_LOCKING.md) - Optimistic locking
- [fixes/CRITICAL_FIX_PUBLIC_API_DATA_LEAK.md](./fixes/CRITICAL_FIX_PUBLIC_API_DATA_LEAK.md) - API data leak
- [fixes/CRITICAL_FIX_REFUND_STOCK_RESTORATION.md](./fixes/CRITICAL_FIX_REFUND_STOCK_RESTORATION.md) - Refund stock
- [fixes/CRITICAL_FIX_TOTAL_GRANDTOTAL_UNIFICATION.md](./fixes/CRITICAL_FIX_TOTAL_GRANDTOTAL_UNIFICATION.md) - Total unification
- [fixes/CRITICAL_FIX_WEBHOOK_INVENTORY.md](./fixes/CRITICAL_FIX_WEBHOOK_INVENTORY.md) - Webhook inventory
- [fixes/VALIDATION_ISSUE_VARIATIONS_STOCK.md](./fixes/VALIDATION_ISSUE_VARIATIONS_STOCK.md) - Variations stock

### Troubleshooting
- [troubleshooting/README.md](./troubleshooting/README.md) - Overview
- [troubleshooting/TROUBLESHOOTING.md](./troubleshooting/TROUBLESHOOTING.md) - Common issues
- [troubleshooting/FIX_VERCEL_NEXTAUTH_ERROR.md](./troubleshooting/FIX_VERCEL_NEXTAUTH_ERROR.md) - NextAuth on Vercel

---

## Security

- [security/README.md](./security/README.md) - Security overview
- [security/API_VALIDATION_AUDIT.md](./security/API_VALIDATION_AUDIT.md) - API validation
- [security/XSS_PROTECTION_AUDIT.md](./security/XSS_PROTECTION_AUDIT.md) - XSS protection
- [security/CSRF_PROTECTION_IMPLEMENTATION.md](./reports/CSRF_PROTECTION_IMPLEMENTATION.md) - CSRF protection
- [security/SECURITY_AUDIT_REPORT_API.md](./security/SECURITY_AUDIT_REPORT_API.md) - API security audit
- [RATE_LIMITING_SETUP.md](./RATE_LIMITING_SETUP.md) - Rate limiting

---

## Testing

- [testing/README.md](./testing/README.md) - Testing overview
- [testing/PRE_DEPLOYMENT_CHECKLIST.md](./testing/PRE_DEPLOYMENT_CHECKLIST.md) - Pre-deploy checks
- [testing/SECURITY_CHECKLIST.md](./testing/SECURITY_CHECKLIST.md) - Security checklist
- [testing/LOCAL_DEVELOPMENT_CHECKLIST.md](./testing/LOCAL_DEVELOPMENT_CHECKLIST.md) - Local dev setup

---

## Performance

- [performance/README.md](./performance/README.md) - Performance overview
- [performance/PERFORMANCE_OPTIMIZATION.md](./performance/PERFORMANCE_OPTIMIZATION.md) - Optimization guide
- [performance/BUNDLE_OPTIMIZATION_TEST_RESULTS.md](./performance/BUNDLE_OPTIMIZATION_TEST_RESULTS.md) - Bundle analysis
- [performance/hieu_nang.md](./performance/hieu_nang.md) - Performance notes (Vietnamese)

---

## Reports & Audits

- [reports/README.md](./reports/README.md) - Reports overview
- [reports/PROJECT_STATUS_SUMMARY.md](./reports/PROJECT_STATUS_SUMMARY.md) - Project status
- [reports/FINAL_PROJECT_REPORT.md](./reports/FINAL_PROJECT_REPORT.md) - Final report
- [reports/DRY_AUDIT_REPORT.md](./reports/DRY_AUDIT_REPORT.md) - DRY code audit
- [reports/BAO_CAO_REVIEW_CODE_TOAN_DIEN.md](./reports/BAO_CAO_REVIEW_CODE_TOAN_DIEN.md) - Code review (Vietnamese)

---

## Phase Completion

| Phase | Status | Document |
|-------|--------|----------|
| Phase 1 | Done | [PHASE1_PRODUCT_FEATURES_COMPLETE.md](./phases/PHASE1_PRODUCT_FEATURES_COMPLETE.md) |
| Phase 2 | Done | [PHASE2_PRODUCT_FEATURES_COMPLETE.md](./phases/PHASE2_PRODUCT_FEATURES_COMPLETE.md) |
| Phase 3 | Done | [PHASE3_PRODUCT_FEATURES_COMPLETE.md](./phases/PHASE3_PRODUCT_FEATURES_COMPLETE.md) |
| Phase 4 | Done | [PHASE4_PRODUCT_FEATURES_COMPLETE.md](./phases/PHASE4_PRODUCT_FEATURES_COMPLETE.md) |
| Phase 5 | Done | [PHASE5_PRODUCT_FEATURES_COMPLETE.md](./phases/PHASE5_PRODUCT_FEATURES_COMPLETE.md) |
| Phase 6 | Done | [PHASE6_PRODUCT_FEATURES_COMPLETE.md](./phases/PHASE6_PRODUCT_FEATURES_COMPLETE.md) |

---

## Modules

- [modules/README.md](./modules/README.md) - Modules overview
- [modules/Media.md](./modules/Media.md) - Media Library module
- [modules/SKU.md](./modules/SKU.md) - SKU generation module

---

## Legacy (Reference Only)

These files are kept for reference but are no longer actively maintained:

- `wordpress/` - Old WordPress/WooCommerce files
- Files with `_LEGACY` or `_OLD` suffix
