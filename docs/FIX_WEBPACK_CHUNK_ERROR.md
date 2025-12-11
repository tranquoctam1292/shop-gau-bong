# 🔧 Fix: Webpack Chunk Error - Cannot find module './682.js'

**Ngày:** 11/12/2025  
**Lỗi:** `Error: Cannot find module './682.js'`

---

## 🔍 Nguyên nhân

Lỗi này thường xảy ra khi:
1. **Build cache bị corrupt:** `.next` folder chứa các webpack chunks không hợp lệ
2. **Webpack chunks không được generate đúng:** Có vấn đề trong quá trình build
3. **Hot reload conflicts:** Dev server cache bị conflict với build cache

---

## ✅ Giải pháp

### 1. Xóa Build Cache (Đã thực hiện)
```powershell
# Xóa .next folder
Remove-Item -Recurse -Force .next

# Xóa node_modules cache (nếu có)
Remove-Item -Recurse -Force node_modules\.cache
```

### 2. Rebuild Project
```bash
npm run build
```

### 3. Restart Dev Server
```bash
# Stop dev server (Ctrl+C)
# Start lại
npm run dev
```

---

## 🚨 Nếu vẫn còn lỗi

### Option 1: Clean Install
```bash
# Xóa node_modules và reinstall
Remove-Item -Recurse -Force node_modules
Remove-Item package-lock.json
npm install
npm run build
```

### Option 2: Check Next.js Version
```bash
# Update Next.js nếu cần
npm install next@latest
```

### Option 3: Check Webpack Config
Kiểm tra `next.config.js` xem có custom webpack config gây conflict không.

---

## 📝 Prevention

1. **Luôn xóa .next folder trước khi deploy:**
   - Thêm vào `.gitignore` (đã có)
   - Xóa trước khi build production

2. **Clear cache định kỳ:**
   - Sau khi update dependencies
   - Sau khi thay đổi next.config.js

3. **Monitor build output:**
   - Kiểm tra warnings về webpack chunks
   - Kiểm tra bundle size

---

**Status:** ✅ Đã fix bằng cách xóa .next folder và rebuild

