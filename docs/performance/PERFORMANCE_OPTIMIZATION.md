# Performance Optimization Guide

## Lighthouse Audit Results

**Current Scores:**
- Performance: 59 ⚠️ (Cần cải thiện)
- Accessibility: 84 ✅ (Tốt)
- Best Practices: 79 ✅ (Tốt)
- SEO: 100 ✅ (Tuyệt vời!)

## Performance Issues & Solutions

### 1. Reduce Unused JavaScript (High Priority)

**Issue:** Lighthouse phát hiện unused JavaScript trong bundle.

**Solutions:**
- ✅ Đã implement dynamic imports cho heavy components (CartDrawer, EnhancedSearchBar)
- ✅ Đã optimize package imports (`optimizePackageImports` trong `next.config.js`)
- ⚠️ **TODO:** Analyze bundle để tìm và remove unused code
- ⚠️ **TODO:** Consider code splitting cho large components

**Action Items:**
```bash
# Analyze bundle size
npm run build
npm run test:bundle-size
```

### 2. Reduce Unused CSS (High Priority)

**Issue:** Lighthouse phát hiện unused CSS.

**Solutions:**
- ✅ Đã sử dụng Tailwind CSS với JIT mode (tự động purge unused CSS)
- ⚠️ **TODO:** Verify Tailwind config có `content` paths đúng
- ⚠️ **TODO:** Remove unused CSS từ third-party components

**Action Items:**
- Check `tailwind.config.js` có include tất cả file paths
- Consider using `@apply` directive thay vì inline classes nếu cần

### 3. Enable Text Compression (Medium Priority)

**Issue:** Text compression chưa được enable.

**Solutions:**
- ⚠️ **TODO:** Enable gzip/brotli compression trên server (Vercel/Netlify tự động enable)
- ⚠️ **TODO:** Verify compression headers trong production

**Action Items:**
- Vercel/Netlify tự động enable compression
- Nếu self-host, cần configure nginx/apache

### 4. Minify CSS (Medium Priority)

**Issue:** CSS chưa được minify trong development.

**Solutions:**
- ✅ Next.js tự động minify CSS trong production build
- ⚠️ **TODO:** Verify CSS minification trong production build

**Action Items:**
```bash
# Build production và check
npm run build
# Check .next/static/css folder
```

### 5. Minify JavaScript (Medium Priority)

**Issue:** JavaScript chưa được minify trong development.

**Solutions:**
- ✅ Next.js tự động minify JavaScript trong production build
- ⚠️ **TODO:** Verify JavaScript minification trong production build

### 6. Serve Images in Next-Gen Formats (Low Priority)

**Issue:** Một số images chưa được serve trong next-gen formats (AVIF/WebP).

**Solutions:**
- ✅ Đã config `next.config.js` với `formats: ['image/avif', 'image/webp']`
- ✅ Đã sử dụng `next/image` component (tự động convert)
- ⚠️ **TODO:** Verify images được serve trong AVIF/WebP format

**Action Items:**
- Check Network tab trong DevTools
- Verify `Content-Type` header của images

### 7. Eliminate Render-Blocking Resources (Low Priority)

**Issue:** Một số resources block rendering.

**Solutions:**
- ✅ Đã sử dụng `font-display: swap` cho fonts
- ✅ Đã lazy load images (trừ above-the-fold)
- ⚠️ **TODO:** Consider preloading critical resources

**Action Items:**
- Add `<link rel="preload">` cho critical fonts
- Consider preloading critical CSS

### 8. Reduce Initial Server Response Time (Low Priority)

**Issue:** Server response time có thể được cải thiện.

**Solutions:**
- ⚠️ **TODO:** Optimize API responses (GraphQL queries)
- ⚠️ **TODO:** Consider caching strategies
- ⚠️ **TODO:** Use CDN cho static assets

**Action Items:**
- Implement GraphQL query caching
- Consider ISR (Incremental Static Regeneration) cho product pages

## Implementation Plan

### Phase 1: Quick Wins (1-2 hours)
1. ✅ Verify Tailwind config
2. ✅ Run bundle analysis
3. ✅ Check production build output

### Phase 2: Code Optimization (2-4 hours)
1. Remove unused dependencies
2. Optimize imports
3. Code splitting improvements

### Phase 3: Server Optimization (1-2 hours)
1. Verify compression
2. Optimize GraphQL queries
3. Implement caching

### Phase 4: Advanced Optimization (4-8 hours)
1. ISR for product pages
2. Image optimization improvements
3. Preloading critical resources

## Monitoring

Sau khi optimize, chạy lại Lighthouse audit:
```bash
npm run test:lighthouse
```

Target scores:
- Performance: > 80
- Accessibility: > 90
- Best Practices: > 90
- SEO: > 95

## Tools

- **Lighthouse:** `npm run test:lighthouse`
- **Bundle Analysis:** `npm run test:bundle-size`
- **Next.js Bundle Analyzer:** (có thể cài thêm `@next/bundle-analyzer`)

