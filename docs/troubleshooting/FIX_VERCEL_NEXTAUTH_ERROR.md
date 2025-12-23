# 🔧 Fix Lỗi NEXTAUTH_SECRET trên Vercel

## Vấn đề

Sau khi deploy lên Vercel và đăng nhập vào CMS, bạn gặp lỗi:

```
[next-auth][error][NO_SECRET] 
MissingSecretError: Please define a `secret` in production.
```

## Nguyên nhân

NextAuth yêu cầu biến môi trường `NEXTAUTH_SECRET` trong môi trường production để mã hóa JWT tokens và session cookies. Biến này chưa được cấu hình trên Vercel.

## Giải pháp

### Bước 1: Tạo NEXTAUTH_SECRET

Bạn có thể tạo secret bằng một trong các cách sau:

#### Cách 1: Sử dụng OpenSSL (Khuyến nghị)

```bash
openssl rand -base64 32
```

#### Cách 2: Sử dụng Node.js

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

#### Cách 3: Sử dụng Online Generator

Truy cập: https://generate-secret.vercel.app/32

**Lưu ý:** Secret phải là một chuỗi ngẫu nhiên, dài ít nhất 32 ký tự.

### Bước 2: Thêm Environment Variables trên Vercel

1. **Đăng nhập vào Vercel Dashboard:**
   - Truy cập: https://vercel.com/dashboard
   - Chọn project của bạn

2. **Vào Settings > Environment Variables:**
   - Click vào project
   - Vào tab **Settings**
   - Click **Environment Variables** ở sidebar

3. **Thêm các biến môi trường sau:**

   | Key | Value | Environment |
   |-----|-------|-------------|
   | `NEXTAUTH_SECRET` | `vQNu68iBzDRB7CNmbLAC5TTt1noVWYdYO6iFfe/snkU=` | Production, Preview, Development |
   | `NEXTAUTH_URL` | `https://teddyland.vn` | Production |
   | `MONGODB_URI` | `mongodb+srv://...` | Production, Preview, Development |
   | `MONGODB_DB_NAME` | `shop-gau-bong` | Production, Preview, Development (optional) |

   **Ví dụ cho teddyland.vn:**
   ```
   NEXTAUTH_SECRET=vQNu68iBzDRB7CNmbLAC5TTt1noVWYdYO6iFfe/snkU=
   NEXTAUTH_URL=https://teddyland.vn
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/shop-gau-bong?retryWrites=true&w=majority
   ```

4. **Chọn Environment:**
   - ✅ **Production** - Cho production deployment
   - ✅ **Preview** - Cho preview deployments (pull requests)
   - ✅ **Development** - Cho local development (nếu cần)

5. **Save và Redeploy:**
   - Click **Save**
   - Vào tab **Deployments**
   - Click **...** (3 dots) trên deployment mới nhất
   - Chọn **Redeploy**

### Bước 3: Kiểm tra lại

1. Đợi deployment hoàn tất
2. Truy cập: `https://teddyland.vn/admin/login`
3. Đăng nhập với tài khoản admin
4. Kiểm tra xem có còn lỗi không

## Các biến môi trường cần thiết cho Vercel

### Bắt buộc:

```env
# NextAuth
NEXTAUTH_SECRET=vQNu68iBzDRB7CNmbLAC5TTt1noVWYdYO6iFfe/snkU=
NEXTAUTH_URL=https://teddyland.vn

# MongoDB
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/shop-gau-bong?retryWrites=true&w=majority
MONGODB_DB_NAME=shop-gau-bong
```

### Tùy chọn (nếu có):

```env
# Site URL (cho SEO schema)
NEXT_PUBLIC_SITE_URL=https://your-app.vercel.app

# Payment Gateways (nếu sử dụng)
NEXT_PUBLIC_VIETQR_API_KEY=...
MOMO_SECRET_KEY=...
NEXT_PUBLIC_MOMO_PARTNER_CODE=...

# Shipping (nếu có)
NEXT_PUBLIC_SHIPPING_DEFAULT_RATE=30000
```

## Lưu ý quan trọng

1. **NEXTAUTH_SECRET:**
   - Phải là chuỗi ngẫu nhiên, dài ít nhất 32 ký tự
   - Không được commit vào Git
   - Phải khác nhau giữa development và production
   - Nếu thay đổi secret, tất cả users sẽ bị logout

2. **NEXTAUTH_URL:**
   - Phải là URL đầy đủ (với https://)
   - Không có trailing slash
   - Ví dụ: `https://teddyland.vn`

3. **MONGODB_URI:**
   - Đảm bảo MongoDB Atlas cho phép kết nối từ Vercel IPs
   - Kiểm tra Network Access trong MongoDB Atlas
   - Thêm `0.0.0.0/0` để cho phép tất cả IPs (hoặc chỉ Vercel IPs)

## Troubleshooting

### Vẫn gặp lỗi sau khi thêm biến môi trường?

1. **Kiểm tra deployment logs:**
   - Vào Vercel Dashboard > Deployments
   - Click vào deployment mới nhất
   - Xem **Build Logs** và **Function Logs**

2. **Kiểm tra biến môi trường đã được set:**
   - Vào Settings > Environment Variables
   - Đảm bảo biến đã được save
   - Đảm bảo đã chọn đúng environment (Production/Preview)

3. **Redeploy lại:**
   - Sau khi thêm biến môi trường, phải redeploy
   - Vercel không tự động redeploy khi thêm env vars

4. **Kiểm tra format của NEXTAUTH_SECRET:**
   - Không có khoảng trắng
   - Không có ký tự đặc biệt không hợp lệ
   - Độ dài đủ (32+ ký tự)

### Lỗi MongoDB Connection?

Nếu gặp lỗi kết nối MongoDB:

1. Kiểm tra `MONGODB_URI` đúng format
2. Kiểm tra MongoDB Atlas Network Access
3. Kiểm tra MongoDB Atlas Database User có quyền đọc/ghi

## Script tự động tạo secret

Bạn có thể tạo file `scripts/generate-secret.js`:

```javascript
const crypto = require('crypto');
const secret = crypto.randomBytes(32).toString('base64');
console.log('\n✅ Generated NEXTAUTH_SECRET:');
console.log(secret);
console.log('\n📝 Copy và paste vào Vercel Environment Variables\n');
```

Chạy:
```bash
node scripts/generate-secret.js
```

## Tài liệu tham khảo

- NextAuth.js Docs: https://next-auth.js.org/configuration/options#secret
- Vercel Environment Variables: https://vercel.com/docs/concepts/projects/environment-variables
- MongoDB Atlas Connection: https://www.mongodb.com/docs/atlas/connect-to-cluster/
