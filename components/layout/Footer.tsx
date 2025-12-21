'use client';

import Link from 'next/link';
import type { SiteSettings } from '@/types/siteSettings';

interface FooterProps {
  siteSettings?: SiteSettings | null;
}

export function Footer({ siteSettings }: FooterProps) {
  const copyright = siteSettings?.footer.copyright || `© ${new Date().getFullYear()} Shop Gấu Bông. All rights reserved.`;
  const address = siteSettings?.footer.address;
  const email = siteSettings?.footer.email;
  const phone = siteSettings?.footer.phone;
  const socialLinks = siteSettings?.footer.socialLinks || [];
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
              {email && <li>📧 Email: <a href={`mailto:${email}`} className="hover:text-primary transition-colors">{email}</a></li>}
              {phone && <li>📞 Hotline: <a href={`tel:${phone}`} className="hover:text-primary transition-colors">{phone}</a></li>}
              {address && <li>📍 Địa chỉ: {address}</li>}
            </ul>
            
            {/* Social Links */}
            {socialLinks.length > 0 && (
              <div className="mt-4 flex gap-3">
                {socialLinks.map((link, index) => (
                  <a
                    key={index}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-text-muted hover:text-primary transition-colors"
                    aria-label={link.label || link.platform}
                  >
                    {link.platform === 'facebook' && '📘'}
                    {link.platform === 'instagram' && '📷'}
                    {link.platform === 'youtube' && '📺'}
                    {link.platform === 'zalo' && '💬'}
                    {link.platform === 'tiktok' && '🎵'}
                    {link.platform === 'twitter' && '🐦'}
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-8 pt-8 border-t text-center text-sm text-text-muted">
          <p>{copyright}</p>
        </div>
      </div>
    </footer>
  );
}

