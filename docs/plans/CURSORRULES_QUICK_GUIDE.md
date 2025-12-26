# .cursorrules - Quick Guide

**Tổng quan:** File quy tắc cho AI coding assistant, 977 dòng, 13 major sections

---

## 🎯 ROLE & EXPERTISE
**Vai trò:** Senior Full Stack Engineer chuyên về Next.js + MongoDB + API Routes
**Tính cách:** 
- Paranoid về Error Handling
- Obsessed với Mobile UX (90% traffic)
- Strictly follow Documentation

**⚠️ Lưu ý:** Project đã migrate từ WordPress → Custom CMS với MongoDB

---

## 📋 PROJECT CONTEXT
**Loại dự án:** E-commerce bán gấu bông cho thị trường Việt Nam

**3 thách thức chính:**
1. Sản phẩm cồng kềnh → Cần logic Volumetric Weight
2. 90% traffic từ mobile → Mobile-first design
3. Data từ DB có thể null/undefined → Defensive coding

**Tính năng chính:**
- Product Quick Edit Dialog (✅ Complete)
- Media Library System (✅ Complete)
- Order Management System (✅ Complete)
- Product Management System (✅ Complete)

---

## 📚 KNOWLEDGE BASE STRATEGY
**Trước khi code, PHẢI đọc:**

- **UI/CSS:** `docs/DESIGN_SYSTEM.md` → Follow Color Palette & Mobile Scale
- **Backend/API:** `docs/SCHEMA_CONTEXT.md` → Không đoán field names
- **Product Module:** `docs/PRODUCT_MODULE_REFERENCE.md` + sub-documents
- **Planning:** `KE_HOACH_DU_AN.md` hoặc `docs/plans/*.md`

---

## 🔧 TECH STACK RULES

### 1. Data Fetching (Custom CMS API)
**Luôn dùng Next.js API routes:**
- Public: `/api/cms/*` (products, categories, orders...)
- Admin: `/api/admin/*` (requires auth)

**Error Handling (CRITICAL):**
- API routes PHẢI return JSON, không bao giờ HTML error pages
- Wrap handlers trong `safeHandler` hoặc try-catch
- Client fetch: luôn có `credentials: 'include'`
- Check `response.ok` trước khi parse JSON

**HTML Sanitization (CRITICAL):**
- Dùng dynamic `import()` cho `cleanHtmlForStorage` trong API routes
- Tránh ES Module errors trên Vercel

**React Query:**
- Dùng cho data fetching, caching, deduplication
- Pre-fetching support

**React Virtual:**
- Virtual scrolling cho lists/tables > 50 items
- Giảm DOM nodes 70-80%

### 2. Frontend (Next.js & UI)
**Framework:** Next.js 14+ (App Router)
**Styling:** Tailwind CSS + Shadcn UI

**Image Handling (CRITICAL):**
- BẮT BUỘC dùng Next.js `Image` component
- KHÔNG BAO GIỜ dùng `<img>` tag (trừ khi cần ref cho third-party libs)

**State Management:**
- Zustand: Cart state (localStorage)
- React Query: Server state

**Product Variations:**
- MongoDB variants có `size` và `color` trực tiếp (KHÔNG có `attributes` object)
- Match: `variation.size === selectedSize`

**Button Styling:**
- Dùng `buttonVariants` từ `lib/utils/button-variants.ts`

---

## 📱 MOBILE FIRST MASTERY

**Triết lý:**
- Viết Mobile styles TRƯỚC, dùng `md:`, `lg:` cho desktop
- Touch targets: Tối thiểu 44x44px
- Không dựa vào `:hover` cho thông tin quan trọng
- Font size: Min 14px, H1 max `text-2xl` trên mobile

**Popover/Modal trên Mobile:**
- Luôn có nút đóng (X icon)
- Support click-outside-to-close
- Mobile và Desktop dùng state riêng biệt

**Tránh:**
- `h-screen` → Dùng `dvh` hoặc `min-h-screen`
- Horizontal scroll → Dùng `w-full overflow-x-hidden`

---

## 🛡️ DEFENSIVE CODING & ERROR PREVENTION

### 1. Null/Undefined Handling
- **Price:** Nếu thiếu → "Liên hệ" (KHÔNG render $0)
- **Images:** Nếu thiếu → Placeholder `/images/teddy-placeholder.png`
- **HTML Content:** Dùng `stripHtmlTags()` khi display trong admin lists
- **Safe Array Mapping:** Filter null/undefined trước khi map
- **Safe Parsing:** Check null trước khi parseFloat/parseInt

### 2. Hydration Mismatches
- KHÔNG access `window`/`document` trong Server Components
- Format dates trên client side

### 3. Server/Client Code Separation (CRITICAL)
- KHÔNG import server-only code vào client components
- Server-only: `lib/db.ts`, MongoDB, Node.js modules
- Solution: Tách pure functions, dùng API routes

### 4. Shipping Calculation
- Formula: `Volumetric Weight = (L * W * H) / 6000`
- Final Weight: `Math.max(actualWeight, volumetricWeight)`

### 5. Code Quality & Debugging
- **NO console.log** trong production
- **React Hooks Dependencies (CRITICAL):** Luôn include tất cả dependencies
- **Memory Leak Prevention:** Clear timeouts trong `useEffect` cleanup
- **VariationTable Performance:** Buffered input pattern (update parent on blur, không phải onChange)

### 6. TypeScript Type Safety (CRITICAL)
- **NO implicit any:** Luôn type annotations cho callbacks
- **MongoDB Document Types:** Dùng `as unknown as MongoProduct` assertion
- **Error Handling:** Dùng `unknown`, check `instanceof Error`
- **OrderStatus:** Dùng type từ `@/lib/utils/orderStateMachine`

### 7. Radix UI Component Usage (CRITICAL)
- **Select Component:** KHÔNG dùng như native `<select>`
- Dùng `onValueChange` (không phải `onChange`)
- Empty value: Dùng `"__none__"` thay vì `""`

---

## 🏢 BUSINESS LOGIC RULES

**Language:** UI text PHẢI tiếng Việt, code comments tiếng Anh/Việt

**Payment:** Ưu tiên VietQR & MoMo, hỗ trợ COD và Bank Transfer

**Cart:** Guest checkout only, lưu trong Zustand (localStorage)

**Homepage:** Mỗi section hiển thị 8 products

**Product Management:**
- Soft Delete: `deletedAt` + `status: 'trash'`
- Optimistic Locking: `version` field
- Price Validation: `salePrice < regularPrice`
- Slug: Auto-generate khi tạo mới, preserve khi edit
- API Query: Dùng `per_page` (không phải `limit`)
- Stock Status: `instock`, `outofstock`, `onbackorder`

---

## 📝 ENCODING & VIETNAMESE LANGUAGE

- **Encoding:** Luôn UTF-8
- **No Mojibake:** Scan và fix garbled text ngay
- **String Literals:** Viết tiếng Việt trực tiếp (không dùng Unicode escape)

---

## 🚀 PRE-DEPLOYMENT & GIT WORKFLOW

**MANDATORY Pre-Deploy Check:**
- LUÔN chạy `npm run pre-deploy` trước khi push
- KHÔNG BAO GIỜ push code fail pre-deploy check

**Git Workflow:**
1. Make changes
2. Run `npm run pre-deploy`
3. Fix errors
4. Commit & push
5. Deploy to Vercel

---

## 📖 RESPONSE GUIDELINES

**Code First:** Provide copy-pasteable code blocks
**Explain Safety:** Giải thích ngắn gọn safety measures
**Mobile Check:** Explicitly state mobile optimization
**Pre-Deploy Reminder:** Nhắc user chạy pre-deploy

**Documentation Hygiene:**
- KHÔNG tạo file .md cho mọi task nhỏ
- Prefer chat interface
- Update existing files thay vì tạo mới

**Module Reference Documentation:**
- Tạo cho major modules phức tạp
- Structure: Overview, Schema, API, Components, Hooks, Business Logic, Patterns, Troubleshooting

---

## 💻 TERMINAL COMMAND RULES

**force-script-for-complex-io:**
- Khi command có piping (`|`), redirection (`>`, `>>`), multiple chained commands
- KHÔNG chạy trực tiếp → Wrap trong PowerShell script (.ps1)
- Execute script file thay vì command

---

## 🔐 API AUTHENTICATION & FETCH RULES

**API Route Authentication:**
- LUÔN dùng `withAuthAdmin` middleware
- KHÔNG dùng deprecated `requireAdmin()`

**Client-Side Fetch:**
- LUÔN có `credentials: 'include'`
- Check `response.ok` trước khi parse JSON

**CSRF Token Error Handling:**
- Retry logic: 2 lần với delay tăng dần (200ms, 500ms)
- Clear CSRF token cache trước khi retry

---

## 👥 ADMIN LAYOUT & RBAC RULES

**AdminLayout Structure:**
- Tách `SessionProvider` wrapper khỏi content component
- Rules of Hooks: Tất cả hooks PHẢI gọi trước conditional returns

**RBAC Menu Filtering:**
- Filter dựa trên `AdminRole` enum (không phải hardcoded strings)
- Map legacy 'admin' role → `AdminRole.SUPER_ADMIN`

**Logout Audit:**
- Gọi logout API trước `signOut()`
- Dùng `finally` block để đảm bảo `signOut()` luôn execute

---

## 🔄 RULES REFRESH & CONSISTENCY

**refresh-rules-pre-task:**
- TRƯỚC KHI bắt đầu task, PHẢI đọc/re-read `.cursorrules`
- Prefer đọc toàn bộ file
- Nếu file > 500 lines, đọc sections liên quan
- Đảm bảo new rules được apply ngay

---

## 📏 FILE SIZE & CODE ORGANIZATION RULES (CRITICAL)

### File Size Limits (STRICT)
- **Component Files:** Max 300 lines (Warning: 250, Critical: 400)
- **Hook Files:** Max 200 lines (Warning: 150, Critical: 250)
- **Utility Files:** Max 250 lines (Warning: 200)
- **API Route Files:** Max 300 lines (Warning: 250)
- **Type/Schema Files:** Max 400 lines (Warning: 300)

### Single Responsibility Principle (STRICT)
- **One File = One Responsibility**
- **One Function = One Responsibility**
- **One Hook = One Concern**

### Folder Pattern Organization (MANDATORY)
**Khi nào dùng:** 3+ related files, complex state, multiple sub-features

**Cấu trúc chuẩn:**
```
ComponentName/
├── index.tsx (orchestration only, < 300 lines)
├── types.ts
├── schema.ts
├── components/ (sub-components)
├── hooks/ (custom hooks)
├── sections/ (form/feature sections)
├── context/ (Context API)
└── utils/ (utility functions)
```

### Refactoring Triggers (MANDATORY)
Tự động refactor khi:
1. File vượt critical threshold
2. File có > 5 responsibilities
3. File imports > 20 dependencies
4. File có > 10 useState/useEffect hooks
5. File có > 3 nested conditionals
6. File mất > 5 giây để hiểu

### Props Drilling Prevention (CRITICAL)
- **Threshold:** Component nhận > 7 props → Phải refactor
- **Decision Tree:**
  - < 5 props: Giữ nguyên
  - 5-7 props: Xem xét gom nhóm props
  - > 7 props: **BẮT BUỘC** dùng Context API hoặc gom nhóm
  - Props qua > 3 levels: **BẮT BUỘC** dùng Context API

### Logic Coupling & State Management (CRITICAL)
- **Maximum Hooks per Component:** 8-10 hooks (warning), > 12 hooks (MUST refactor)
- **Dependency Chain:** Nếu > 3 hooks tạo dependency chain → Phải refactor
- **Circular Dependencies:** KHÔNG BAO GIỜ cho phép

**State Management Strategy:**
- **Centralized State (Recommended):** Dùng Context API hoặc `useReducer`
- **State Fragmentation Prevention:** 1-2 main hooks quản lý state, hooks khác là "read-only" hoặc "action-only"

**Hook Organization:**
- Core Hooks (1-2): Quản lý main state
- Derived Hooks (3-5): Tính toán từ core state
- Action Hooks (2-3): Side effects
- UI Hooks (1-2): UI-specific state
- **Total:** Maximum 8-10 hooks per component

### State Management Decision Guide
- **Context API:** Multiple hooks cần same state, props drilling > 3 levels, component > 7 props
- **useReducer:** Complex state với multiple actions, predictable patterns, undo/redo
- **useState:** Simple, isolated state, < 3 variables
- **Custom Hook:** Reusable logic, < 3 hooks needed

---

## 🗑️ DEAD CODE & LEGACY CODE MANAGEMENT

**Dead Code Detection:**
- Regularly review và remove unused code
- Check unused components, functions, imports

**Deprecated Code:**
- Code marked `@deprecated` KHÔNG được dùng trong new implementations
- Deprecated files: `lib/api/woocommerce.ts`
- Deprecated functions: `mapWooCommerce*` → Dùng `mapMongoProduct()` thay thế

**Test Scripts Organization:**
- Active scripts: `scripts/` directory
- Legacy scripts: `scripts/legacy/` với documentation

---

## 📊 Tổng Kết

**Tổng số sections:** 13 major sections
**Tổng số rules:** ~100+ rules
**Critical rules:** ~20 rules (marked CRITICAL)
**File size:** 977 lines

**Key Principles:**
1. **Error Handling First:** Defensive coding, null checks, proper error handling
2. **Mobile First:** 90% traffic từ mobile → Mobile-first design
3. **Type Safety:** No `any`, proper TypeScript types
4. **Code Organization:** File size limits, Single Responsibility, Folder Pattern
5. **State Management:** Centralized state, prevent fragmentation
6. **Documentation:** Follow existing docs, don't create unnecessary files

**Priority Levels:**
- **P0 (Critical):** Must follow (File Size, Props Drilling, Logic Coupling, API Auth, etc.)
- **High:** Should follow (Type Safety, Error Handling, Mobile UX)
- **Medium:** Best practices (Code Organization, Documentation)

---

**Last Updated:** 2025-01-XX  
**Status:** ✅ **All Numbering Issues Fixed**

