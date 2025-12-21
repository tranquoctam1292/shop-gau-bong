'use client';

import Link from 'next/link';
import Image from 'next/image';
import { 
  Facebook, 
  Instagram, 
  Youtube, 
  Twitter, 
  MessageCircle,
  Music2,
  Mail,
  Phone,
  MapPin
} from 'lucide-react';
import { useMenu, type MenuItem } from '@/lib/hooks/useMenu';
import { SITE_CONFIG } from '@/lib/constants/config';
import type { SiteSettings } from '@/types/siteSettings';

interface FooterProps {
  siteSettings?: SiteSettings | null;
}

/**
 * Payment Icons Component
 * Simple SVG icons for payment methods
 */
function PaymentIcons() {
  return (
    <div className="flex items-center gap-3 flex-wrap justify-center">
      {/* Visa */}
      <div className="w-10 h-6 bg-white rounded flex items-center justify-center border border-gray-200">
        <span className="text-[10px] font-bold text-[#1A1F71]">VISA</span>
      </div>
      {/* Mastercard */}
      <div className="w-10 h-6 bg-white rounded flex items-center justify-center border border-gray-200">
        <span className="text-[8px] font-bold text-[#EB001B]">MC</span>
      </div>
      {/* MoMo */}
      <div className="w-10 h-6 bg-[#AF0E4E] rounded flex items-center justify-center">
        <span className="text-[8px] font-bold text-white">MoMo</span>
      </div>
      {/* VietQR */}
      <div className="w-10 h-6 bg-white rounded flex items-center justify-center border border-gray-200">
        <span className="text-[8px] font-bold text-[#0066CC]">QR</span>
      </div>
    </div>
  );
}

/**
 * Footer Menu Column Component
 * Renders menu items from CMS
 */
function FooterMenuColumn({ 
  menu, 
  title 
}: { 
  menu: { items: MenuItem[] } | null; 
  title: string;
}) {
  if (!menu || !menu.items || menu.items.length === 0) {
    return null;
  }

  return (
    <div>
      <h3 className="font-heading text-lg font-semibold mb-4 text-text-main">
        {title}
      </h3>
      <ul className="space-y-2 text-sm">
        {menu.items.map((item) => (
          <li key={item.id}>
            <Link 
              href={item.url} 
              target={item.target}
              className="text-text-muted hover:text-primary transition-colors"
            >
              {item.title}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Footer({ siteSettings }: FooterProps) {
  // ✅ DYNAMIC MENUS: Fetch footer menus from CMS
  const { menu: footerMenu1 } = useMenu('footer-1');
  const { menu: footerMenu2 } = useMenu('footer-2');

  // ✅ FIX: Defensive programming - Always use optional chaining and safe fallbacks
  // Extract data from siteSettings with comprehensive fallbacks
  const logo = siteSettings?.header?.logo || null;
  const description = siteSettings?.footer?.description || 
    'Shop Gấu Bông - Nơi bạn tìm thấy những chú gấu bông đáng yêu nhất.';
  const copyright = siteSettings?.footer?.copyright || 
    `© ${new Date().getFullYear()} Shop Gấu Bông. All rights reserved.`;
  const address = siteSettings?.footer?.address || null;
  const email = siteSettings?.footer?.email || null;
  const phone = siteSettings?.footer?.phone || null;
  // ✅ FIX: Safe array access with fallback to empty array
  const socialLinks = Array.isArray(siteSettings?.footer?.socialLinks) 
    ? siteSettings?.footer?.socialLinks 
    : [];

  return (
    <footer className="border-t bg-[#FFF9FA]">
      <div className="container-mobile py-8 md:py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* ✅ COLUMN 1: Branding - Logo, Description, Social Icons */}
          <div>
            {/* Logo */}
            {logo && logo.url ? (
              <div className="relative w-24 h-24 mb-4">
                <Image
                  src={logo.url}
                  alt={logo?.alt || logo?.name || 'Logo'}
                  fill
                  className="object-contain"
                  sizes="96px"
                />
              </div>
            ) : (
              <div className="w-24 h-24 bg-primary/20 text-primary rounded-full flex items-center justify-center text-4xl mb-4">
                🧸
              </div>
            )}
            
            {/* Description */}
            <p className="text-sm text-text-muted mb-4">
              {description}
            </p>
            
            {/* Social Links */}
            {/* ✅ FIX: Defensive programming - Filter out invalid links before rendering */}
            {socialLinks && socialLinks.length > 0 && (
              <div className="flex gap-3">
                {socialLinks
                  .filter((link) => link && link.platform && link.url && link.url.trim() !== '')
                  .map((link, index) => {
                    // ✅ FIX: Safe access to link properties
                    const platform = link?.platform || '';
                    const url = link?.url || '#';
                    const label = link?.label || link?.platform || 'Social link';
                    
                    const getSocialIcon = () => {
                      switch (platform) {
                        case 'facebook':
                          return <Facebook className="w-5 h-5" />;
                        case 'instagram':
                          return <Instagram className="w-5 h-5" />;
                        case 'youtube':
                          return <Youtube className="w-5 h-5" />;
                        case 'twitter':
                          return <Twitter className="w-5 h-5" />;
                        case 'tiktok':
                          return <Music2 className="w-5 h-5" />;
                        case 'zalo':
                          return <MessageCircle className="w-5 h-5" style={{ color: '#0068FF' }} />;
                        default:
                          return null;
                      }
                    };
                    
                    const icon = getSocialIcon();
                    // ✅ FIX: Only render if icon exists (valid platform)
                    if (!icon) {
                      return null;
                    }
                    
                    return (
                      <a
                        key={`${platform}-${index}`}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-text-muted hover:text-primary transition-colors"
                        aria-label={label}
                      >
                        {icon}
                      </a>
                    );
                  })}
              </div>
            )}
          </div>

          {/* ✅ COLUMN 2: Dynamic Menu from CMS (footer-1) */}
          <FooterMenuColumn 
            menu={footerMenu1} 
            title="Liên kết nhanh"
          />

          {/* ✅ COLUMN 3: Dynamic Menu from CMS (footer-2) */}
          <FooterMenuColumn 
            menu={footerMenu2} 
            title="Hỗ trợ khách hàng"
          />

          {/* ✅ COLUMN 4: Contact Info */}
          <div>
            <h3 className="font-heading text-lg font-semibold mb-4 text-text-main">
              Liên hệ
            </h3>
            <ul className="space-y-3 text-sm text-text-muted">
              {/* ✅ FIX: Safe string check before rendering */}
              {address && typeof address === 'string' && address.trim() !== '' && (
                <li className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>{address}</span>
                </li>
              )}
              {phone && typeof phone === 'string' && phone.trim() !== '' && (
                <li className="flex items-center gap-2">
                  <Phone className="w-4 h-4 flex-shrink-0" />
                  <a href={`tel:${phone.trim()}`} className="hover:text-primary transition-colors">
                    {phone}
                  </a>
                </li>
              )}
              {email && typeof email === 'string' && email.trim() !== '' && (
                <li className="flex items-center gap-2">
                  <Mail className="w-4 h-4 flex-shrink-0" />
                  <a href={`mailto:${email.trim()}`} className="hover:text-primary transition-colors">
                    {email}
                  </a>
                </li>
              )}
            </ul>
          </div>
        </div>

        {/* ✅ BOTTOM BAR: Payment Icons + Copyright */}
        <div className="mt-8 pt-8 border-t border-gray-200">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            {/* Payment Icons */}
            <PaymentIcons />
            
            {/* Copyright */}
            <p className="text-sm text-text-muted text-center md:text-right">
              {copyright}
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
