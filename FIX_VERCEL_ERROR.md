# 🚨 Fix Lỗi Server Error trên Vercel

## Lỗi hiện tại

```
[next-auth][error][NO_SECRET] 
MissingSecretError: Please define a `secret` in production.
```

## Giải pháp nhanh (5 phút)

### Bước 1: Generate NEXTAUTH_SECRET

Chạy lệnh sau để tạo secret:

```bash
npm run generate:nextauth-secret
```

Hoặc:

```bash
openssl rand -base64 32
```

### Bước 2: Thêm vào Vercel

1. Vào [Vercel Dashboard](https://vercel.com/dashboard)
2. Chọn project của bạn
3. Vào **Settings** > **Environment Variables**
4. Thêm các biến sau:

| Key | Value | Environment |
|-----|-------|-------------|
| `NEXTAUTH_SECRET` | `vQNu68iBzDRB7CNmbLAC5TTt1noVWYdYO6iFfe/snkU=` | ✅ Production, ✅ Preview, ✅ Development |
| `NEXTAUTH_URL` | `https://teddyland.vn` | ✅ Production |
| `MONGODB_URI` | `mongodb+srv://...` | ✅ Production, ✅ Preview, ✅ Development |

### Bước 3: Redeploy

1. Vào tab **Deployments**
2. Click **...** (3 dots) trên deployment mới nhất
3. Chọn **Redeploy**

### Bước 4: Kiểm tra

Truy cập: `https://teddyland.vn/admin/login` và đăng nhập lại.

---

## Hướng dẫn chi tiết

Xem file: [`docs/FIX_VERCEL_NEXTAUTH_ERROR.md`](./docs/FIX_VERCEL_NEXTAUTH_ERROR.md)

---

## Các biến môi trường cần thiết

### Bắt buộc:

- ✅ `NEXTAUTH_SECRET` - Secret để mã hóa JWT (32+ ký tự)
- ✅ `NEXTAUTH_URL` - URL đầy đủ của app (ví dụ: `https://teddyland.vn`)
- ✅ `MONGODB_URI` - Connection string MongoDB Atlas

### Tùy chọn:

- `MONGODB_DB_NAME` - Tên database (mặc định: `shop-gau-bong`)
- `NEXT_PUBLIC_SITE_URL` - URL cho SEO schema

---

## Lưu ý

- **NEXTAUTH_SECRET** phải là chuỗi ngẫu nhiên, dài ít nhất 32 ký tự
- **NEXTAUTH_URL** phải là URL đầy đủ với `https://`, không có trailing slash
- Sau khi thêm biến môi trường, **phải redeploy** để áp dụng
