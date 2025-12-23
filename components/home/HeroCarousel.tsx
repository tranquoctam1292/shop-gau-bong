'use client';

import { useState, useEffect } from 'react';
import { HeroSlide } from './HeroSlide';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils/cn';

// Simple SVG icons (no external dependency)
const ChevronLeftIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m15 18-6-6 6-6"/>
  </svg>
);

const ChevronRightIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m9 18 6-6-6-6"/>
  </svg>
);

interface HeroSlideData {
  image: string;
  title: string;
  subtitle?: string;
  ctaText?: string;
  ctaLink?: string;
}

interface HeroCarouselProps {
  slides: HeroSlideData[];
  autoPlayInterval?: number; // milliseconds
  showDots?: boolean;
  showArrows?: boolean;
}

/**
 * Hero Carousel Component
 * 
 * Banner carousel với auto-play, navigation dots, và arrows
 * Mobile-first với touch swipe support
 */
export function HeroCarousel({
  slides,
  autoPlayInterval = 5000,
  showDots = true,
  showArrows = true,
}: HeroCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Auto-play
  useEffect(() => {
    if (isPaused || slides.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % slides.length);
    }, autoPlayInterval);

    return () => clearInterval(interval);
  }, [isPaused, autoPlayInterval, slides.length]);

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % slides.length);
  };

  if (!slides || slides.length === 0) {
    return null;
  }

  return (
    <section
      className="relative w-full z-0"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Carousel Container */}
      <div className="relative overflow-hidden">
        <div
          className="flex transition-transform duration-500 ease-in-out"
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {slides.map((slide, index) => (
            <div key={index} className="min-w-full">
              <HeroSlide {...slide} index={index} />
            </div>
          ))}
        </div>
      </div>

      {/* Navigation Arrows */}
      {showArrows && slides.length > 1 && (
        <>
          <Button
            variant="ghost"
            size="icon"
            className={cn(
                  'absolute left-2 md:left-4 top-1/2 -translate-y-1/2 z-10',
              'bg-white/20 hover:bg-white/30 text-white',
              'min-h-[44px] min-w-[44px] rounded-full'
            )}
            onClick={goToPrevious}
            aria-label="Slide trước"
          >
            <ChevronLeftIcon />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className={cn(
                  'absolute right-2 md:right-4 top-1/2 -translate-y-1/2 z-10',
              'bg-white/20 hover:bg-white/30 text-white',
              'min-h-[44px] min-w-[44px] rounded-full'
            )}
            onClick={goToNext}
            aria-label="Slide sau"
          >
            <ChevronRightIcon />
          </Button>
        </>
      )}

      {/* Navigation Dots */}
      {showDots && slides.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex gap-2">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={cn(
                'h-2 w-2 md:h-3 md:w-3 rounded-full transition-all',
                'min-h-[8px] min-w-[8px]', // Touch-friendly
                index === currentIndex
                  ? 'bg-white w-6 md:w-8'
                  : 'bg-white/50 hover:bg-white/75'
              )}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </section>
  );
}

