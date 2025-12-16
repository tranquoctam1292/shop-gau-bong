# Floating Contact Widget - Testing Checklist

**Module:** Floating Contact Widget  
**Date:** 2025-01-XX  
**Status:** Ready for Testing

---

## 📋 MANUAL TESTING CHECKLIST

### 1. Basic Functionality

#### 1.1 Widget Visibility
- [ ] Widget hiển thị khi `enabled: true` và có ít nhất 1 active item
- [ ] Widget ẩn khi `enabled: false`
- [ ] Widget ẩn khi không có active items
- [ ] Widget hiển thị ở vị trí đúng (left/right) theo config

#### 1.2 Main Button (FAB)
- [ ] Button hiển thị với icon MessageCircle khi closed
- [ ] Button có pulse animation khi closed
- [ ] Button click mở menu (hiển thị sub buttons)
- [ ] Button icon chuyển thành X khi open
- [ ] Button rotate 45deg khi open
- [ ] Button click lần 2 đóng menu

#### 1.3 Sub Buttons
- [ ] Sub buttons hiển thị khi click main button
- [ ] Sub buttons có stagger animation (xuất hiện lần lượt)
- [ ] Sub buttons hiển thị đúng icon:
  - [ ] Hotline: Phone icon (Lucide)
  - [ ] Zalo: Zalo logo (inline SVG, màu #0068FF)
  - [ ] Messenger: Messenger logo (inline SVG, gradient)
- [ ] Sub buttons có label trên desktop
- [ ] Sub buttons chỉ có icon trên mobile (44x44px minimum)

### 2. Interaction & Navigation

#### 2.1 Toggle Behavior
- [ ] Click main button mở menu
- [ ] Click main button lần 2 đóng menu
- [ ] Click outside widget đóng menu (delay 100ms)
- [ ] Click vào sub button không đóng menu ngay (chuyển trang)

#### 2.2 Link Navigation
- [ ] Hotline: Click mở `tel:{phone}` (mobile) hoặc copy số (desktop)
- [ ] Zalo: Click mở `https://zalo.me/{phone}` trong tab mới (desktop)
- [ ] Messenger: Click mở `https://m.me/{pageId}` trong tab mới (desktop)
- [ ] Links có `rel="noopener noreferrer"` cho external links

#### 2.3 Click Outside
- [ ] Click vào vùng trống đóng menu
- [ ] Click vào element khác (header, footer) đóng menu
- [ ] Click vào sub button không đóng menu (chuyển trang)

### 3. Responsive Design

#### 3.1 Mobile (< 768px)
- [ ] Widget hiển thị ở góc dưới (bottom-5)
- [ ] Main button size: 56x56px (w-14 h-14)
- [ ] Sub buttons: Icon only, không có label
- [ ] Sub buttons size: min 44x44px (touch target)
- [ ] Spacing giữa buttons đủ rộng (gap-3)
- [ ] Safe area: Widget không bị che bởi iPhone home indicator

#### 3.2 Desktop (≥ 768px)
- [ ] Widget hiển thị ở góc dưới (bottom-8)
- [ ] Main button size: 64x64px (w-16 h-16)
- [ ] Sub buttons: Icon + Label
- [ ] Sub buttons có padding đủ (px-5 py-3.5)
- [ ] Hover effects hoạt động (scale, brightness)

### 4. Configuration Testing

#### 4.1 Position
- [ ] Position "right": Widget ở góc phải dưới
- [ ] Position "left": Widget ở góc trái dưới
- [ ] Position thay đổi ngay sau khi save (không cần reload)

#### 4.2 Color Customization
- [ ] Primary color áp dụng cho main button
- [ ] Primary color áp dụng cho sub buttons
- [ ] Color picker hoạt động (input type="color")
- [ ] Text input cho hex code hoạt động
- [ ] Validation: Chỉ chấp nhận hex code (#RRGGBB)

#### 4.3 Items Configuration
- [ ] Toggle active/inactive cho từng item hoạt động
- [ ] Label input hoạt động
- [ ] Value input hoạt động
- [ ] Validation:
  - [ ] Hotline/Zalo: Phone format (10-11 digits)
  - [ ] Messenger: Page ID format (alphanumeric, dots, hyphens)
- [ ] Chỉ active items hiển thị trên frontend

### 5. CMS Admin Testing

#### 5.1 Settings Page
- [ ] Page load: `/admin/settings/contact-widget`
- [ ] Form load settings hiện tại từ API
- [ ] Enable/Disable switch hoạt động
- [ ] Position select hoạt động
- [ ] Color picker hoạt động
- [ ] Contact items editor hoạt động
- [ ] Save button lưu thành công
- [ ] Toast notification hiển thị khi save

#### 5.2 Data Persistence
- [ ] Settings được lưu vào MongoDB
- [ ] Settings được load lại sau khi refresh
- [ ] Settings thay đổi ngay trên frontend (sau khi save)

### 6. Performance Testing

#### 6.1 Bundle Size
- [ ] Component được code-split (separate chunk)
- [ ] Initial bundle size không tăng
- [ ] Widget chunk size < 50KB (gzipped)

#### 6.2 Loading Behavior
- [ ] Widget không render trên server (SSR: false)
- [ ] Widget load sau khi page interactive
- [ ] Không có loading spinner (loading: () => null)
- [ ] Widget xuất hiện mượt mà (không gây layout shift)

#### 6.3 Core Web Vitals
- [ ] LCP (Largest Contentful Paint) không bị ảnh hưởng
- [ ] CLS (Cumulative Layout Shift) = 0 (widget không gây shift)
- [ ] TTI (Time to Interactive) không bị ảnh hưởng
- [ ] FCP (First Contentful Paint) không bị ảnh hưởng

### 7. Cross-Browser Testing

#### 7.1 Desktop Browsers
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)

#### 7.2 Mobile Browsers
- [ ] Chrome Mobile (Android)
- [ ] Safari Mobile (iOS)
- [ ] Samsung Internet (Android)

### 8. Edge Cases

#### 8.1 Empty/Invalid Config
- [ ] Widget ẩn khi config = null
- [ ] Widget ẩn khi config.enabled = false
- [ ] Widget ẩn khi không có active items
- [ ] Widget không crash khi API error

#### 8.2 Network Issues
- [ ] Widget handle API timeout gracefully
- [ ] Widget sử dụng cached data (staleTime 5 phút)
- [ ] Widget không refetch liên tục

#### 8.3 Multiple Items
- [ ] Widget hiển thị tối đa 3 items (Hotline, Zalo, Messenger)
- [ ] Stagger animation hoạt động với 3 items
- [ ] Layout không bị overflow

### 9. Accessibility

#### 9.1 ARIA Labels
- [ ] Main button có `aria-label`
- [ ] Main button có `aria-expanded`
- [ ] Sub buttons có `aria-label`

#### 9.2 Keyboard Navigation (Optional)
- [ ] Tab navigation hoạt động
- [ ] Enter/Space để toggle
- [ ] Escape để đóng menu

### 10. Analytics (Optional)

#### 10.1 Google Analytics Events
- [ ] Event tracking khi click sub button (nếu gtag available)
- [ ] Event category: "Contact Button"
- [ ] Event action: "Click"
- [ ] Event label: item type (hotline/zalo/messenger)

---

## 🐛 KNOWN ISSUES

- None

---

## ✅ TEST RESULTS

**Tester:** _______________  
**Date:** _______________  
**Status:** _______________

---

## 📝 NOTES

- Widget sử dụng `next/dynamic` với `ssr: false` để optimize performance
- Icons sử dụng inline SVG để tránh thêm HTTP request
- Widget cache config trong 5 phút (React Query staleTime)
- Click outside có delay 100ms để tránh immediate close khi opening

