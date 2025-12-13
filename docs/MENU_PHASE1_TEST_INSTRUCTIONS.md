# 🔧 Menu Phase 1 - Test Instructions

**Issue:** Automated authentication không hoạt động với NextAuth JWT strategy.

**Solution:** Sử dụng manual session cookie từ browser.

---

## 📋 Quick Test Steps

### Step 1: Login trong Browser

1. Mở browser và đi đến: `http://localhost:3000/admin/login`
2. Login với admin credentials
3. Sau khi login thành công, bạn sẽ được redirect đến `/admin`

### Step 2: Lấy Session Cookie

1. Mở **Browser DevTools** (F12 hoặc Right-click → Inspect)
2. Đi đến tab **Application** (Chrome) hoặc **Storage** (Firefox)
3. Mở **Cookies** → `http://localhost:3000`
4. Tìm cookie có tên: `next-auth.session-token`
5. Copy **toàn bộ giá trị** của cookie đó

### Step 3: Thêm vào .env.local

Mở file `.env.local` và thêm dòng:

```env
TEST_SESSION_COOKIE="next-auth.session-token=YOUR_COPIED_TOKEN_HERE"
```

**Lưu ý:** 
- Thay `YOUR_COPIED_TOKEN_HERE` bằng giá trị cookie bạn vừa copy
- Giữ nguyên format: `next-auth.session-token=...`

### Step 4: Chạy Test Script

```bash
npx tsx scripts/test-menu-api.ts
```

Bây giờ test script sẽ sử dụng session cookie từ `.env.local` và các tests sẽ pass!

---

## 🧪 Alternative: Test Manual với Browser DevTools

Nếu không muốn dùng test script, bạn có thể test trực tiếp trong browser:

### Test 1: Create Menu

1. Mở **Browser DevTools** → **Network** tab
2. Đi đến: `http://localhost:3000/admin/menus` (hoặc bất kỳ admin page nào)
3. Trong **Console**, chạy:

```javascript
fetch('/api/admin/menus', {
  method: 'POST',
  headers: {
  'Content-Type': 'application/json',
  },
  credentials: 'include',
  body: JSON.stringify({
    name: 'Test Menu',
    location: 'header',
    status: 'active'
  })
})
.then(r => r.json())
.then(console.log)
.catch(console.error);
```

### Test 2: List Menus

```javascript
fetch('/api/admin/menus', {
  credentials: 'include'
})
.then(r => r.json())
.then(console.log)
.catch(console.error);
```

---

## ✅ Expected Results

Khi test thành công, bạn sẽ thấy:

```json
{
  "message": "Menu created successfully",
  "menu": {
    "id": "...",
    "name": "Test Menu",
    "location": "header",
    "status": "active",
    ...
  }
}
```

---

## 🐛 Troubleshooting

### Issue: "Unauthorized" Error
**Solution:** 
- Đảm bảo đã login trong browser
- Kiểm tra session cookie còn valid (chưa expire)
- Copy lại cookie và update `.env.local`

### Issue: Cookie Expired
**Solution:**
- Login lại trong browser
- Copy cookie mới
- Update `.env.local`

### Issue: Test Script Still Fails
**Solution:**
- Kiểm tra format trong `.env.local`: `TEST_SESSION_COOKIE="next-auth.session-token=..."`
- Đảm bảo không có dấu ngoặc kép thừa
- Restart terminal sau khi update `.env.local`

---

**Note:** Session cookie thường có thời hạn 30 ngày (theo NextAuth config), nhưng có thể expire sớm hơn nếu server restart hoặc có thay đổi.

