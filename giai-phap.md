# GIẢI PHÁP: LỖI HIỂN THỊ 2 KẾT QUẢ BỘ LỌC

**Trạng thái:** ✅ ĐÃ ÁP DỤNG VÀ SỬA THÀNH CÔNG  
**Ngày hoàn thành:** 11/12/2025

---

## 1. Nguyên nhân gây lỗi
Lỗi này xuất phát từ "Xung đột trạng thái (Shared State)" kết hợp với cơ chế "React Portals".

Cấu trúc HTML: Trong file components/product/ProductFilters.tsx, bạn đang render giao diện 2 lần để phục vụ Responsive:

Khối Mobile (Dòng 2893): Được bao bọc bởi class lg:hidden (ẩn trên màn hình lớn).

Khối Desktop (Dòng 3007): Được bao bọc bởi class hidden lg:block (ẩn trên màn hình nhỏ).

Dùng chung State: Cả hai khối này đều sử dụng chung các biến state để điều khiển việc đóng/mở Popover:

pricePopoverOpen

sizePopoverOpen (Đây là cái bạn đang click trong ảnh)

colorPopoverOpen

Cơ chế React Portal: Component PopoverContent (trong components/ui/popover.tsx) sử dụng PopoverPrimitive.Portal. Portal sẽ render nội dung Popover ra ngoài DOM hiện tại (thường là cuối thẻ <body>) để tránh bị che khuất.

Kết quả: Khi bạn click nút "Kích thước" trên Desktop:

sizePopoverOpen set thành true.

Cả Popover Desktop và Popover Mobile đều nhận lệnh mở.

Popover Desktop hiển thị đúng vị trí (do nút trigger hiển thị).

Popover Mobile VẪN ĐƯỢC RENDER ra khỏi thẻ body (do cơ chế Portal thoát khỏi display: none của cha). Tuy nhiên, vì nút trigger mobile đang bị ẩn (display: none), thư viện không tính toán được vị trí neo (anchor), nên nó văng về toạ độ mặc định (thường là góc trái màn hình 0,0), tạo ra cái hộp thừa mà bạn thấy.

2. Giải pháp khắc phục
Cách xử lý triệt để là tách biệt State giữa giao diện Mobile và Desktop. Chúng ta sẽ tạo thêm bộ state riêng cho Mobile.

Bạn hãy sửa file components/product/ProductFilters.tsx như sau:

Bước 1: Khai báo thêm State cho Mobile
Tại phần đầu component (khoảng dòng 2881), thêm các state mới có tiền tố mobile:

TypeScript

// ... imports

export function ProductFilters() {
  const { filters, updateFilters, clearFilters } = useProductFilters();
  
  // --- STATE HIỆN TẠI (Dùng cho Desktop) ---
  const [pricePopoverOpen, setPricePopoverOpen] = useState(false);
  const [sizePopoverOpen, setSizePopoverOpen] = useState(false);
  const [colorPopoverOpen, setColorPopoverOpen] = useState(false);

  // --- THÊM MỚI: STATE RIÊNG CHO MOBILE ---
  const [mobilePriceOpen, setMobilePriceOpen] = useState(false);
  const [mobileSizeOpen, setMobileSizeOpen] = useState(false);
  const [mobileColorOpen, setMobileColorOpen] = useState(false);

  // ... (giữ nguyên các phần code khác)
Bước 2: Cập nhật khối Mobile (Khối lg:hidden)
Tìm đến khối div có class lg:hidden (khoảng dòng 2893). Thay thế các biến state trong các thẻ Popover bên trong khối này thành biến mobile... tương ứng.

Sửa Popover Giá (Mobile):

TypeScript

{/* Tìm đoạn này trong khối lg:hidden */}
<Popover 
  open={mobilePriceOpen} // Sửa ở đây
  onOpenChange={setMobilePriceOpen} // Sửa ở đây
  modal={false}
>
  {/* ... nội dung bên trong giữ nguyên ... */}
  {/* Lưu ý: Button "Áp dụng" bên trong cũng cần cập nhật để đóng đúng state */}
  <Button
    size="sm"
    className="flex-1"
    onClick={() => {
        handlePriceApply();
        setMobilePriceOpen(false); // Sửa: Đóng mobile popover
    }}
    disabled={!!priceError}
  >
    Áp dụng
  </Button>
  {/* ... */}
</Popover>
Sửa Popover Kích thước (Mobile):

TypeScript

<Popover 
  open={mobileSizeOpen} // Sửa ở đây
  onOpenChange={setMobileSizeOpen} // Sửa ở đây
  modal={false}
>
  {/* ... nội dung bên trong ... */}
  {/* Trong hàm map size options: */}
  <button
    key={option.value}
    onClick={() => {
        handleSizeSelect(option.value);
        setMobileSizeOpen(false); // Sửa: Đóng mobile popover
    }}
    // ...
  >
  {/* ... */}
</Popover>
Sửa Popover Màu sắc (Mobile):

TypeScript

<Popover 
  open={mobileColorOpen} // Sửa ở đây
  onOpenChange={setMobileColorOpen} // Sửa ở đây
  modal={false}
>
  {/* ... nội dung bên trong ... */}
  {/* Trong hàm map color options: */}
  <button
    key={option.value}
    onClick={() => {
        handleColorSelect(option.value);
        setMobileColorOpen(false); // Sửa: Đóng mobile popover
    }}
    // ...
  >
  {/* ... */}
</Popover>
Bước 3: Cập nhật hàm xử lý sự kiện (Helper Functions)
Sửa lại các hàm xử lý chọn để đóng đúng Popover dựa trên việc người dùng đang mở cái nào (hoặc đóng cả hai cho chắc chắn).

Tìm các hàm handle...Select (khoảng dòng 2890) và cập nhật:

TypeScript

  const handlePriceApply = () => {
    // ... logic validate giữ nguyên ...
    updateFilters({
      minPrice: min,
      maxPrice: max,
    });
    // Đóng cả 2 để đảm bảo
    setPricePopoverOpen(false); 
    setMobilePriceOpen(false); 
  };

  const handleSizeSelect = (size: string) => {
    updateFilters({
      size: filters.size === size ? undefined : size,
    });
    // Đóng cả 2
    setSizePopoverOpen(false);
    setMobileSizeOpen(false);
  };

  const handleColorSelect = (color: string) => {
    updateFilters({
      color: filters.color === color ? undefined : color,
    });
    // Đóng cả 2
    setColorPopoverOpen(false);
    setMobileColorOpen(false);
  };
Tóm tắt
Việc tách state sizePopoverOpen thành sizePopoverOpen (cho Desktop) và mobileSizeOpen (cho Mobile) sẽ đảm bảo khi bạn click trên Desktop, chỉ có Popover của Desktop mở ra, ngăn chặn việc Popover của Mobile (đang bị ẩn trigger) render ra một hộp "ma" ở góc màn hình.