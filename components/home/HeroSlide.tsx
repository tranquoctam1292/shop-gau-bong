'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { buttonVariants } from '@/lib/utils/button-variants';
import { cn } from '@/lib/utils/cn';

interface HeroSlideProps {
  image: string;
  title: string;
  subtitle?: string;
  ctaText?: string;
  ctaLink?: string;
  overlay?: boolean;
  className?: string;
  index?: number; // For priority loading
}

/**
 * Hero Slide Component
 * 
 * Individual slide cho Hero Carousel
 * Mobile-first design với responsive images
 */
export function HeroSlide({
  image,
  title,
  subtitle,
  ctaText = 'Mua ngay',
  ctaLink = '/products',
  overlay = true,
  className,
  index = 0,
}: HeroSlideProps) {
  // Track image load errors to prevent infinite loop
  const [imageError, setImageError] = useState(false);
  
  // Only use image if it exists and hasn't errored
  const imageSrc = image && !imageError ? image : null;
  
  return (
    <div className={cn('relative w-full h-[60vh] md:h-[80vh] overflow-hidden z-0', className)}>
      {/* Background Image - Optimized for mobile/desktop */}
      {imageSrc ? (
        <Image
          src={imageSrc}
          alt={title}
          fill
          className="object-cover"
          priority={index === 0}
          quality={85}
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 100vw, 1920px"
          placeholder="blur"
          blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=="
          onError={() => {
            // Prevent infinite loop: only set error once
            setImageError(true);
          }}
        />
      ) : (
        // Fallback gradient background when image is missing or errored
        <div className="absolute inset-0 bg-gradient-to-br from-pink-200 via-purple-200 to-blue-200" />
      )}

      {/* Overlay Gradient */}
      {overlay && (
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/40 to-transparent" />
      )}

      {/* Content */}
      <div className="relative z-10 h-full flex items-center">
        <div className="container-mobile px-4 md:px-8">
          <div className="max-w-2xl space-y-4 md:space-y-6">
            <h2 className="font-heading text-2xl md:text-4xl lg:text-5xl font-bold text-white drop-shadow-lg">
              {title}
            </h2>
            {subtitle && (
              <p className="text-base md:text-lg lg:text-xl text-white/90 drop-shadow-md">
                {subtitle}
              </p>
            )}
            {ctaLink && (
              <div className="pt-2">
                <Link
                  href={ctaLink}
                  className={buttonVariants({ size: 'lg', className: 'min-h-[48px] px-6 md:px-8' })}
                >
                  {ctaText}
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

