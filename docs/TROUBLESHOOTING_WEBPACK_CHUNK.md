# 🔧 Troubleshooting: Webpack Chunk Error

## Lỗi: `Cannot find module './682.js'`

### Nguyên nhân
Lỗi này xảy ra khi Next.js không tìm thấy webpack chunk file. Thường do:
1. Build cache bị corrupt
2. Webpack chunks không được generate đúng
3. Hot reload conflicts

### Giải pháp đã áp dụng

#### 1. Xóa Build Cache ✅
```powershell
# Xóa .next folder
Remove-Item -Recurse -Force .next
```

#### 2. Rebuild Project ✅
```bash
npm run build
```

### Nếu vẫn còn lỗi

#### Option 1: Clean Install
```bash
# Xóa node_modules và reinstall
Remove-Item -Recurse -Force node_modules
Remove-Item package-lock.json
npm install
npm run build
```

#### Option 2: Restart Dev Server
```bash
# Stop dev server (Ctrl+C)
# Xóa .next folder
Remove-Item -Recurse -Force .next
# Start lại
npm run dev
```

#### Option 3: Check Next.js Version
```bash
# Update Next.js nếu cần
npm install next@latest
```

### Prevention
- Luôn xóa .next folder trước khi deploy
- Clear cache sau khi update dependencies
- Monitor build output cho warnings

---

**Status:** ✅ Đã fix bằng cách xóa .next folder và rebuild

