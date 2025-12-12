Cơ chế Thanh công cụ Trượt (Sticky Toolbar) - Trải nghiệm UX

Để hỗ trợ người dùng khi soạn thảo các bài viết dài, thanh công cụ cần có khả năng "dính" (stick) lên mép trên màn hình khi cuộn xuống.

Mô tả hành vi (Behavior):

Khi người dùng cuộn trang (scroll) xuống dưới và khuất thanh công cụ gốc, thanh công cụ sẽ tự động tách ra và ghim cố định ở cạnh trên cửa sổ trình duyệt.

Khi người dùng cuộn ngược lên trên hoặc cuộn qua hết khu vực soạn thảo (đến footer), thanh công cụ sẽ trả về vị trí cũ hoặc ẩn đi.

Logic Kỹ thuật:

Trigger: Lắng nghe sự kiện window.onscroll.

Offset (Khoảng cách): Cần tính toán chiều cao của Admin Bar (thanh đen mặc định của CMS, thường là 32px).

CSS Logic: top: 32px (để không bị Admin Bar che khuất).

Width: Chiều rộng của thanh công cụ dính phải bằng đúng chiều rộng của khung soạn thảo (width: inherit hoặc tính toán bằng JS) để tránh vỡ giao diện layout.

Z-Index: Thiết lập z-index cao (ví dụ: 999) để luôn nổi lên trên các thành phần khác.