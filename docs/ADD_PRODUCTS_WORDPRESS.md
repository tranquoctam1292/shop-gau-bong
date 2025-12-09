# Hướng dẫn thêm Products vào WordPress

## Mục đích
Thêm sample products vào WordPress để E2E tests có thể pass và để test các tính năng của website.

## Các bước thực hiện

### 1. Đăng nhập WordPress Admin
1. Truy cập `http://localhost/wordpress/wp-admin`
2. Đăng nhập với admin account

### 2. Tạo Product Categories (nếu chưa có)
1. Vào **Products > Categories**
2. Tạo các categories:
   - **Gấu bông nhỏ** (slug: `gau-bong-nho`)
   - **Gấu bông vừa** (slug: `gau-bong-vua`)
   - **Gấu bông lớn** (slug: `gau-bong-lon`)
   - **Gấu bông cao cấp** (slug: `gau-bong-cao-cap`)

### 3. Tạo Sample Products

#### Product 1: Gấu bông nhỏ
- **Name:** Gấu bông Teddy nhỏ
- **Slug:** `gau-bong-teddy-nho`
- **Category:** Gấu bông nhỏ
- **Price:** 150,000₫
- **Regular Price:** 200,000₫ (để có sale badge)
- **Stock Status:** In Stock
- **Stock Quantity:** 50
- **Short Description:** Gấu bông Teddy nhỏ đáng yêu, phù hợp cho trẻ em
- **Description:** 
  ```
  Gấu bông Teddy nhỏ là sản phẩm hoàn hảo cho trẻ em. 
  Với kích thước vừa phải, dễ dàng mang theo và ôm ấp.
  
  Đặc điểm:
  - Chất liệu mềm mại, an toàn cho trẻ em
  - Thiết kế đáng yêu, màu sắc tươi sáng
  - Dễ dàng vệ sinh
  ```
- **Product Image:** Upload ảnh gấu bông nhỏ
- **Gallery Images:** Thêm 2-3 ảnh phụ
- **ACF Fields:**
  - **Length:** 20 cm
  - **Width:** 15 cm
  - **Height:** 25 cm
  - **Weight:** 0.3 kg
  - **Material:** Bông gòn
  - **Origin:** Việt Nam

#### Product 2: Gấu bông vừa
- **Name:** Gấu bông Teddy vừa
- **Slug:** `gau-bong-teddy-vua`
- **Category:** Gấu bông vừa
- **Price:** 350,000₫
- **Stock Status:** In Stock
- **Stock Quantity:** 30
- **Short Description:** Gấu bông Teddy kích thước vừa, phù hợp làm quà tặng
- **Description:** 
  ```
  Gấu bông Teddy vừa là lựa chọn hoàn hảo cho quà tặng.
  Kích thước vừa phải, không quá lớn cũng không quá nhỏ.
  ```
- **Product Image:** Upload ảnh gấu bông vừa
- **ACF Fields:**
  - **Length:** 40 cm
  - **Width:** 30 cm
  - **Height:** 50 cm
  - **Weight:** 0.8 kg
  - **Material:** Bông gòn cao cấp
  - **Origin:** Việt Nam

#### Product 3: Gấu bông lớn
- **Name:** Gấu bông Teddy lớn
- **Slug:** `gau-bong-teddy-lon`
- **Category:** Gấu bông lớn
- **Price:** 650,000₫
- **Stock Status:** In Stock
- **Stock Quantity:** 20
- **Short Description:** Gấu bông Teddy lớn, mềm mại và đáng yêu
- **Description:** 
  ```
  Gấu bông Teddy lớn là sản phẩm cao cấp với kích thước lớn.
  Hoàn hảo để trang trí phòng ngủ hoặc làm quà tặng đặc biệt.
  ```
- **Product Image:** Upload ảnh gấu bông lớn
- **ACF Fields:**
  - **Length:** 60 cm
  - **Width:** 45 cm
  - **Height:** 80 cm
  - **Weight:** 1.2 kg
  - **Material:** Bông gòn cao cấp
  - **Origin:** Việt Nam

#### Product 4: Gấu bông cao cấp
- **Name:** Gấu bông Teddy cao cấp
- **Slug:** `gau-bong-teddy-cao-cap`
- **Category:** Gấu bông cao cấp
- **Price:** 1,200,000₫
- **Regular Price:** 1,500,000₫ (để có sale badge)
- **Stock Status:** In Stock
- **Stock Quantity:** 10
- **Short Description:** Gấu bông Teddy cao cấp, chất liệu nhập khẩu
- **Description:** 
  ```
  Gấu bông Teddy cao cấp với chất liệu nhập khẩu từ châu Âu.
  Thiết kế tinh tế, độ bền cao, phù hợp làm quà tặng đặc biệt.
  ```
- **Product Image:** Upload ảnh gấu bông cao cấp
- **ACF Fields:**
  - **Length:** 70 cm
  - **Width:** 50 cm
  - **Height:** 90 cm
  - **Weight:** 1.5 kg
  - **Material:** Bông gòn nhập khẩu
  - **Origin:** Châu Âu

#### Product 5: Gấu bông mini (để test volumetric weight < actual weight)
- **Name:** Gấu bông Mini
- **Slug:** `gau-bong-mini`
- **Category:** Gấu bông nhỏ
- **Price:** 80,000₫
- **Stock Status:** In Stock
- **Stock Quantity:** 100
- **Short Description:** Gấu bông mini nhỏ gọn, dễ thương
- **Description:** Gấu bông mini nhỏ gọn, phù hợp cho trẻ sơ sinh
- **Product Image:** Upload ảnh gấu bông mini
- **ACF Fields:**
  - **Length:** 10 cm
  - **Width:** 8 cm
  - **Height:** 12 cm
  - **Weight:** 0.5 kg (actual weight > volumetric weight để test logic)
  - **Material:** Bông gòn
  - **Origin:** Việt Nam

### 4. Verify Products trong GraphQL
1. Truy cập GraphQL Playground: `http://localhost/wordpress/graphql`
2. Chạy query:
```graphql
query GetProducts {
  products(first: 10) {
    nodes {
      ... on SimpleProduct {
        id
        name
        slug
        price
        stockStatus
        image {
          sourceUrl
        }
        productSpecs {
          length
          width
          height
          volumetricWeight
          material
          origin
        }
      }
    }
  }
}
```
3. Verify tất cả products đều có đầy đủ thông tin

### 5. Test E2E Tests
Sau khi thêm products, chạy lại E2E tests:
```bash
npm run test:e2e
```

## Lưu ý
- Đảm bảo tất cả products đều có **Product Image** (required cho tests)
- Đảm bảo ACF fields được điền đầy đủ (length, width, height)
- Volumetric weight sẽ được tự động tính (nếu có custom plugin)
- Test với các products có kích thước khác nhau để verify shipping calculation

## Quick Import (nếu có WooCommerce CSV Import)
Nếu có plugin WooCommerce CSV Import Suite, có thể import products từ CSV file.

