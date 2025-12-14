# 🎨 MENU LAYOUT DESIGN - MOCK CHI TIẾT

**Last Updated:** 2025-01-XX  
**Based on:** `menu_gau_bong.md` specification

---

## 📐 1. MEGA MENU "SẢN PHẨM" - Layout Chi Tiết

### Desktop Layout (≥1024px)

#### Cấu trúc 3 cột:

```
┌─────────────────────────────────────────────────────────────────┐
│  SẢN PHẨM                                                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │ THEO LOẠI    │  │ THEO SIZE    │  │ BANNER       │         │
│  ├──────────────┤  ├──────────────┤  ├──────────────┤         │
│  │              │  │              │  │              │         │
│  │ 🧸 Gấu Teddy │  │ 📏 Khổng lồ  │  │  [Banner     │         │
│  │    (12 SP)   │  │    (>1m)     │  │   Image]     │         │
│  │              │  │    (8 SP)    │  │              │         │
│  │ 🎭 Thú bông  │  │ 📐 Vừa       │  │  "Sản phẩm   │         │
│  │    hoạt hình │  │    (50-80cm) │  │   nổi bật"   │         │
│  │    HOT 🔥    │  │    (25 SP)   │  │              │         │
│  │              │  │              │  │  [Badge: NEW]│         │
│  │ 🛏️ Gối ôm    │  │ 🔑 Nhỏ       │  │              │         │
│  │    (15 SP)   │  │    (Móc khóa)│  │  [Button:     │         │
│  │              │  │    (30 SP)   │  │   Xem ngay]  │         │
│  │              │  │              │  │              │         │
│  │ [Xem tất cả] │  │ [Xem tất cả] │  │              │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

#### Chi tiết từng cột:

**Cột 1: THEO LOẠI**
- **Width:** `33.33%` (flex-1)
- **Padding:** `p-4`
- **Spacing:** `space-y-3`
- **Items:**
  - Mỗi item có: Icon/Image (40x40px) + Label + Count + Badge (nếu có)
  - Hover: Background `bg-primary/10`, text chuyển sang `text-primary`
  - Touch target: `min-h-[44px]`

**Cột 2: THEO SIZE**
- **Width:** `33.33%` (flex-1)
- **Padding:** `p-4`
- **Border-left:** `border-l border-border` (tách biệt với cột 1)
- **Items:** Tương tự cột 1

**Cột 3: BANNER**
- **Width:** `33.33%` (flex-1)
- **Padding:** `p-4`
- **Border-left:** `border-l border-border`
- **Content:**
  - Image: `w-full h-48 rounded-xl object-cover`
  - Overlay text: "Sản phẩm nổi bật" (font-semibold, text-white)
  - Badge: "NEW" (top-right corner)
  - CTA Button: "Xem ngay" (rounded-full, bg-primary, text-white)

#### Spacing & Sizing:

```css
/* Container */
.mega-menu-container {
  min-width: 800px;
  max-width: 1000px;
  padding: 24px;
  border-radius: 12px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
}

/* Grid Layout */
.mega-menu-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
}

/* Column */
.mega-menu-column {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* Column Title */
.column-title {
  font-size: 14px;
  font-weight: 600;
  color: #5D4037; /* Warm Brown */
  margin-bottom: 8px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* Menu Item */
.menu-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px;
  border-radius: 8px;
  min-height: 44px;
  transition: all 0.2s ease;
}

.menu-item:hover {
  background-color: rgba(255, 158, 181, 0.1); /* primary/10 */
  color: #FF9EAA; /* primary */
}

/* Item Image/Icon */
.item-image {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  object-fit: cover;
  flex-shrink: 0;
}

/* Item Info */
.item-info {
  flex: 1;
  min-width: 0;
}

.item-label {
  font-size: 14px;
  font-weight: 500;
  color: #5D4037;
  margin-bottom: 2px;
}

.item-count {
  font-size: 12px;
  color: #888888; /* text-muted */
}

/* Badge */
.item-badge {
  font-size: 10px;
  padding: 2px 8px;
  border-radius: 999px;
  font-weight: 600;
  margin-left: auto;
}

/* Banner Column */
.banner-container {
  position: relative;
  width: 100%;
  height: 192px; /* h-48 */
  border-radius: 12px;
  overflow: hidden;
}

.banner-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.banner-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(to top, rgba(0,0,0,0.6), transparent);
  padding: 16px;
  color: white;
}

.banner-badge {
  position: absolute;
  top: 12px;
  right: 12px;
}

.banner-button {
  margin-top: 12px;
  padding: 8px 16px;
  background: #FF9EAA;
  color: white;
  border-radius: 999px;
  font-weight: 600;
  transition: transform 0.2s;
}

.banner-button:hover {
  transform: scale(1.05);
}
```

---

### Mobile Layout (<768px) - Accordion

#### Cấu trúc Accordion:

```
┌─────────────────────────────────────┐
│  ☰ Menu                             │
├─────────────────────────────────────┤
│  ▼ Sản phẩm                         │
│  ├─ Theo loại                       │
│  │  ├─ 🧸 Gấu Teddy (12 SP)        │
│  │  ├─ 🎭 Thú bông hoạt hình 🔥    │
│  │  └─ 🛏️ Gối ôm (15 SP)           │
│  │                                  │
│  ├─ Theo size                       │
│  │  ├─ 📏 Khổng lồ (>1m) 🔥        │
│  │  ├─ 📐 Vừa (50-80cm)            │
│  │  └─ 🔑 Nhỏ (Móc khóa)           │
│  │                                  │
│  └─ Banner                          │
│     └─ [Banner Image]               │
│        "Sản phẩm nổi bật"           │
│        [Xem ngay]                    │
└─────────────────────────────────────┘
```

#### Chi tiết Accordion:

**Accordion Item Structure:**
```tsx
<Accordion type="single" collapsible>
  <AccordionItem value="products">
    <AccordionTrigger>
      <span>Sản phẩm</span>
      <ChevronDown />
    </AccordionTrigger>
    <AccordionContent>
      {/* Sub-accordion: Theo loại */}
      <Accordion type="single" collapsible>
        <AccordionItem value="by-type">
          <AccordionTrigger className="text-sm">
            Theo loại
          </AccordionTrigger>
          <AccordionContent>
            {/* Menu items */}
          </AccordionContent>
        </AccordionItem>
      </Accordion>
      
      {/* Sub-accordion: Theo size */}
      {/* Banner section */}
    </AccordionContent>
  </AccordionItem>
</Accordion>
```

**Styling:**
```css
/* Mobile Accordion */
.mobile-accordion {
  width: 100%;
  background: white;
}

.accordion-trigger {
  padding: 16px;
  min-height: 44px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
  border-bottom: 1px solid #F3F4F6;
}

.accordion-content {
  padding: 0;
}

/* Sub-accordion (nested) */
.sub-accordion-trigger {
  padding: 12px 16px;
  font-size: 14px;
  font-weight: 500;
  background: #F9FAFB;
}

/* Menu Item (Mobile) */
.mobile-menu-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  min-height: 44px;
  border-bottom: 1px solid #F3F4F6;
}

.mobile-menu-item:active {
  background-color: rgba(255, 158, 181, 0.1);
}

/* Banner (Mobile) */
.mobile-banner {
  padding: 16px;
  margin: 8px;
  border-radius: 12px;
  background: linear-gradient(135deg, #FF9EAA 0%, #FFB6C1 100%);
  color: white;
  text-align: center;
}

.mobile-banner-image {
  width: 100%;
  height: 150px;
  border-radius: 8px;
  object-fit: cover;
  margin-bottom: 12px;
}
```

---

## 📋 2. DROPDOWN MENUS - Layout Đơn Giản

### 2.1. Bộ Sưu Tập (Dropdown)

#### Desktop:

```
┌─────────────────────────────┐
│  Bộ sưu tập          ▼      │
├─────────────────────────────┤
│  🎓 Gấu tốt nghiệp    [NEW] │
│  💝 Quà tặng Valentine [HOT]│
│  🎂 Quà sinh nhật           │
└─────────────────────────────┘
```

**Styling:**
```css
.dropdown-menu {
  min-width: 240px;
  padding: 8px;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.dropdown-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  min-height: 44px;
  border-radius: 6px;
  gap: 12px;
}

.dropdown-item:hover {
  background-color: rgba(255, 158, 181, 0.1);
  color: #FF9EAA;
}

.dropdown-item-icon {
  font-size: 18px;
  flex-shrink: 0;
}

.dropdown-item-label {
  flex: 1;
  font-size: 14px;
  font-weight: 500;
}

.dropdown-item-badge {
  font-size: 10px;
  padding: 2px 8px;
  border-radius: 999px;
  font-weight: 600;
}
```

#### Mobile:

```
┌─────────────────────────────┐
│  ☰ Menu                     │
├─────────────────────────────┤
│  ▼ Bộ sưu tập               │
│  ├─ 🎓 Gấu tốt nghiệp [NEW] │
│  ├─ 💝 Quà tặng Valentine  │
│  │   [HOT]                  │
│  └─ 🎂 Quà sinh nhật        │
└─────────────────────────────┘
```

**Mobile Styling:**
- Sử dụng Accordion tương tự Mega Menu
- Items hiển thị full width với icon + label + badge
- Touch-friendly với `min-h-[44px]`

---

### 2.2. Góc Chia Sẻ (Link với Sub-items)

#### Desktop:

**Hover để hiện sub-menu:**

```
┌─────────────────────────────┐
│  Góc Chia Sẻ          ▼    │
├─────────────────────────────┤
│  📝 Cách giặt gấu           │
│  🎁 Cách gói quà            │
│  📰 Blog                    │
└─────────────────────────────┘
```

#### Mobile:

```
┌─────────────────────────────┐
│  ▼ Góc Chia Sẻ              │
│  ├─ 📝 Cách giặt gấu        │
│  ├─ 🎁 Cách gói quà         │
│  └─ 📰 Blog                 │
└─────────────────────────────┘
```

---

## 🎨 3. COLOR & TYPOGRAPHY SPECS

### Colors (từ Design System):

```css
/* Primary Colors */
--primary: #FF9EAA;           /* Pastel Pink */
--primary-foreground: #FFFFFF;
--background: #FFF9FA;       /* Creamy White */
--text-main: #5D4037;       /* Warm Brown */
--text-muted: #888888;

/* Badge Colors */
--badge-new-bg: #DBEAFE;
--badge-new-text: #1E40AF;
--badge-hot-bg: #FEE2E2;
--badge-hot-text: #991B1B;
--badge-sale-bg: #D1FAE5;
--badge-sale-text: #065F46;

/* Borders & Shadows */
--border: #F3F4F6;
--shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
--shadow-xl: 0 10px 40px rgba(0, 0, 0, 0.15);
```

### Typography:

```css
/* Font Family */
font-family: 'Nunito', sans-serif;  /* Headings */
font-family: 'Inter', sans-serif;   /* Body */

/* Font Sizes */
--text-xs: 12px;
--text-sm: 14px;
--text-base: 16px;
--text-lg: 18px;

/* Font Weights */
--font-normal: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;
```

---

## 📱 4. RESPONSIVE BREAKPOINTS

```css
/* Mobile First */
@media (min-width: 768px) {
  /* Tablet: 2-column layout cho Mega Menu */
}

@media (min-width: 1024px) {
  /* Desktop: 3-column layout cho Mega Menu */
  /* Hover triggers */
}
```

---

## ✅ 5. IMPLEMENTATION CHECKLIST

### Mega Menu "Sản phẩm":
- [ ] Tạo component `ProductsMegaMenu.tsx`
- [ ] Implement 3-column layout (Desktop)
- [ ] Implement Accordion layout (Mobile)
- [ ] Add hover transitions (0.3s ease-in-out)
- [ ] Add badge support (new, hot, sale)
- [ ] Add image/icon support cho items
- [ ] Add "Xem tất cả" links
- [ ] Add banner column với CTA button

### Dropdown Menus:
- [ ] Update `MenuDropdown.tsx` với badge support
- [ ] Add icon support (emoji hoặc Lucide icons)
- [ ] Implement mobile accordion cho dropdowns
- [ ] Add hover/click triggers

### General:
- [ ] Ensure all touch targets ≥ 44px
- [ ] Add smooth animations (0.3s ease-in-out)
- [ ] Test keyboard navigation
- [ ] Test ARIA attributes
- [ ] Test on mobile devices

---

**Note:** Tất cả layout phải tuân thủ Design System trong `DESIGN_SYSTEM.md` và Mobile-First approach.
