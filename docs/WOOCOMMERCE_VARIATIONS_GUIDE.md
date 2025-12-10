# 🎨 Hướng dẫn thêm Biến thể (Variation) vào WordPress/WooCommerce

**Mục đích:** Tạo sản phẩm có nhiều Size và Màu sắc để hiển thị trong ProductCard với variant selector.

---

## 📋 Tổng quan

WooCommerce hỗ trợ **Variable Products** - sản phẩm có nhiều biến thể (variations) như:
- **Size:** 60cm, 80cm, 1m, 1m2...
- **Color:** Đỏ, Hồng, Xanh, Trắng...
- **Price:** Mỗi biến thể có thể có giá khác nhau

---

## 🚀 Bước 1: Tạo Product Attributes (Thuộc tính)

### 1.1. Vào WordPress Admin

1. Đăng nhập WordPress Admin
2. Vào **Products** → **Attributes** (Sản phẩm → Thuộc tính)

### 1.2. Tạo Attribute "Size" (Kích thước)

1. **Name:** `Size` hoặc `Kích thước`
2. **Slug:** `size` (tự động tạo)
3. Click **Add attribute** (Thêm thuộc tính)

### 1.3. Thêm Terms cho Size

1. Click **Configure terms** (Cấu hình thuật ngữ) bên cạnh "Size"
2. Thêm các size:
   - **Name:** `60cm` → **Slug:** `60cm`
   - **Name:** `80cm` → **Slug:** `80cm`
   - **Name:** `1m` → **Slug:** `1m`
   - **Name:** `1m2` → **Slug:** `1m2`
3. Click **Add new Size** cho mỗi size

### 1.4. Tạo Attribute "Color" (Màu sắc)

1. **Name:** `Color` hoặc `Màu sắc`
2. **Slug:** `color` (tự động tạo)
3. Click **Add attribute**

### 1.5. Thêm Terms cho Color

1. Click **Configure terms** bên cạnh "Color"
2. Thêm các màu:
   - **Name:** `Đỏ` → **Slug:** `do` → **Description:** `#EF4444` (hex code)
   - **Name:** `Hồng` → **Slug:** `hong` → **Description:** `#F687A8`
   - **Name:** `Xanh` → **Slug:** `xanh` → **Description:** `#3B82F6`
   - **Name:** `Trắng` → **Slug:** `trang` → **Description:** `#FFFFFF`
   - **Name:** `Vàng` → **Slug:** `vang` → **Description:** `#FCD34D`

**Lưu ý:** Description có thể lưu hex code để frontend hiển thị màu chính xác.

---

## 🛍️ Bước 2: Tạo Variable Product

### 2.1. Tạo sản phẩm mới

1. Vào **Products** → **Add New** (Sản phẩm → Thêm mới)
2. Điền thông tin cơ bản:
   - **Product name:** Tên sản phẩm (ví dụ: "Gấu Bông Teddy")
   - **Product description:** Mô tả sản phẩm
   - **Short description:** Mô tả ngắn

### 2.2. Chọn Product Type

1. Trong **Product Data** box, chọn **Product type:** `Variable product`
2. Tab **General:**
   - **Regular price:** Giá cơ bản (sẽ được override bởi variations)
   - **Sale price:** (Tùy chọn)

### 2.3. Thêm Attributes vào Product

1. Mở tab **Attributes**
2. Chọn **Custom product attribute** dropdown → Chọn **Size**
3. Click **Add**
4. Check **Used for variations** (Quan trọng!)
5. Thêm các **Values:**
   - Click **Add** và chọn: `60cm`, `80cm`, `1m`, `1m2`
   - Hoặc nhập thủ công: `60cm | 80cm | 1m | 1m2`
6. Lặp lại với **Color:**
   - Chọn **Color** từ dropdown
   - Check **Used for variations**
   - Thêm values: `Đỏ | Hồng | Xanh | Trắng | Vàng`
7. Click **Save attributes**

### 2.4. Tạo Variations

1. Mở tab **Variations**
2. Chọn **Create variations from all attributes** → Click **Go**
3. WooCommerce sẽ tạo tất cả combinations:
   - 60cm + Đỏ
   - 60cm + Hồng
   - 60cm + Xanh
   - ...
   - 1m2 + Vàng

### 2.5. Cấu hình từng Variation

1. Click vào từng variation để mở editor
2. Điền thông tin:
   - **SKU:** (Tùy chọn) Ví dụ: `GB-TEDDY-60-DO`
   - **Price:** Giá cho variation này (ví dụ: 200,000đ)
   - **Regular price:** Giá thường
   - **Sale price:** (Nếu có giảm giá)
   - **Stock status:** `In stock` / `Out of stock`
   - **Stock quantity:** Số lượng tồn kho
   - **Image:** Ảnh riêng cho variation này (nếu có)
   - **Weight:** Trọng lượng (cho shipping)
   - **Dimensions:** Kích thước (Length, Width, Height)
3. Click **Save changes**

### 2.6. Set Default Variation (Tùy chọn)

1. Trong tab **Variations**
2. Chọn **Default Form Values:**
   - **Default Size:** `60cm`
   - **Default Color:** `Đỏ`
3. Variation này sẽ được chọn mặc định khi khách xem sản phẩm

---

## 🔧 Bước 3: Cấu hình ACF Fields (Nếu cần)

Nếu bạn muốn lưu thêm thông tin cho từng variation (ví dụ: hex code màu):

### 3.1. Tạo ACF Field cho Color Terms

1. Vào **Custom Fields** → **Field Groups**
2. Tạo Field Group mới: "Color Hex Code"
3. Thêm Field:
   - **Field Label:** `Hex Color Code`
   - **Field Name:** `hex_color`
   - **Field Type:** `Text`
   - **Location Rules:** 
     - **Show this field group if:** `Taxonomy Term` is equal to `Color`
4. Save Field Group

### 3.2. Điền Hex Code cho mỗi Color Term

1. Vào **Products** → **Attributes** → **Color** → **Configure terms**
2. Click vào từng màu (ví dụ: "Đỏ")
3. Scroll xuống phần "Color Hex Code"
4. Điền hex code: `#EF4444`
5. Update

---

## 📡 Bước 4: Kiểm tra REST API Response

### 4.1. Test API Endpoint

Sau khi tạo variable product, kiểm tra API response:

```
GET /wp-json/wc/v3/products/{product_id}
```

### 4.2. Response sẽ có:

```json
{
  "id": 123,
  "name": "Gấu Bông Teddy",
  "type": "variable",
  "attributes": [
    {
      "id": 1,
      "name": "Size",
      "options": ["60cm", "80cm", "1m", "1m2"],
      "variation": true,
      "visible": true
    },
    {
      "id": 2,
      "name": "Color",
      "options": ["Đỏ", "Hồng", "Xanh", "Trắng", "Vàng"],
      "variation": true,
      "visible": true
    }
  ],
  "variations": [456, 457, 458, ...], // Array of variation IDs
  "default_attributes": [
    {
      "id": 1,
      "name": "Size",
      "option": "60cm"
    },
    {
      "id": 2,
      "name": "Color",
      "option": "Đỏ"
    }
  ]
}
```

### 4.3. Fetch Variation Details

Để lấy giá của từng variation:

```
GET /wp-json/wc/v3/products/{product_id}/variations/{variation_id}
```

Response:
```json
{
  "id": 456,
  "price": "200000",
  "regular_price": "250000",
  "sale_price": "200000",
  "on_sale": true,
  "attributes": [
    {
      "id": 1,
      "name": "Size",
      "option": "60cm"
    },
    {
      "id": 2,
      "name": "Color",
      "option": "Đỏ"
    }
  ],
  "image": {
    "src": "https://example.com/image-red-60cm.jpg"
  },
  "stock_status": "instock",
  "stock_quantity": 10
}
```

---

## ✅ Checklist

- [ ] Đã tạo Attribute "Size" với các terms (60cm, 80cm, 1m, 1m2)
- [ ] Đã tạo Attribute "Color" với các terms (Đỏ, Hồng, Xanh...)
- [ ] Đã tạo Variable Product
- [ ] Đã thêm Attributes vào product và check "Used for variations"
- [ ] Đã tạo Variations từ tất cả combinations
- [ ] Đã cấu hình giá và stock cho từng variation
- [ ] Đã test API response có đúng attributes và variations
- [ ] Frontend ProductCard đã hiển thị size buttons và color dots

---

## 🎯 Lưu ý quan trọng

1. **"Used for variations" phải được check:** Nếu không check, attributes sẽ không tạo variations được.

2. **Variation Price:** Nếu variation không có price riêng, nó sẽ dùng giá của parent product.

3. **Variation Image:** Mỗi variation có thể có ảnh riêng (ví dụ: ảnh gấu bông màu đỏ khác với màu hồng).

4. **Stock Management:** Có thể quản lý stock riêng cho từng variation.

5. **Default Variation:** Nên set default variation để khách hàng thấy giá ngay khi vào trang.

---

## 🔗 Tài liệu tham khảo

- [WooCommerce Variable Products](https://woocommerce.com/document/variable-product/)
- [WooCommerce Product Attributes](https://woocommerce.com/document/managing-product-taxonomies/)
- [WooCommerce REST API - Products](https://woocommerce.github.io/woocommerce-rest-api-docs/#products)

---

## 📝 Ví dụ cấu hình hoàn chỉnh

### Product: "Gấu Bông Teddy"

**Attributes:**
- Size: 60cm, 80cm, 1m, 1m2
- Color: Đỏ (#EF4444), Hồng (#F687A8), Xanh (#3B82F6), Trắng (#FFFFFF)

**Variations:**
- 60cm + Đỏ: 200,000đ
- 60cm + Hồng: 200,000đ
- 80cm + Đỏ: 350,000đ
- 80cm + Hồng: 350,000đ
- 1m + Đỏ: 500,000đ
- 1m + Hồng: 500,000đ
- 1m2 + Đỏ: 800,000đ
- 1m2 + Hồng: 800,000đ
- ... (tất cả combinations)

**Default:** 60cm + Đỏ

---

**Sau khi hoàn thành:** Frontend ProductCard sẽ tự động hiển thị size buttons và color dots từ `product.attributes`!

