# WPGraphQL Cart Integration - Tóm tắt

## ✅ Đã hoàn thành

### 1. Cart Sync Hook (`lib/hooks/useCartSync.ts`)
- ✅ Tích hợp `addToCart` mutation
- ✅ Tích hợp `updateItemQuantities` mutation
- ✅ Tích hợp `removeItemsFromCart` mutation
- ✅ Auto-sync local cart to server khi user login
- ✅ Auto-sync server cart to local khi có data
- ✅ Handle cart conflicts (local vs server)

### 2. Integration với Components
- ✅ `ProductCard` - Sử dụng `useCartSync` thay vì `useCartStore` trực tiếp
- ✅ `AddToCartButton` - Sync với server khi add
- ✅ `CartPage` - Sync khi update/remove
- ✅ `CartDrawer` - Sync khi update/remove

### 3. Cart Store Updates
- ✅ Thêm `serverKey` field vào `CartItem` interface (cho future use)
- ✅ Giữ nguyên localStorage persistence cho offline support

## 🔄 Cart Sync Flow

### Khi User Chưa Login
- Cart chỉ lưu trong localStorage (Zustand)
- Tất cả operations (add, update, remove) chỉ ảnh hưởng local cart

### Khi User Login
1. **First Sync (Local → Server):**
   - Kiểm tra local cart có items không
   - Nếu có, sync tất cả items lên server
   - Clear local cart sau khi sync thành công
   - Set flag `cart-synced` trong sessionStorage

2. **Server → Local:**
   - Nếu local cart trống và server có items
   - Load items từ server vào local cart

3. **Ongoing Operations:**
   - Add/Update/Remove operations update cả local và server
   - Optimistic updates: Local update ngay, server update async
   - Nếu server update fails, local cart vẫn giữ changes

## 📝 Technical Details

### Mutations Used
- `AddToCartDocument` - Add product to cart
- `UpdateCartItemDocument` - Update quantity
- `RemoveCartItemDocument` - Remove item

### Queries Used
- `GetCartDocument` - Fetch server cart state

### Conflict Resolution
- **Local cart có items khi login:** Sync local → server, clear local
- **Server cart có items, local empty:** Load server → local
- **Both có items:** Ưu tiên local (sync local → server)

## 🚧 Limitations & Future Improvements

### Current Limitations
- ServerKey không được lưu trong Zustand store (có thể extend nếu cần)
- Conflict resolution đơn giản (ưu tiên local)
- Không có merge strategy cho conflicts

### Future Improvements
- [ ] Smart merge: Merge quantities thay vì replace
- [ ] Conflict resolution UI: Cho user chọn local vs server
- [ ] Offline queue: Queue operations khi offline, sync khi online
- [ ] Cart persistence across devices (via server)

## 🧪 Testing Checklist

- [ ] Add to cart khi chưa login (local only)
- [ ] Add to cart khi đã login (local + server)
- [ ] Login với local cart có items (sync local → server)
- [ ] Login với server cart có items (load server → local)
- [ ] Update quantity (sync với server)
- [ ] Remove item (sync với server)
- [ ] Logout (cart vẫn trong localStorage)
- [ ] Multiple tabs (cart sync across tabs)

