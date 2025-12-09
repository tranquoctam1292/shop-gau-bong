'use client';

import Link from 'next/link';

export function Footer() {
  return (
    <footer className="border-t bg-background">
      <div className="container-mobile py-8 md:py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* About */}
          <div>
            <h3 className="font-heading text-lg font-semibold mb-4">Về chúng tôi</h3>
            <p className="text-sm text-text-muted">
              Shop Gấu Bông - Nơi bạn tìm thấy những chú gấu bông đáng yêu nhất.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-heading text-lg font-semibold mb-4">Liên kết nhanh</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/products" className="text-text-muted hover:text-primary transition-colors">
                  Sản phẩm
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-text-muted hover:text-primary transition-colors">
                  Giới thiệu
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-text-muted hover:text-primary transition-colors">
                  Liên hệ
                </Link>
              </li>
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h3 className="font-heading text-lg font-semibold mb-4">Hỗ trợ khách hàng</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/shipping" className="text-text-muted hover:text-primary transition-colors">
                  Vận chuyển
                </Link>
              </li>
              <Link href="/returns" className="text-text-muted hover:text-primary transition-colors">
                Đổi trả
              </Link>
              <li>
                <Link href="/faq" className="text-text-muted hover:text-primary transition-colors">
                  Câu hỏi thường gặp
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-heading text-lg font-semibold mb-4">Liên hệ</h3>
            <ul className="space-y-2 text-sm text-text-muted">
              <li>📧 Email: info@shopgaubong.com</li>
              <li>📞 Hotline: 1900-xxxx</li>
              <li>📍 Địa chỉ: Hà Nội, Việt Nam</li>
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-8 pt-8 border-t text-center text-sm text-text-muted">
          <p>© {new Date().getFullYear()} Shop Gấu Bông. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}

