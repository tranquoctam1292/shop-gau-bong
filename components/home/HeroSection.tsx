'use client';

import Link from 'next/link';
import { buttonVariants } from '@/lib/utils/button-variants';

/**
 * Hero Section Component
 * 
 * First section trên homepage, tạo ấn tượng đầu tiên
 * Mobile-first design với touch-friendly buttons
 */
export function HeroSection() {
  return (
    <section className="container-mobile py-12 md:py-20">
      <div className="text-center space-y-6">
        <h1 className="font-heading text-2xl md:text-4xl mb-4">
          🧸 Chào mừng đến với Shop Gấu Bông
        </h1>
        <p className="text-text-muted text-base md:text-lg max-w-2xl mx-auto">
          Nơi bạn tìm thấy những chú gấu bông đáng yêu nhất, chất lượng cao với giá cả hợp lý
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mt-8">
          <Link 
            href="/products" 
            className={buttonVariants({ size: 'lg' })}
          >
            Xem sản phẩm
          </Link>
          <Link 
            href="/about" 
            className={buttonVariants({ variant: 'outline', size: 'lg' })}
          >
            Giới thiệu
          </Link>
        </div>
      </div>
    </section>
  );
}

