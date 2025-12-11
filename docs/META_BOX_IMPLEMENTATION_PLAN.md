# Kế hoạch Triển khai Meta Box "Dữ liệu sản phẩm"

## Tổng quan
Triển khai Meta Box "Dữ liệu sản phẩm" (Product Data) theo đặc tả trong `meta_box.md`. Đây là component phức tạp với nhiều tab và tính năng quản lý sản phẩm.

## Cấu trúc Component

### Component chính: `ProductDataMetaBox.tsx`
- Location: `components/admin/products/ProductDataMetaBox.tsx`
- Layout: Vertical tabs với content area bên phải
- State management: Centralized state với React hooks

---

## Phase 1: Top Control Bar & Core Structure

### Task 1.1: Tạo component structure cơ bản
- [ ] Tạo file `ProductDataMetaBox.tsx`
- [ ] Setup vertical tabs layout (left: tabs, right: content)
- [ ] Implement tab switching logic
- [ ] Add responsive design (mobile: horizontal tabs)

### Task 1.2: Product Type Dropdown
- [ ] Create Select component với options:
  - Simple Product (default)
  - Variable Product
  - Grouped Product
  - External/Affiliate Product
- [ ] Implement onChange handler để show/hide tabs dựa trên type
- [ ] Add state management cho product type

### Task 1.3: Checkbox Options
- [ ] Virtual Product checkbox
  - Logic: Hide "Shipping" tab khi checked
- [ ] Downloadable Product checkbox
  - Logic: Show downloadable files section trong General tab khi checked
- [ ] State management và conditional rendering

---

## Phase 2: Tab Tổng quan (General)

### Task 2.1: Giá vốn (Cost Price)
- [ ] Input field với type="number"
- [ ] Decimal/Float validation
- [ ] Optional field (chỉ admin thấy)

### Task 2.2: Giá bán thường (Regular Price)
- [ ] Input field với validation (số, không âm)
- [ ] Required field indicator
- [ ] Real-time profit calculation:
  - Formula: Lợi nhuận = Regular Price - Cost Price
  - Display: "Lãi: 50.000đ (20%)" label bên cạnh input
  - Update khi giá thay đổi

### Task 2.3: Giá khuyến mãi (Sale Price)
- [ ] Input field với validation (phải < Regular Price)
- [ ] Schedule button/checkbox
- [ ] Date picker components (Start date, End date) khi schedule enabled
- [ ] Auto-calculate discount percentage: "Đang giảm 20%"
- [ ] Frontend logic: Chỉ hiển thị sale price nếu current date trong range

### Task 2.4: Downloadable Files Section
- [ ] Conditional render (chỉ hiện khi Downloadable checked)
- [ ] Table/List view cho files
- [ ] Add File button
- [ ] File row fields:
  - File name input
  - Upload button (file picker)
  - Download limit input
  - Download expiry date picker
- [ ] Remove file functionality
- [ ] File upload handler (Data URL for PoC, server upload later)

---

## Phase 3: Tab Kiểm kê kho hàng (Inventory)

### Task 3.1: SKU Field
- [ ] Input field với unique validation
- [ ] Real-time Ajax check (call API endpoint)
- [ ] Display error message nếu trùng
- [ ] Debounce input để tránh quá nhiều API calls

### Task 3.2: Manage Stock Checkbox
- [ ] Checkbox component
- [ ] Conditional fields:
  - Unchecked: Chỉ hiện Stock Status (In Stock/Out of Stock)
  - Checked: Hiện thêm Stock Quantity và Low Stock Threshold

### Task 3.3: Stock Quantity & Threshold
- [ ] Stock Quantity input (Integer, >= 0)
- [ ] Low Stock Threshold input (Integer, >= 0)
- [ ] Logic: Auto update status khi quantity = 0

### Task 3.4: Allow Backorders
- [ ] Select/Dropdown với options:
  - Không cho phép
  - Cho phép nhưng thông báo khách
  - Cho phép
- [ ] Logic explanation tooltip

### Task 3.5: Sold Individually
- [ ] Checkbox component
- [ ] Tooltip: "Chỉ cho phép mua tối đa 1 sản phẩm trong 1 đơn hàng"

---

## Phase 4: Tab Giao hàng (Shipping)

### Task 4.1: Conditional Display
- [ ] Hide tab khi Virtual Product = true
- [ ] Show/hide logic trong tab switching

### Task 4.2: Weight Field
- [ ] Input field (Number)
- [ ] Unit selector (kg/g) - có thể lấy từ settings
- [ ] Validation (>= 0)

### Task 4.3: Dimensions Fields
- [ ] 3 input fields: Length, Width, Height
- [ ] Unit selector (cm/m)
- [ ] Validation (>= 0)
- [ ] Layout: Inline hoặc grid

### Task 4.4: Shipping Class
- [ ] Dropdown/Select component
- [ ] Options từ API hoặc hardcoded:
  - Hàng cồng kềnh
  - Hàng dễ vỡ
  - Hàng thường
  - (Custom classes từ settings)
- [ ] Add new class option (optional)

---

## Phase 5: Tab Các sản phẩm được liên kết (Linked Products)

### Task 5.1: Upsells Section
- [ ] Search input với autocomplete
- [ ] Ajax search API integration
- [ ] Selected products display (chips/tags)
- [ ] Remove product functionality
- [ ] Data format: Array of product IDs

### Task 5.2: Cross-sells Section
- [ ] Tương tự Upsells
- [ ] Separate state management
- [ ] UI/UX giống Upsells

### Task 5.3: Product Search Component
- [ ] Reusable component: `ProductSearchInput.tsx`
- [ ] Debounced search
- [ ] Loading state
- [ ] Product suggestion list với image, name, price
- [ ] Add to selection on click

---

## Phase 6: Tab Các thuộc tính (Attributes)

### Task 6.1: Add Attribute Section
- [ ] Select box: Global Attributes vs Custom Attribute
- [ ] Add button
- [ ] Fetch global attributes từ API

### Task 6.2: Attribute Item Component
- [ ] Name field (read-only nếu global, editable nếu custom)
- [ ] Values input với Tags/Chips UI
- [ ] Auto-suggest từ existing values trong DB
- [ ] Add new value on Enter
- [ ] Remove value functionality

### Task 6.3: Color Picker Integration
- [ ] Detect nếu attribute name = "Màu sắc" hoặc "Color"
- [ ] Show color picker thay vì text input
- [ ] Display color swatch (square với màu)
- [ ] Hex color input/selector
- [ ] Store both color name và hex code

### Task 6.4: "Used for variations" Checkbox
- [ ] Checkbox trong mỗi attribute
- [ ] Logic: Enable Variations tab khi có attribute với checkbox này checked
- [ ] Visual indicator khi checked

---

## Phase 7: Tab Các biến thể (Variations) - Phức tạp nhất

### Task 7.1: Conditional Display
- [ ] Chỉ hiện khi Product Type = Variable Product
- [ ] Chỉ hiện khi có attribute với "Used for variations" = true

### Task 7.2: Generate Variations Button
- [ ] "Tạo biến thể từ tất cả thuộc tính" button
- [ ] Cartesian Product algorithm:
  - Input: Array of attribute values arrays
  - Output: All combinations
  - Example: [Đỏ, Xanh] x [S, M] = 4 variations
- [ ] Confirmation dialog nếu có variations cũ
- [ ] Generate và display trong table

### Task 7.3: Variations Table View (Spreadsheet-like)
- [ ] Table component với columns:
  - Image (click to upload)
  - Name (read-only, auto-generated)
  - SKU
  - Cost Price
  - Regular Price
  - Sale Price
  - Stock Quantity
  - Actions (Delete, Duplicate)
- [ ] Inline editing:
  - Click cell để edit
  - Tab key để move to next cell
  - Enter để save
  - Escape để cancel
- [ ] Row selection (checkbox)
- [ ] Bulk actions (Delete selected, Update prices)

### Task 7.4: Variation Image Upload
- [ ] Click image cell → Open file picker
- [ ] Preview image
- [ ] Upload handler (Data URL for PoC)
- [ ] Remove image

### Task 7.5: Performance Optimization
- [ ] Virtual scrolling nếu variations > 100
- [ ] Lazy load images
- [ ] Debounce inline edits

---

## Phase 8: Tab Nâng cao (Advanced)

### Task 8.1: Purchase Note
- [ ] Textarea component
- [ ] Placeholder: "Gửi cho khách sau khi mua xong (trong email)"
- [ ] Character counter (optional)

### Task 8.2: Menu Order
- [ ] Number input (Integer)
- [ ] Tooltip: "Dùng để sắp xếp vị trí hiển thị sản phẩm"
- [ ] Default: 0

### Task 8.3: Enable Reviews
- [ ] Checkbox component
- [ ] Default: checked
- [ ] Tooltip: "Bật/tắt comment và rating"

---

## Phase 9: Sticky Action Bar

### Task 9.1: Sticky Bar Component
- [ ] Fixed position ở bottom của viewport
- [ ] Z-index cao để luôn trên cùng
- [ ] Shadow/elevation để tách biệt với content

### Task 9.2: Action Buttons
- [ ] Save button (primary)
  - Save to draft
  - Save and publish (nếu chưa publish)
- [ ] Preview button
  - Link to preview page
  - Open in new tab
- [ ] Loading states
- [ ] Success/Error notifications

### Task 9.3: Integration với ProductForm
- [ ] Connect với form state
- [ ] Validation trước khi save
- [ ] API call để save data

---

## Phase 10: Integration & Polish

### Task 10.1: State Management
- [ ] Centralize state trong ProductDataMetaBox
- [ ] Lift state up to ProductForm nếu cần
- [ ] Sync với existing ProductForm state

### Task 10.2: Validation
- [ ] Frontend validation (onBlur, onChange)
- [ ] Error messages display
- [ ] Required fields indicators
- [ ] Backend validation (API level)

### Task 10.3: Data Persistence
- [ ] Load existing data khi edit product
- [ ] Save to API endpoint
- [ ] Handle errors và retry logic

### Task 10.4: UX Improvements
- [ ] Loading states cho async operations
- [ ] Success/Error toasts
- [ ] Confirmation dialogs cho destructive actions
- [ ] Keyboard shortcuts (Ctrl+S to save)
- [ ] Auto-save draft (optional, future)

### Task 10.5: Testing
- [ ] Test tất cả product types
- [ ] Test variations generation
- [ ] Test validation
- [ ] Test edge cases (empty values, large datasets)

---

## Component Files Structure

```
components/admin/products/
├── ProductDataMetaBox.tsx          # Main component
├── ProductDataMetaBox/
│   ├── TopControlBar.tsx          # Product type + checkboxes
│   ├── GeneralTab.tsx             # General tab content
│   ├── InventoryTab.tsx           # Inventory tab content
│   ├── ShippingTab.tsx            # Shipping tab content
│   ├── LinkedProductsTab.tsx      # Linked products tab content
│   ├── AttributesTab.tsx          # Attributes tab content
│   ├── VariationsTab.tsx           # Variations tab content
│   ├── AdvancedTab.tsx            # Advanced tab content
│   ├── VariationTable.tsx        # Variations table component
│   ├── AttributeItem.tsx          # Single attribute component
│   ├── ProductSearchInput.tsx    # Reusable search component
│   └── StickyActionBar.tsx       # Sticky bar component
```

---

## API Endpoints Cần Thiết

- `GET /api/admin/products/attributes` - Lấy global attributes
- `GET /api/admin/products/search?q=...` - Search products cho linked products
- `POST /api/admin/products/[id]/validate-sku` - Validate SKU uniqueness
- `GET /api/admin/products/[id]/variations` - Lấy variations
- `POST /api/admin/products/[id]/variations` - Save variations

---

## Dependencies Cần Thêm

- Date picker library (react-datepicker hoặc similar)
- Color picker library (react-color hoặc similar)
- Virtual scrolling library (react-window hoặc react-virtualized) - nếu cần
- Debounce utility (lodash.debounce hoặc custom)

---

## Tracking Progress

### Phase 1: Top Control Bar & Core Structure
- Status: ⏳ Pending
- Estimated: 4 hours

### Phase 2: Tab Tổng quan (General)
- Status: ⏳ Pending
- Estimated: 6 hours

### Phase 3: Tab Kiểm kê kho hàng (Inventory)
- Status: ⏳ Pending
- Estimated: 5 hours

### Phase 4: Tab Giao hàng (Shipping)
- Status: ⏳ Pending
- Estimated: 3 hours

### Phase 5: Tab Các sản phẩm được liên kết
- Status: ⏳ Pending
- Estimated: 4 hours

### Phase 6: Tab Các thuộc tính
- Status: ⏳ Pending
- Estimated: 6 hours

### Phase 7: Tab Các biến thể
- Status: ⏳ Pending
- Estimated: 10 hours (phức tạp nhất)

### Phase 8: Tab Nâng cao
- Status: ⏳ Pending
- Estimated: 2 hours

### Phase 9: Sticky Action Bar
- Status: ⏳ Pending
- Estimated: 3 hours

### Phase 10: Integration & Polish
- Status: ⏳ Pending
- Estimated: 6 hours

**Tổng ước tính: ~49 hours**

---

---

## UX/UI Design Guidelines

### 1. Visual Design Principles

#### 1.1 Layout & Spacing
- **Vertical Tabs Layout:**
  - Left sidebar: 200px width (fixed), vertical tabs list
  - Right content: Flexible width, min 600px
  - Tab item: Padding 12px 16px, hover state với background change
  - Active tab: Border-left indicator (3px, primary color), bold text
  - Spacing giữa tabs: 4px gap

- **Content Area:**
  - Section spacing: 24px giữa các sections
  - Field spacing: 16px giữa các fields trong cùng section
  - Group related fields với subtle border hoặc background
  - Max content width: 800px để tránh quá rộng

- **Top Control Bar:**
  - Fixed height: 60px
  - Padding: 16px horizontal
  - Background: Slightly darker than content area
  - Border-bottom: 1px solid border để tách biệt

#### 1.2 Typography & Readability
- **Hierarchy:**
  - Tab labels: 14px, font-weight 500
  - Section titles: 16px, font-weight 600
  - Field labels: 13px, font-weight 500, color: muted-foreground
  - Input text: 14px, font-weight 400
  - Helper text: 12px, color: muted-foreground

- **Readability:**
  - Line height: 1.5 cho body text
  - Line height: 1.4 cho labels
  - Contrast ratio: Minimum 4.5:1 cho text
  - Use monospace font cho SKU, codes

#### 1.3 Color & Visual Hierarchy
- **Color Scheme:**
  - Primary: Brand color cho actions, active states
  - Success: Green cho positive feedback (profit, savings)
  - Warning: Orange/Amber cho warnings (low stock, validation)
  - Error: Red cho errors, destructive actions
  - Muted: Gray cho secondary info, disabled states

- **Visual Indicators:**
  - Required fields: Asterisk (*) màu red, hoặc "Required" badge
  - Optional fields: "(Tùy chọn)" text màu muted
  - Real-time calculations: Highlight với subtle background (yellow tint)
  - Profit display: Green text với icon (↑) khi positive
  - Discount badge: Red/Orange badge với "%" icon

#### 1.4 Icons & Visual Cues
- **Icon Usage:**
  - Tab icons: 16px, consistent style (Lucide icons)
  - Action icons: 18px cho buttons
  - Status icons: 14px cho inline indicators
  - Use icons để reinforce meaning (💰 cho price, 📦 cho inventory)

- **Visual Feedback:**
  - Hover states: Subtle background change, cursor pointer
  - Active states: Background color change, border highlight
  - Focus states: Ring outline (2px, primary color)
  - Disabled states: Reduced opacity (0.5), cursor not-allowed

---

### 2. Interactive Elements

#### 2.1 Input Fields
- **Standard Inputs:**
  - Height: 40px (comfortable click target)
  - Border: 1px solid, rounded corners (6px)
  - Focus: Border color change + ring outline
  - Error state: Red border + error message below
  - Success state: Green border (khi validation pass)

- **Number Inputs:**
  - Show increment/decrement buttons (optional)
  - Format numbers với thousand separators (1.000.000đ)
  - Currency symbol: "đ" hoặc "VND" suffix
  - Step values: 1000 cho price, 1 cho quantity

- **Textarea:**
  - Min height: 80px
  - Resizable: Vertical only
  - Character counter (nếu có limit)

#### 2.2 Buttons
- **Primary Actions:**
  - Height: 40px
  - Padding: 12px 24px
  - Background: Primary color
  - Text: White, font-weight 500
  - Hover: Darker shade
  - Loading: Spinner icon + disabled state

- **Secondary Actions:**
  - Outline style (border, transparent background)
  - Hover: Background fill

- **Icon Buttons:**
  - Square, 36px x 36px
  - Icon centered, 18px size
  - Tooltip on hover

#### 2.3 Dropdowns & Selects
- **Select Box:**
  - Same height as inputs (40px)
  - Custom dropdown với search (nếu nhiều options)
  - Selected value: Highlighted
  - Keyboard navigation: Arrow keys, Enter to select

- **Multi-select:**
  - Tags/Chips display cho selected items
  - Remove button (X) on each chip
  - Max height dropdown: 300px với scroll

#### 2.4 Checkboxes & Radio Buttons
- **Size:**
  - Checkbox: 18px x 18px
  - Radio: 18px diameter
  - Clickable area: Extend to label (full row clickable)

- **States:**
  - Unchecked: Border only
  - Checked: Filled với checkmark icon
  - Indeterminate: Dash icon (nếu cần)
  - Disabled: Grayed out

#### 2.5 Date Pickers
- **Calendar UI:**
  - Popover/dropdown style
  - Month/year navigation arrows
  - Today highlight
  - Selected date: Primary color background
  - Range selection: Highlight range với gradient

- **Input Display:**
  - Format: DD/MM/YYYY
  - Icon button để open picker
  - Clear button (X) khi có value

---

### 3. Feedback & States

#### 3.1 Loading States
- **Skeleton Loaders:**
  - Use cho initial load của tabs
  - Animated shimmer effect
  - Match actual content layout

- **Spinner Indicators:**
  - Inline spinner: 16px, centered
  - Button spinner: Replace icon, keep button disabled
  - Full page loader: Overlay với backdrop blur

- **Progress Indicators:**
  - Upload progress: Progress bar với percentage
  - Multi-file upload: Individual progress per file

#### 3.2 Success Feedback
- **Toast Notifications:**
  - Position: Top-right corner
  - Auto-dismiss: 3 seconds
  - Success icon + message
  - Slide-in animation

- **Inline Success:**
  - Green checkmark icon
  - Subtle green background
  - Fade out sau 2 seconds

#### 3.3 Error Handling
- **Validation Errors:**
  - Red border on input
  - Error message below field (12px, red text)
  - Icon: Alert circle (16px)
  - Real-time validation: Show on blur hoặc after typing stops

- **API Errors:**
  - Toast notification (error style)
  - Retry button nếu applicable
  - Detailed error message trong modal nếu cần

- **Form-level Errors:**
  - Summary box ở top của form
  - List all errors với links to fields
  - Scroll to first error on submit

#### 3.4 Empty States
- **No Data:**
  - Illustration hoặc icon (64px)
  - Message: "Chưa có dữ liệu"
  - CTA button: "Thêm mới"
  - Centered layout

- **No Search Results:**
  - Icon + message
  - Suggest alternative search terms
  - Clear search button

---

### 4. Advanced Interactions

#### 4.1 Inline Editing (Variations Table)
- **Cell Editing:**
  - Click cell: Show input overlay
  - Input: Full width, auto-focus, select all text
  - Save: Enter key hoặc click outside
  - Cancel: Escape key
  - Visual: Border highlight khi editing

- **Keyboard Navigation:**
  - Tab: Next cell
  - Shift+Tab: Previous cell
  - Arrow keys: Navigate cells
  - Enter: Save và move down
  - Escape: Cancel edit

- **Bulk Editing:**
  - Select multiple rows: Checkbox column
  - Bulk actions bar: Appear khi có selection
  - Actions: Delete, Update prices, Set stock
  - Confirmation dialog cho destructive actions

#### 4.2 Drag & Drop
- **File Upload:**
  - Drop zone: Dashed border, highlighted on drag over
  - Visual feedback: Border color change, icon animation
  - File list: Show preview, progress, remove button

- **Reordering:**
  - Drag handle icon
  - Visual feedback: Ghost image, drop indicator
  - Smooth animation

#### 4.3 Auto-save & Drafts
- **Auto-save Indicator:**
  - Status text: "Đã lưu" / "Đang lưu..." / "Chưa lưu"
  - Icon: Checkmark / Spinner / Dot
  - Position: Top-right của form
  - Subtle, không intrusive

- **Unsaved Changes Warning:**
  - Detect changes
  - Warn khi navigate away
  - Browser beforeunload event

#### 4.4 Real-time Calculations
- **Profit Calculation:**
  - Update on input change (debounced 300ms)
  - Display: Badge hoặc label next to price
  - Format: "Lãi: 50.000đ (20%)"
  - Color: Green nếu positive, red nếu negative
  - Animation: Fade in khi value changes

- **Discount Percentage:**
  - Calculate: ((Regular - Sale) / Regular) * 100
  - Display: "Đang giảm 20%" badge
  - Position: Next to Sale Price input
  - Color: Red/Orange để highlight

---

### 5. Accessibility (A11y)

#### 5.1 Keyboard Navigation
- **Tab Order:**
  - Logical flow: Top to bottom, left to right
  - Skip links cho main sections
  - Focus trap trong modals

- **Keyboard Shortcuts:**
  - Ctrl+S: Save
  - Ctrl+P: Preview
  - Escape: Close modal/dropdown
  - Enter: Submit form (nếu valid)
  - Arrow keys: Navigate tabs, dropdowns

#### 5.2 Screen Readers
- **ARIA Labels:**
  - All interactive elements có aria-label
  - Form fields có aria-describedby cho help text
  - Error messages linked với aria-errormessage
  - Status updates với aria-live regions

- **Semantic HTML:**
  - Use proper form elements
  - Fieldset và legend cho grouped fields
  - Labels associated với inputs (htmlFor)

#### 5.3 Visual Accessibility
- **Color Contrast:**
  - Minimum 4.5:1 cho normal text
  - Minimum 3:1 cho large text
  - Don't rely solely on color (use icons, patterns)

- **Focus Indicators:**
  - Visible focus ring (2px, high contrast)
  - Focus-visible cho keyboard navigation
  - Skip focus ring cho mouse users (optional)

---

### 6. Mobile Responsiveness

#### 6.1 Layout Adaptations
- **Breakpoints:**
  - Mobile: < 768px
  - Tablet: 768px - 1024px
  - Desktop: > 1024px

- **Tab Layout:**
  - Desktop: Vertical tabs (left sidebar)
  - Mobile: Horizontal tabs (top, scrollable)
  - Active tab: Underline indicator (mobile)

#### 6.2 Touch Targets
- **Minimum Size:**
  - Buttons: 44px x 44px
  - Inputs: 44px height
  - Checkboxes: 44px x 44px (extend clickable area)

- **Spacing:**
  - Minimum 8px gap giữa touch targets
  - Padding: 16px cho content areas

#### 6.3 Mobile-Specific UX
- **Input Types:**
  - Use appropriate input types (tel, email, number)
  - Show correct keyboard (numeric cho prices)
  - Date picker: Native mobile date picker

- **Modals & Dropdowns:**
  - Full-screen modals trên mobile
  - Bottom sheet cho actions
  - Swipe to dismiss

---

### 7. Performance & Optimization

#### 7.1 Loading Performance
- **Lazy Loading:**
  - Load tab content khi tab được click
  - Lazy load images (Intersection Observer)
  - Code splitting cho heavy components

- **Debouncing:**
  - Search inputs: 300ms
  - Real-time calculations: 300ms
  - SKU validation: 500ms

#### 7.2 Rendering Optimization
- **Virtual Scrolling:**
  - Variations table: Virtual scroll nếu > 50 rows
  - Product search results: Virtual scroll nếu > 20 items

- **Memoization:**
  - Memo expensive calculations
  - useMemo cho filtered lists
  - useCallback cho event handlers

#### 7.3 Perceived Performance
- **Optimistic Updates:**
  - Update UI immediately, sync với server sau
  - Rollback nếu error

- **Skeleton Screens:**
  - Show skeleton thay vì blank screen
  - Match actual content layout

---

### 8. Error Prevention & Recovery

#### 8.1 Input Validation
- **Real-time Validation:**
  - Validate on blur (không interrupt typing)
  - Show errors immediately
  - Clear errors khi user fixes

- **Smart Defaults:**
  - Auto-fill related fields
  - Suggest values từ history
  - Format input automatically (currency, dates)

#### 8.2 Confirmation Dialogs
- **Destructive Actions:**
  - Delete: "Bạn có chắc muốn xóa?"
  - Clear form: "Bạn có chắc muốn xóa tất cả?"
  - Generate variations: "Sẽ tạo X biến thể. Tiếp tục?"

- **Unsaved Changes:**
  - Warn khi navigate away
  - Offer: Save, Discard, Cancel

#### 8.3 Recovery Options
- **Undo/Redo:**
  - Undo stack cho variations table
  - Toast với undo button
  - Keyboard shortcut: Ctrl+Z

- **Auto-save:**
  - Save draft automatically
  - Restore từ draft khi reload
  - Show "Restore draft?" prompt

---

### 9. Micro-interactions & Animations

#### 9.1 Transitions
- **Tab Switching:**
  - Fade transition (200ms)
  - Smooth content swap

- **Show/Hide:**
  - Conditional fields: Slide down (300ms)
  - Smooth height transition

#### 9.2 Feedback Animations
- **Button Clicks:**
  - Ripple effect (optional)
  - Scale down slightly (0.95) on press

- **Success Actions:**
  - Checkmark animation
  - Confetti effect (optional, cho major actions)

#### 9.3 Loading Animations
- **Spinners:**
  - Smooth rotation
  - Consistent speed (1s per rotation)

- **Skeleton:**
  - Shimmer effect
  - Pulse animation

---

### 10. Component-Specific UX Guidelines

#### 10.1 Product Type Selector
- **Visual:**
  - Large, prominent dropdown
  - Icon next to each option
  - Description text below options

- **Feedback:**
  - Show affected tabs khi change type
  - Warning nếu switching sẽ mất data
  - Confirmation nếu có unsaved changes

#### 10.2 Price Inputs
- **Grouping:**
  - Group related price fields
  - Visual connection với lines/background
  - Profit calculation prominent

- **Formatting:**
  - Auto-format với thousand separators
  - Currency symbol consistent
  - Clear decimal handling

#### 10.3 Variations Table
- **Table Design:**
  - Sticky header khi scroll
  - Zebra striping cho readability
  - Column resizing (optional)
  - Sortable columns (optional)

- **Inline Editing:**
  - Highlight row khi editing
  - Save indicator (checkmark)
  - Error highlight nếu validation fails

#### 10.4 Attribute Management
- **Add Attribute:**
  - Prominent "Add" button
  - Quick add từ dropdown
  - Duplicate detection

- **Value Input:**
  - Tags/Chips với remove button
  - Color swatches cho color attributes
  - Auto-suggest với keyboard navigation

---

## Notes

- Sử dụng existing UI components từ `components/ui`
- Follow existing patterns trong ProductForm
- Prioritize UX: Real-time calculations, inline editing, smooth interactions
- Performance: Lazy load, virtual scrolling cho large datasets
- Accessibility: Keyboard navigation, ARIA labels
- **UX/UI First:** Mọi interaction phải smooth, intuitive, và provide clear feedback
