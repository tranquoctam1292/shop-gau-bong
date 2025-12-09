# 📝 HƯỚNG DẪN SETUP ACF CUSTOM FIELDS

## ✅ Bạn đang làm đúng!

Bạn đã:
- ✅ Tạo Field Group: "Thông số Vận chuyển Gấu Bông" (hoặc "Product Specs")
- ✅ Tạo field đầu tiên: "Chiều Dài" (length) với type Number

## ⚠️ Điều chỉnh cần thiết

### 1. Default Value cho Length field

**Hiện tại:** Default Value = `cm` ❌

**Nên sửa:** Để trống hoặc `0` ✅

**Lý do:** 
- Field type là **Number**, không phải Text
- Default value phải là số, không phải đơn vị
- Đơn vị "cm" sẽ được hiển thị trong UI, không cần trong field

**Cách sửa:**
1. Click vào field "Chiều Dài"
2. Tìm "Default Value"
3. Xóa "cm", để trống hoặc nhập `0`
4. Save field

### 2. Location Rules (Quan trọng!)

**Cần verify:**
1. Scroll lên trên, tìm phần **"Location"** (bên trái, phía trên field list)
2. Click vào **"Location"** tab
3. Verify có rule:
   - **Show this field group if** 
   - **Post Type** is equal to **Product**
4. Nếu chưa có, thêm rule này

**Tại sao quan trọng:**
- Nếu không có Location rule, fields sẽ hiển thị ở tất cả post types
- Chúng ta chỉ cần fields này cho Products

### 3. Field Settings cho Length

**Cần check:**
- ✅ **Required:** Yes (bắt buộc)
- ✅ **Field Type:** Number
- ✅ **Field Name:** `length` (đúng rồi)
- ✅ **Field Label:** "Chiều Dài" (OK)
- ⚠️ **Default Value:** Để trống (sửa từ "cm")
- ✅ **Instructions:** "Chiều dài sản phẩm (cm)" (nên thêm)

## 📋 Tiếp tục tạo các fields còn lại

Sau khi sửa field "Chiều Dài", tiếp tục tạo các fields:

### Field 2: Width (Chiều rộng)
- **Field Label:** `Width` hoặc `Chiều Rộng`
- **Field Name:** `width`
- **Field Type:** Number
- **Required:** Yes
- **Default Value:** (để trống)
- **Instructions:** "Chiều rộng sản phẩm (cm)"

### Field 3: Height (Chiều cao)
- **Field Label:** `Height` hoặc `Chiều Cao`
- **Field Name:** `height`
- **Field Type:** Number
- **Required:** Yes
- **Default Value:** (để trống)
- **Instructions:** "Chiều cao sản phẩm (cm)"

### Field 4: Volumetric Weight (Cân nặng quy đổi)
- **Field Label:** `Volumetric Weight` hoặc `Cân Nặng Quy Đổi`
- **Field Name:** `volumetric_weight`
- **Field Type:** Number
- **Required:** No (sẽ tự động tính)
- **Default Value:** (để trống)
- **Instructions:** "Cân nặng quy đổi thể tích (tự động tính: L × W × H / 6000)"
- **Read Only:** Có thể enable nếu muốn (sẽ tự động tính)

### Field 5: Material (Chất liệu)
- **Field Label:** `Material` hoặc `Chất Liệu`
- **Field Name:** `material`
- **Field Type:** Text
- **Required:** No
- **Default Value:** (để trống)

### Field 6: Origin (Xuất xứ)
- **Field Label:** `Origin` hoặc `Xuất Xứ`
- **Field Name:** `origin`
- **Field Type:** Text
- **Required:** No
- **Default Value:** (để trống)

## 🔍 GraphQL Tab (Quan trọng!)

Sau khi tạo xong tất cả fields:

1. **Click vào từng field**
2. **Vào tab "GraphQL"**
3. **Verify:**
   - ✅ "Show in GraphQL" được enable
   - ✅ "GraphQL Field Name" đúng (thường là field name)

**Lưu ý:** Nếu không enable GraphQL, fields sẽ không xuất hiện trong GraphQL queries!

## ✅ Checklist sau khi tạo xong

- [ ] Field Group name: "Product Specs" hoặc "Thông số Vận chuyển Gấu Bông"
- [ ] Location rule: Show if Post Type = Product
- [ ] Field "length" (Number, Required, Default = trống)
- [ ] Field "width" (Number, Required, Default = trống)
- [ ] Field "height" (Number, Required, Default = trống)
- [ ] Field "volumetric_weight" (Number, Not Required)
- [ ] Field "material" (Text, Not Required)
- [ ] Field "origin" (Text, Not Required)
- [ ] Tất cả fields đã enable GraphQL
- [ ] Click "Save Changes" để lưu Field Group

## 🧪 Test sau khi tạo

1. **Tạo test product:**
   - Vào Products > Add New
   - Scroll xuống, verify fields hiển thị
   - Điền Length, Width, Height
   - Save product
   - Verify Volumetric Weight tự động tính

2. **Test GraphQL:**
   ```graphql
   query {
     products(first: 1) {
       nodes {
         ... on SimpleProduct {
           id
           name
           productSpecs {
             length
             width
             height
             volumetricWeight
           }
         }
       }
     }
   }
   ```

## 📝 Lưu ý

- **Field Names** phải đúng: `length`, `width`, `height`, `volumetric_weight`, `material`, `origin`
- **Location Rules** phải đúng: Chỉ hiển thị cho Product post type
- **GraphQL** phải enable cho tất cả fields
- **Default Value** cho Number fields nên để trống, không phải "cm"

