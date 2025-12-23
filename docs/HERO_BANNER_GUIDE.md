# Hero Banner Guide

## 📋 Tổng quan

Hero Banner là phần banner carousel ở đầu trang chủ, hiển thị các thông điệp marketing quan trọng.

## 🖼️ Yêu cầu Ảnh Banner

### Kích thước khuyến nghị

**Desktop:**
- **Width:** 1920px (Full HD)
- **Height:** 800px - 1080px
- **Aspect Ratio:** 16:9 hoặc 21:9 (widescreen)
- **File Size:** < 500KB (sau khi optimize)

**Mobile:**
- **Width:** 768px - 1024px
- **Height:** 400px - 600px
- **Aspect Ratio:** 16:9
- **File Size:** < 200KB (sau khi optimize)

### Format & Quality

1. **Format:** JPEG hoặc WebP
   - JPEG: Tốt cho ảnh có nhiều màu sắc, gradient
   - WebP: Tốt hơn về compression (giảm 25-35% dung lượng)

2. **Quality Settings:**
   - Desktop: 85-90% quality
   - Mobile: 75-80% quality

3. **Optimization Tools:**
   - [TinyPNG](https://tinypng.com/) - Compress images
   - [Squoosh](https://squoosh.app/) - Advanced compression
   - [ImageOptim](https://imageoptim.com/) - Batch optimization

### Nội dung Banner

Mỗi banner nên có:
- **Background Image:** Ảnh gấu bông chất lượng cao, không bị mờ
- **Text Overlay:** Title và subtitle rõ ràng, dễ đọc
- **CTA Button:** Nút "Mua ngay" hoặc "Xem sản phẩm"

## 📁 Cấu trúc File

```
public/
  images/
    hero-1.jpg (1920x800px, < 500KB)
    hero-2.jpg (1920x800px, < 500KB)
    hero-3.jpg (1920x800px, < 500KB)
    hero-1-mobile.jpg (768x400px, < 200KB) [Optional]
    hero-2-mobile.jpg (768x400px, < 200KB) [Optional]
    hero-3-mobile.jpg (768x400px, < 200KB) [Optional]
```

## 🎨 Design Guidelines

### Typography
- **Title:** Font size lớn, bold, màu trắng với drop shadow
- **Subtitle:** Font size vừa, màu trắng/90% opacity
- **Contrast:** Đảm bảo text dễ đọc trên background

### Overlay
- Gradient overlay: `from-black/60 via-black/40 to-transparent`
- Giúp text dễ đọc trên mọi background

### CTA Button
- Màu nổi bật (primary color)
- Kích thước tối thiểu: 44x44px (mobile-friendly)
- Padding: `px-6 md:px-8`

## 🔧 Cấu hình trong Code

### Default Banners (HeroBanners.tsx)

```typescript
const defaultBanners = [
  {
    id: '1',
    image: '/images/hero-1.jpg',
    title: '🧸 Chào mừng đến với Shop Gấu Bông',
    subtitle: 'Nơi bạn tìm thấy những chú gấu bông đáng yêu nhất',
    ctaText: 'Mua ngay',
    ctaLink: '/products',
    order: 1,
  },
  // ... more banners
];
```

### Từ WordPress CMS

Banners có thể được quản lý từ WordPress ACF Options:
- Field Group: "Hero Banners"
- Fields:
  - `hero_banners` (Repeater)
    - `image` (Image)
    - `title` (Text)
    - `subtitle` (Textarea)
    - `cta_text` (Text)
    - `cta_link` (URL)
    - `order` (Number)

## 📱 Responsive Behavior

- **Mobile (< 768px):** Height: 60vh, text size nhỏ hơn
- **Tablet (768px - 1024px):** Height: 70vh
- **Desktop (> 1024px):** Height: 80vh, text size lớn hơn

## ⚡ Performance Optimization

1. **Lazy Loading:** Chỉ load ảnh đầu tiên với `priority`, các ảnh khác lazy load
2. **Image Optimization:** Next.js tự động optimize ảnh (WebP, responsive sizes)
3. **Blur Placeholder:** Hiển thị blur placeholder khi ảnh đang load
4. **Proper Sizes:** Sử dụng `sizes` attribute để load đúng kích thước

## 🎯 Best Practices

1. **Compress Images:** Luôn compress ảnh trước khi upload
2. **Test trên Mobile:** Kiểm tra ảnh hiển thị tốt trên mobile
3. **Text Readability:** Đảm bảo text dễ đọc trên mọi background
4. **Loading State:** Component có loading skeleton
5. **Error Handling:** Fallback về default banners nếu CMS lỗi

## 📝 Checklist khi tạo Banner mới

- [ ] Ảnh có kích thước đúng (1920x800px cho desktop)
- [ ] File size < 500KB sau khi optimize
- [ ] Text dễ đọc trên background
- [ ] CTA button rõ ràng, dễ click
- [ ] Test trên mobile và desktop
- [ ] Kiểm tra performance (Lighthouse score)

