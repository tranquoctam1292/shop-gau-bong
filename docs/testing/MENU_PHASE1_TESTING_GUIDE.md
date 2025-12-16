# 🧪 Menu Management Phase 1 - Testing Guide

**Phase:** Database Schema & API Foundation  
**Status:** ✅ Implementation Complete  
**Date:** 12/12/2025

---

## ✅ Verification Results

### Database Setup
- ✅ MongoDB collections: `menus`, `menu_items` added to `lib/db.ts`
- ✅ Indexes created successfully:
  - `menus`: `location` (unique, sparse), `status`, `createdAt`
  - `menu_items`: `menuId + order`, `menuId + parentId`, `referenceId + type`, `parentId`

### API Routes
- ✅ `GET /api/admin/menus` - List menus with filters
- ✅ `GET /api/admin/menus/{id}` - Get menu detail (tree/flat format)
- ✅ `POST /api/admin/menus` - Create menu
- ✅ `PUT /api/admin/menus/{id}` - Update menu
- ✅ `DELETE /api/admin/menus/{id}` - Delete menu
- ✅ `GET /api/admin/menu-items/{id}` - Get menu item detail
- ✅ `POST /api/admin/menu-items` - Create menu item
- ✅ `PUT /api/admin/menu-items/{id}` - Update menu item
- ✅ `DELETE /api/admin/menu-items/{id}` - Delete menu item

### Utilities
- ✅ `lib/utils/menuUtils.ts` - Dynamic link resolution, depth validation, reference checking

### Test Scripts
- ✅ `scripts/test-menu-api.ts` - Comprehensive API test script
- ✅ `scripts/verify-menu-phase1.ts` - File structure verification

---

## 🚀 Testing Steps

### Step 1: Start Development Server

```bash
npm run dev
```

Server should start on `http://localhost:3000`

### Step 2: Run Automated Test Script

```bash
npx tsx scripts/test-menu-api.ts
```

**Note:** The test script requires:
- Server running on `http://localhost:3000`
- Admin credentials in `.env.local`:
  ```
  TEST_ADMIN_EMAIL=admin@example.com
  TEST_ADMIN_PASSWORD=your_admin_password
  ```

### Step 3: Manual API Testing (Optional)

#### Test 1: Create Menu

```bash
POST http://localhost:3000/api/admin/menus
Content-Type: application/json
Authorization: (session cookie)

{
  "name": "Main Menu",
  "location": "header",
  "status": "active"
}
```

**Expected Response:**
```json
{
  "message": "Menu created successfully",
  "menu": {
    "id": "...",
    "name": "Main Menu",
    "location": "header",
    "status": "active",
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```

#### Test 2: List Menus

```bash
GET http://localhost:3000/api/admin/menus?location=header&status=active
```

#### Test 3: Get Menu Detail (Tree Format)

```bash
GET http://localhost:3000/api/admin/menus/{menuId}?format=tree
```

#### Test 4: Create Menu Item (Custom Link)

```bash
POST http://localhost:3000/api/admin/menu-items
Content-Type: application/json

{
  "menuId": "{menuId}",
  "title": "Trang chủ",
  "type": "custom",
  "url": "/",
  "target": "_self",
  "order": 0
}
```

#### Test 5: Create Menu Item (Category Reference)

```bash
POST http://localhost:3000/api/admin/menu-items
Content-Type: application/json

{
  "menuId": "{menuId}",
  "title": null,
  "type": "category",
  "referenceId": "{categoryId}",
  "target": "_self",
  "order": 1
}
```

#### Test 6: Update Menu Item

```bash
PUT http://localhost:3000/api/admin/menu-items/{itemId}
Content-Type: application/json

{
  "title": "Trang chủ (Updated)",
  "cssClass": "home-link"
}
```

#### Test 7: Delete Menu Item

```bash
DELETE http://localhost:3000/api/admin/menu-items/{itemId}
```

#### Test 8: Delete Menu (Cascade)

```bash
DELETE http://localhost:3000/api/admin/menus/{menuId}
```

---

## 🧪 Test Cases

### Test Case 1: Menu CRUD
- ✅ Create menu
- ✅ List menus with filters
- ✅ Get menu detail (tree and flat formats)
- ✅ Update menu
- ✅ Delete menu (cascade delete items)

### Test Case 2: Menu Item CRUD
- ✅ Create custom link item
- ✅ Create category reference item
- ✅ Create product reference item
- ✅ Create page reference item
- ✅ Create post reference item
- ✅ Get item detail
- ✅ Update item
- ✅ Delete item (prevent if has children)

### Test Case 3: Max Depth Validation
- ✅ Prevent creating item at level 3 (max depth = 3)
- ✅ Prevent moving item to level 3
- ✅ Allow creating item at level 0, 1, 2

### Test Case 4: Location Uniqueness
- ✅ Only 1 active menu per location
- ✅ Auto-inactive old menu when new one is set active

### Test Case 5: Circular Reference Prevention
- ✅ Prevent item being its own parent
- ✅ Prevent item being parent of its ancestor

### Test Case 6: Type Validation
- ✅ Custom type requires URL
- ✅ Non-custom types require referenceId
- ✅ ReferenceId must be valid ObjectId

### Test Case 7: Dynamic Link Resolution
- ✅ Custom links use URL directly
- ✅ Category links resolve to `/products?category={slug}`
- ✅ Product links resolve to `/products/{slug}`
- ✅ Page links resolve to `/{slug}`
- ✅ Post links resolve to `/blog/{slug}`

### Test Case 8: Deleted Reference Handling
- ✅ Check reference exists
- ✅ Check reference is active
- ✅ Return appropriate status for missing/inactive references

---

## 📊 Expected Test Results

When running `test-menu-api.ts`, you should see:

```
🧪 Testing Menu Management API Routes

   Base URL: http://localhost:3000

🔐 Logging in as admin...
   ✅ Login successful

   ✅ POST /api/admin/menus - Create menu
   ✅ GET /api/admin/menus - List menus
   ✅ GET /api/admin/menus/{id}?format=tree - Get menu detail (tree)
   ✅ GET /api/admin/menus/{id}?format=flat - Get menu detail (flat)
   ✅ POST /api/admin/menu-items - Create custom link item
   ✅ GET /api/admin/menu-items/{id} - Get menu item detail
   ✅ PUT /api/admin/menu-items/{id} - Update menu item
   ✅ PUT /api/admin/menus/{id} - Update menu
   ✅ DELETE /api/admin/menu-items/{id} - Delete menu item
   ✅ DELETE /api/admin/menus/{id} - Delete menu

📊 Test Summary:
─────────────────────────────────────────
   Total: 10
   ✅ Passed: 10
   ❌ Failed: 0
```

---

## 🐛 Troubleshooting

### Issue: "Unauthorized" Error
**Solution:** 
- Make sure you're logged in as admin
- Check session cookie is being sent
- Verify `TEST_ADMIN_EMAIL` and `TEST_ADMIN_PASSWORD` in `.env.local`

### Issue: "Menu not found" Error
**Solution:**
- Verify menu ID is correct
- Check menu exists in database

### Issue: "Maximum depth exceeded" Error
**Solution:**
- This is expected behavior - max depth is 3 levels (0, 1, 2)
- Try creating item at a lower level

### Issue: "Circular reference detected" Error
**Solution:**
- This is expected behavior - prevents infinite loops
- Check parent-child relationships

### Issue: "Reference ID is required" Error
**Solution:**
- For non-custom items, `referenceId` is required
- For custom items, `url` is required

---

## ✅ Phase 1 Completion Checklist

- [x] MongoDB collections created
- [x] Indexes created
- [x] All API routes implemented
- [x] Dynamic link resolution implemented
- [x] Max depth validation implemented
- [x] Deleted reference handling implemented
- [x] Test script created
- [x] Documentation created

---

## 🎯 Next Steps

After Phase 1 testing is complete:

1. **Phase 2:** Bulk Structure Update & Public API
   - Implement `POST /api/admin/menus/{id}/structure` (Drag & Drop)
   - Implement `GET /api/cms/menus/location/{location}` (Public API)
   - Implement caching

2. **Phase 3:** Admin UI - Menu List & Editor
   - Create menu list page
   - Create menu editor page

---

**Last Updated:** 12/12/2025

