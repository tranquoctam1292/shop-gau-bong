# DOC-002: User Documentation

## 📋 Mục lục

1. [Admin User Guide (WordPress)](#admin-user-guide-wordpress)
2. [Customer FAQ](#customer-faq)
3. [Troubleshooting Guide](#troubleshooting-guide)

---

## 👨‍💼 Admin User Guide (WordPress)

### Đăng nhập WordPress Admin

1. Truy cập: `https://yourdomain.com/wp-admin`
2. Nhập **Username** và **Password**
3. Click **Log In**

### Quản lý Sản phẩm

#### Thêm Sản phẩm Mới

1. Vào **Products > Add New**
2. **Product Name:** Nhập tên sản phẩm
3. **Description:** Mô tả chi tiết sản phẩm
4. **Short Description:** Mô tả ngắn (hiển thị trên listing)
5. **Product Data:**
   - **Regular Price:** Giá bán
   - **Sale Price:** Giá khuyến mãi (nếu có)
   - **Stock Status:** In stock / Out of stock
   - **Weight:** Cân nặng (kg)
6. **Product Image:** Upload ảnh chính
7. **Product Gallery:** Upload ảnh phụ (nếu có)
8. **Categories:** Chọn danh mục
9. **Product Specifications (ACF Fields):**
   - **Chiều dài (cm):** Nhập chiều dài
   - **Chiều rộng (cm):** Nhập chiều rộng
   - **Chiều cao (cm):** Nhập chiều cao
   - **Cân nặng quy đổi (kg):** Tự động tính = (L × W × H) / 6000
   - **Chất liệu:** Nhập chất liệu
   - **Xuất xứ:** Nhập xuất xứ
10. Click **Publish**

**⚠️ Lưu ý:**
- **Dimensions (L × W × H) là bắt buộc** để tính phí vận chuyển chính xác
- Nếu thiếu dimensions, hệ thống sẽ cảnh báo và dùng cân nặng thực tế

#### Chỉnh sửa Sản phẩm

1. Vào **Products > All Products**
2. Tìm sản phẩm cần chỉnh sửa
3. Click **Edit**
4. Thay đổi thông tin cần thiết
5. Click **Update**

#### Xóa Sản phẩm

1. Vào **Products > All Products**
2. Hover vào sản phẩm cần xóa
3. Click **Trash**
4. Sản phẩm sẽ chuyển vào thùng rác
5. Để xóa vĩnh viễn: Vào **Trash** và click **Delete Permanently**

#### Quản lý Tồn kho

1. Vào **Products > All Products**
2. Click **Edit** sản phẩm
3. **Product Data > Inventory:**
   - **Stock Status:** In stock / Out of stock
   - **Stock Quantity:** Số lượng tồn kho (nếu quản lý)
4. Click **Update**

### Quản lý Đơn hàng

#### Xem Danh sách Đơn hàng

1. Vào **WooCommerce > Orders**
2. Xem danh sách tất cả đơn hàng
3. **Filters:**
   - Theo trạng thái (Pending, Processing, Completed, etc.)
   - Theo ngày
   - Theo khách hàng

#### Xem Chi tiết Đơn hàng

1. Click vào **Order Number** để xem chi tiết
2. **Thông tin hiển thị:**
   - Thông tin khách hàng
   - Địa chỉ giao hàng
   - Sản phẩm đã đặt
   - Tổng tiền
   - Phương thức thanh toán
   - Trạng thái đơn hàng

#### Cập nhật Trạng thái Đơn hàng

1. Vào chi tiết đơn hàng
2. **Order Status:** Chọn trạng thái mới
   - **Pending:** Chờ thanh toán
   - **Processing:** Đang xử lý
   - **On Hold:** Tạm giữ
   - **Completed:** Hoàn thành
   - **Cancelled:** Đã hủy
   - **Refunded:** Đã hoàn tiền
3. Click **Update**

#### In Hóa đơn

1. Vào chi tiết đơn hàng
2. Click **Print Invoice** hoặc **Download PDF**
3. Hóa đơn sẽ được tải về

### Quản lý Danh mục

#### Thêm Danh mục Mới

1. Vào **Products > Categories**
2. **Name:** Tên danh mục
3. **Slug:** URL slug (tự động tạo)
4. **Parent Category:** Danh mục cha (nếu có)
5. **Description:** Mô tả danh mục
6. **Display Type:** Default / Products / Subcategories
7. Click **Add New Category**

#### Chỉnh sửa Danh mục

1. Vào **Products > Categories**
2. Hover vào danh mục cần chỉnh sửa
3. Click **Edit**
4. Thay đổi thông tin
5. Click **Update**

### Cấu hình Thanh toán

#### Cấu hình VietQR

1. Vào **WooCommerce > Settings > Payments**
2. Tìm **VietQR** (nếu có plugin)
3. Click **Manage**
4. **Enable/Disable:** Bật/tắt
5. **API Key:** Nhập API key
6. **Test Mode:** Bật cho staging, tắt cho production
7. Click **Save changes**

#### Cấu hình MoMo

1. Vào **WooCommerce > Settings > Payments**
2. Tìm **MoMo**
3. Click **Manage**
4. **Enable/Disable:** Bật/tắt
5. **Partner Code:** Nhập Partner Code
6. **Secret Key:** Nhập Secret Key
7. **Access Key:** Nhập Access Key
8. **Test Mode:** Bật cho staging, tắt cho production
9. Click **Save changes**

#### Cấu hình COD

1. Vào **WooCommerce > Settings > Payments**
2. Tìm **Cash on Delivery**
3. Click **Manage**
4. **Enable/Disable:** Bật/tắt
5. **Title:** "Thanh toán khi nhận hàng"
6. **Description:** Mô tả phương thức
7. Click **Save changes**

### Cấu hình Vận chuyển

#### Thiết lập Shipping Zones

1. Vào **WooCommerce > Settings > Shipping**
2. Click **Add shipping zone**
3. **Zone name:** "Vietnam"
4. **Zone regions:** Chọn Vietnam
5. Click **Save changes**

#### Thêm Shipping Method

1. Trong shipping zone, click **Add shipping method**
2. Chọn method: **Custom Shipping** hoặc **Flat Rate**
3. Click **Add shipping method**
4. **Method Title:** "Vận chuyển nhanh"
5. **Cost:** Cấu hình theo weight hoặc flat rate
6. Click **Save changes**

### Backup và Bảo mật

#### Tạo Backup

1. Install plugin **UpdraftPlus**
2. Vào **Settings > UpdraftPlus Backups**
3. Click **Backup Now**
4. Chọn components cần backup:
   - Files
   - Database
5. Click **Backup Now**

#### Cấu hình Auto Backup

1. Vào **Settings > UpdraftPlus Backups**
2. **Files backup schedule:** Daily
3. **Database backup schedule:** Daily
4. **Retain this many backups:** 30
5. **Remote storage:** Google Drive / Dropbox (nếu có)
6. Click **Save Changes**

---

## ❓ Customer FAQ

### Câu hỏi về Sản phẩm

#### Q: Làm thế nào để tìm sản phẩm?

**A:** Bạn có thể:
- Sử dụng thanh tìm kiếm ở đầu trang
- Duyệt theo danh mục
- Sử dụng bộ lọc (giá, chất liệu, kích thước)

#### Q: Sản phẩm có sẵn hàng không?

**A:** 
- Kiểm tra trạng thái "Còn hàng" / "Hết hàng" trên trang sản phẩm
- Nếu hết hàng, bạn có thể đăng ký nhận thông báo khi có hàng

#### Q: Kích thước sản phẩm là gì?

**A:** 
- Kích thước (L × W × H) được hiển thị trên trang chi tiết sản phẩm
- Kích thước dùng để tính phí vận chuyển

### Câu hỏi về Giỏ hàng

#### Q: Làm thế nào để thêm sản phẩm vào giỏ hàng?

**A:**
1. Vào trang sản phẩm
2. Chọn số lượng
3. Click **Thêm vào giỏ hàng**
4. Sản phẩm sẽ được thêm vào giỏ hàng

#### Q: Làm thế nào để xem giỏ hàng?

**A:**
- Click icon giỏ hàng ở header (số lượng sản phẩm)
- Hoặc vào menu **Giỏ hàng**

#### Q: Làm thế nào để cập nhật số lượng?

**A:**
1. Vào trang giỏ hàng
2. Sử dụng nút +/- để thay đổi số lượng
3. Số lượng sẽ tự động cập nhật

#### Q: Làm thế nào để xóa sản phẩm khỏi giỏ hàng?

**A:**
1. Vào trang giỏ hàng
2. Click nút **Xóa** bên cạnh sản phẩm
3. Sản phẩm sẽ được xóa khỏi giỏ hàng

### Câu hỏi về Thanh toán

#### Q: Các phương thức thanh toán nào được chấp nhận?

**A:**
- **Thanh toán khi nhận hàng (COD):** Thanh toán khi nhận hàng
- **Chuyển khoản ngân hàng:** Chuyển khoản trước, có thể upload biên lai
- **VietQR:** Quét QR code để thanh toán
- **Ví MoMo:** Thanh toán qua ví MoMo

#### Q: Làm thế nào để thanh toán bằng VietQR?

**A:**
1. Chọn **VietQR** ở trang checkout
2. Hoàn tất đơn hàng
3. Quét QR code bằng app ngân hàng
4. Xác nhận thanh toán

#### Q: Làm thế nào để thanh toán bằng MoMo?

**A:**
1. Chọn **Ví MoMo** ở trang checkout
2. Hoàn tất đơn hàng
3. Click **Thanh toán bằng MoMo**
4. Chuyển đến trang MoMo để thanh toán
5. Quay lại website sau khi thanh toán thành công

#### Q: Khi nào tôi cần thanh toán?

**A:**
- **COD:** Thanh toán khi nhận hàng
- **Chuyển khoản:** Thanh toán trước khi giao hàng
- **VietQR/MoMo:** Thanh toán ngay sau khi đặt hàng

### Câu hỏi về Vận chuyển

#### Q: Phí vận chuyển được tính như thế nào?

**A:**
- Phí vận chuyển dựa trên:
  - **Cân nặng:** Cân nặng thực tế hoặc cân nặng quy đổi (tùy cái nào lớn hơn)
  - **Cân nặng quy đổi:** (Chiều dài × Chiều rộng × Chiều cao) / 6000
  - **Địa chỉ giao hàng:** Tỉnh/thành, quận/huyện

#### Q: Tại sao phí vận chuyển cao?

**A:**
- Gấu bông là sản phẩm cồng kềnh, chiếm nhiều không gian
- Phí vận chuyển được tính theo cân nặng quy đổi (volumetric weight)
- Phí có thể cao hơn nếu địa chỉ giao hàng xa

#### Q: Thời gian giao hàng là bao lâu?

**A:**
- **Nội thành:** 1-2 ngày
- **Tỉnh/thành khác:** 2-5 ngày
- Thời gian có thể thay đổi tùy địa chỉ và đơn vị vận chuyển

#### Q: Tôi có thể thay đổi địa chỉ giao hàng sau khi đặt hàng không?

**A:**
- Liên hệ shop ngay sau khi đặt hàng
- Nếu đơn hàng chưa được xử lý, có thể thay đổi địa chỉ

### Câu hỏi về Đơn hàng

#### Q: Làm thế nào để xem đơn hàng của tôi?

**A:**
1. Đăng nhập vào tài khoản
2. Vào **Đơn hàng của tôi**
3. Xem danh sách tất cả đơn hàng

#### Q: Làm thế nào để hủy đơn hàng?

**A:**
1. Vào chi tiết đơn hàng
2. Click **Hủy đơn hàng** (nếu đơn hàng chưa được xử lý)
3. Xác nhận hủy đơn hàng

**Lưu ý:** Chỉ có thể hủy đơn hàng ở trạng thái "Chờ xử lý" hoặc "Đang xử lý"

#### Q: Làm thế nào để tải hóa đơn?

**A:**
1. Vào chi tiết đơn hàng
2. Click **Tải hóa đơn PDF**
3. Hóa đơn sẽ được tải về

#### Q: Làm thế nào để đặt lại đơn hàng cũ?

**A:**
1. Vào chi tiết đơn hàng cũ
2. Click **Đặt lại đơn hàng**
3. Sản phẩm sẽ được thêm vào giỏ hàng
4. Vào giỏ hàng và checkout

### Câu hỏi về Tài khoản

#### Q: Làm thế nào để đăng ký tài khoản?

**A:**
1. Click **Đăng ký** ở header
2. Điền thông tin:
   - Email
   - Username
   - Password
3. Click **Đăng ký**

#### Q: Làm thế nào để đăng nhập?

**A:**
1. Click **Đăng nhập** ở header
2. Nhập **Email/Username** và **Password**
3. Click **Đăng nhập**

#### Q: Tôi quên mật khẩu, làm thế nào?

**A:**
1. Vào trang đăng nhập
2. Click **Quên mật khẩu?**
3. Nhập email
4. Kiểm tra email để đặt lại mật khẩu

#### Q: Làm thế nào để quản lý địa chỉ?

**A:**
1. Đăng nhập vào tài khoản
2. Vào **Địa chỉ của tôi**
3. **Chỉnh sửa:** Click **Sửa địa chỉ**
4. **Xóa:** Click **Xóa địa chỉ**

---

## 🔧 Troubleshooting Guide

### Vấn đề về Đăng nhập

#### Không thể đăng nhập

**Nguyên nhân:**
- Sai username/email hoặc password
- Tài khoản bị khóa
- Vấn đề với session

**Giải pháp:**
1. Kiểm tra lại username/email và password
2. Sử dụng "Quên mật khẩu?" để đặt lại
3. Xóa cookies và cache
4. Thử lại sau vài phút
5. Liên hệ support nếu vẫn không được

### Vấn đề về Giỏ hàng

#### Sản phẩm không thêm vào giỏ hàng

**Nguyên nhân:**
- Sản phẩm hết hàng
- Lỗi kết nối
- Vấn đề với browser

**Giải pháp:**
1. Kiểm tra sản phẩm còn hàng không
2. Refresh trang
3. Xóa cache và cookies
4. Thử browser khác
5. Liên hệ support nếu vẫn không được

#### Giỏ hàng bị mất sản phẩm

**Nguyên nhân:**
- Cookies bị xóa
- Session hết hạn
- Đăng nhập/đăng xuất

**Giải pháp:**
1. Đăng nhập để sync giỏ hàng với server
2. Thêm lại sản phẩm vào giỏ hàng
3. Không xóa cookies khi đang shopping

### Vấn đề về Thanh toán

#### Không thể thanh toán bằng VietQR

**Nguyên nhân:**
- QR code không hiển thị
- App ngân hàng không hỗ trợ
- Lỗi kết nối

**Giải pháp:**
1. Refresh trang
2. Kiểm tra app ngân hàng có hỗ trợ VietQR không
3. Thử phương thức thanh toán khác
4. Liên hệ support

#### Không thể thanh toán bằng MoMo

**Nguyên nhân:**
- Lỗi redirect
- MoMo app không mở
- Lỗi kết nối

**Giải pháp:**
1. Kiểm tra đã cài app MoMo chưa
2. Thử lại
3. Kiểm tra kết nối internet
4. Thử phương thức thanh toán khác
5. Liên hệ support

#### Thanh toán thành công nhưng đơn hàng không tạo

**Giải pháp:**
1. Kiểm tra email xác nhận
2. Vào **Đơn hàng của tôi** để kiểm tra
3. Liên hệ support với thông tin thanh toán

### Vấn đề về Vận chuyển

#### Phí vận chuyển không hiển thị

**Nguyên nhân:**
- Chưa nhập địa chỉ giao hàng
- Lỗi tính toán
- Sản phẩm thiếu dimensions

**Giải pháp:**
1. Nhập đầy đủ địa chỉ giao hàng
2. Refresh trang
3. Kiểm tra sản phẩm có dimensions không
4. Liên hệ support nếu vẫn không được

#### Phí vận chuyển không chính xác

**Giải pháp:**
1. Phí vận chuyển là ước tính, có thể thay đổi khi giao hàng
2. Liên hệ shop để xác nhận phí chính xác
3. Shop sẽ liên hệ nếu phí thay đổi

### Vấn đề về Đơn hàng

#### Không nhận được email xác nhận

**Nguyên nhân:**
- Email vào spam
- Sai địa chỉ email
- Lỗi gửi email

**Giải pháp:**
1. Kiểm tra thư mục spam
2. Kiểm tra lại địa chỉ email
3. Vào **Đơn hàng của tôi** để xem đơn hàng
4. Liên hệ support nếu cần

#### Không thể hủy đơn hàng

**Nguyên nhân:**
- Đơn hàng đã được xử lý
- Đơn hàng đang giao hàng
- Đơn hàng đã hoàn thành

**Giải pháp:**
1. Chỉ có thể hủy đơn hàng ở trạng thái "Chờ xử lý" hoặc "Đang xử lý"
2. Liên hệ shop để hủy đơn hàng nếu đã xử lý

### Vấn đề về Website

#### Trang web không tải được

**Giải pháp:**
1. Kiểm tra kết nối internet
2. Refresh trang (F5)
3. Xóa cache và cookies
4. Thử browser khác
5. Thử sau vài phút
6. Liên hệ support nếu vẫn không được

#### Hình ảnh không hiển thị

**Giải pháp:**
1. Refresh trang
2. Kiểm tra kết nối internet
3. Xóa cache
4. Thử browser khác

#### Trang web chậm

**Giải pháp:**
1. Kiểm tra kết nối internet
2. Đóng các tab không cần thiết
3. Xóa cache và cookies
4. Thử browser khác

### Liên hệ Hỗ trợ

Nếu gặp vấn đề không giải quyết được:

1. **Email:** support@yourdomain.com
2. **Hotline:** 1900-xxxx
3. **Facebook:** [Facebook Page]
4. **Zalo:** [Zalo OA]

**Khi liên hệ, vui lòng cung cấp:**
- Mô tả vấn đề
- Screenshot (nếu có)
- Thông tin đơn hàng (nếu liên quan)
- Browser và OS đang sử dụng

---

## 📝 Notes

- Tài liệu này được cập nhật thường xuyên
- Nếu có câu hỏi không có trong FAQ, vui lòng liên hệ support
- Admin guide dành cho người quản lý website
- Customer FAQ dành cho khách hàng
- Troubleshooting guide giúp giải quyết các vấn đề thường gặp

