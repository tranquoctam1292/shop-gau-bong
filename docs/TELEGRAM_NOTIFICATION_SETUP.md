# 📱 Telegram Notification Setup Guide

**Ngày tạo:** 2025-01-XX  
**Mục đích:** Hướng dẫn cấu hình Telegram Bot để nhận thông báo đơn hàng mới trên điện thoại

---

## 📋 Tổng Quan

Hệ thống sử dụng **Telegram Bot** để gửi notification real-time về đơn hàng mới. Notification sẽ được gửi tự động đến Telegram của admin khi khách hàng đặt hàng thành công.

**Ưu điểm:**
- ✅ **Miễn phí** - Không có giới hạn số lượng message
- ✅ **Real-time** - Notification ngay lập tức trên điện thoại
- ✅ **Dễ setup** - Chỉ cần tạo bot và lấy token
- ✅ **Phổ biến ở VN** - Nhiều người dùng Telegram
- ✅ **Không cần app riêng** - Dùng app Telegram có sẵn

---

## 🚀 Cài Đặt

### Bước 1: Tạo Telegram Bot

1. Mở Telegram app trên điện thoại hoặc web
2. Tìm kiếm [@BotFather](https://t.me/botfather)
3. Gửi lệnh `/newbot` hoặc click vào "Start"
4. Làm theo hướng dẫn:
   - Nhập tên bot (ví dụ: `Shop Gấu Bông Notifications`)
   - Nhập username bot (phải kết thúc bằng `bot`, ví dụ: `shop_gaubong_bot`)
5. BotFather sẽ trả về **Bot Token** (dạng: `123456789:ABCdefGHIjklMNOpqrsTUVwxyz`)
6. **Lưu token này** - bạn sẽ cần nó sau

### Bước 2: Lấy Chat ID

Có 2 cách để lấy Chat ID:

#### Cách 1: Sử dụng script tự động (Khuyến nghị)

1. Thêm `TELEGRAM_BOT_TOKEN` vào `.env.local`:
   ```env
   TELEGRAM_BOT_TOKEN=your_bot_token_here
   ```

2. Chat với bot trên Telegram (gửi bất kỳ message nào)

3. Chạy script:
   ```bash
   npm run test:telegram-chat-id
   ```

4. Script sẽ hiển thị Chat ID của bạn

#### Cách 2: Sử dụng API trực tiếp

1. Chat với bot trên Telegram (gửi bất kỳ message nào)

2. Mở browser và truy cập:
   ```
   https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getUpdates
   ```

3. Tìm `"chat":{"id":123456789}` trong response
4. Số `123456789` chính là Chat ID của bạn

### Bước 3: Cấu hình Environment Variables

Thêm vào file `.env.local`:

```env
# Telegram Bot Configuration
TELEGRAM_BOT_TOKEN=your_bot_token_here
TELEGRAM_CHAT_ID=your_chat_id_here
```

**Lưu ý:**
- `TELEGRAM_BOT_TOKEN`: Token từ BotFather (bước 1)
- `TELEGRAM_CHAT_ID`: Chat ID của bạn (bước 2)

---

## 🧪 Testing

### Test Telegram Notification

Chạy script test:

```bash
npm run test:telegram
```

Hoặc dùng PowerShell script (tuân thủ quy tắc terminal):

```powershell
powershell -ExecutionPolicy Bypass -File scripts/run-telegram-test.ps1
```

Script sẽ:
1. Kiểm tra cấu hình (token, chat ID)
2. Gửi test message đến Telegram của bạn
3. Hiển thị kết quả

### Test với đơn hàng thật

1. Tạo đơn hàng từ checkout page
2. Kiểm tra Telegram app trên điện thoại
3. Bạn sẽ nhận được notification ngay lập tức

---

## 📱 Sử Dụng

### Nhận Notification

Sau khi setup xong, mỗi khi có đơn hàng mới, bạn sẽ nhận notification trên Telegram với:

- 🧸 **Subject:** Đơn hàng mới
- 📦 **Thông tin đơn hàng:** Mã đơn, ngày đặt, tổng tiền, phương thức thanh toán
- 👤 **Thông tin khách hàng:** Tên, email, điện thoại, địa chỉ
- 🛍️ **Sản phẩm:** Danh sách sản phẩm đã đặt
- 🔗 **Link:** Link xem chi tiết đơn hàng trong admin panel

### Format Notification

Notification sử dụng HTML formatting:
- **Bold text** cho các tiêu đề
- `Code` cho mã đơn hàng
- Links có thể click trực tiếp
- Emoji để dễ nhận biết

---

## ⚠️ Troubleshooting

### Không nhận được notification

1. **Kiểm tra Bot Token:**
   - Verify `TELEGRAM_BOT_TOKEN` đúng format
   - Token phải bắt đầu với số và có dấu `:`

2. **Kiểm tra Chat ID:**
   - Verify `TELEGRAM_CHAT_ID` là số (không có dấu ngoặc kép)
   - Đảm bảo đã chat với bot trước khi lấy Chat ID

3. **Kiểm tra bot hoạt động:**
   - Chat với bot trên Telegram
   - Bot phải reply được (nếu có command handler)

4. **Kiểm tra logs:**
   - Xem console logs khi tạo đơn hàng
   - Tìm `[Telegram Service]` messages

### Lỗi "chat not found"

- **Nguyên nhân:** Chat ID không đúng hoặc chưa chat với bot
- **Giải pháp:** 
  1. Chat với bot trên Telegram
  2. Lấy lại Chat ID (xem Bước 2)
  3. Cập nhật `TELEGRAM_CHAT_ID` trong `.env.local`

### Lỗi "Unauthorized"

- **Nguyên nhân:** Bot Token không đúng
- **Giải pháp:**
  1. Tạo lại bot token từ BotFather (`/token`)
  2. Cập nhật `TELEGRAM_BOT_TOKEN` trong `.env.local`

---

## 🔐 Security

1. **Bot Token:**
   - **KHÔNG** commit `TELEGRAM_BOT_TOKEN` vào Git
   - Chỉ lưu trong `.env.local` (đã có trong `.gitignore`)
   - Rotate token nếu bị lộ

2. **Chat ID:**
   - Chat ID là private, không nên share
   - Chỉ admin mới có Chat ID

---

## 📊 So Sánh với Email

| Tính năng | Email | Telegram |
|-----------|-------|----------|
| **Real-time** | ⚠️ Phụ thuộc email client | ✅ Ngay lập tức |
| **Mobile notification** | ⚠️ Phụ thuộc email app | ✅ Native notification |
| **Formatting** | ✅ HTML rich | ✅ HTML + emoji |
| **Chi phí** | ✅ Miễn phí (Resend) | ✅ Miễn phí |
| **Backup** | ✅ Lưu trong inbox | ⚠️ Cần backup manual |

**Khuyến nghị:** Sử dụng cả hai (Email + Telegram) để đảm bảo không bỏ sót đơn hàng.

---

## 🚀 Future Enhancements

Có thể mở rộng thêm:

1. **Multiple recipients:** Gửi notification cho nhiều admin
2. **Rich media:** Gửi hình ảnh sản phẩm trong notification
3. **Interactive buttons:** Thêm buttons để approve/reject order
4. **Commands:** Bot có thể reply với commands (ví dụ: `/orders` để xem danh sách đơn hàng)

---

## 📚 Resources

- **Telegram Bot API:** [https://core.telegram.org/bots/api](https://core.telegram.org/bots/api)
- **BotFather:** [https://t.me/botfather](https://t.me/botfather)
- **Telegram Bot Examples:** [https://core.telegram.org/bots/samples](https://core.telegram.org/bots/samples)

---

**END OF GUIDE**

