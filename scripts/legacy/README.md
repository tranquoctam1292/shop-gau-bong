# Legacy Test Scripts

This directory contains test scripts that are no longer actively used but kept for historical reference.

## Scripts Moved Here

These scripts were used during development phases but are no longer needed for regular testing:

### Order Management Phase Tests
- `test-order-phase1-complete.ts` - Phase 1 completion tests
- `test-order-phase2-database.ts` - Phase 2 database tests
- `test-order-phase2-filters.ts` - Phase 2 filter tests
- `test-order-phase3-database.ts` - Phase 3 database tests
- `test-order-phase4-database.ts` - Phase 4 database tests
- `test-order-phase5-database.ts` - Phase 5 database tests
- `test-order-phase7-database.ts` - Phase 7 database tests
- `test-order-phase8-database.ts` - Phase 8 database tests

### Menu Management Phase Tests
- `test-menu-phase2.ts` - Phase 2 menu tests
- `test-menu-phase3.ts` - Phase 3 menu tests
- `test-menu-phase4.ts` - Phase 4 menu tests

### Smart SKU Phase Tests
- `test-smart-sku-phase1.ts` - Phase 1 SKU tests (still in package.json)
- `test-smart-sku-phase5.ts` - Phase 5 SKU tests (still in package.json)

### Other Legacy Tests
- `test-order-api.ts` - Basic order API tests (superseded by more comprehensive tests)
- `test-order-api-with-auth.ts` - Order API with auth tests
- `test-menu-api.ts` - Basic menu API tests
- `test-attributes-api.ts` - Attributes API tests
- `test-api-validation.ts` - API validation tests
- `test-validation.ts` - General validation tests
- `test-xss-protection.ts` - XSS protection tests
- `test-middleware.ts` - Middleware tests
- `test-pim-api.ts` - PIM API tests
- `verify-menu-phase1.ts` - Menu phase 1 verification

## Active Test Scripts

These test scripts are still actively used and remain in the main `scripts/` directory:

- `test-mongodb-connection.ts` - MongoDB connection tests (in package.json)
- `test-api-routes.ts` - API routes tests (in package.json)
- `test-hooks-api.ts` - Hooks API tests (in package.json)
- `test-admin-rbac.ts` - Admin RBAC tests (in package.json)
- `test-product-management.ts` - Product management tests (in package.json)
- `test-menu-phase5.ts` - Menu phase 5 tests (in package.json)
- `test-smart-sku-phase1.ts` - Smart SKU phase 1 tests (in package.json)
- `test-smart-sku-api.ts` - Smart SKU API tests (in package.json)
- `test-smart-sku-phase5.ts` - Smart SKU phase 5 tests (in package.json)
- `test-order-state-machine.ts` - Order state machine tests (may still be useful)

## Usage

If you need to run any of these legacy tests, you can:

```bash
# Run from the project root
npx tsx scripts/legacy/test-order-phase1-complete.ts
```

Or add them back to `package.json` if needed for specific testing scenarios.

