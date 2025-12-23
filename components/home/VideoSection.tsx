'use client';

import { useState } from 'react';
import Image from 'next/image';
import { buttonVariants } from '@/lib/utils/button-variants';
import Link from 'next/link';
import { cn } from '@/lib/utils/cn';

interface VideoSectionProps {
  videoId?: string; // YouTube video ID
  title?: string;
  description?: string;
  thumbnail?: string;
  youtubeChannelUrl?: string;
}

/**
 * Video Section Component
 * 
 * YouTube video embed với thumbnail và play button
 * Storytelling section để build brand connection
 * 
 * Usage:
 * <VideoSection
 *   videoId="dQw4w9WgXcQ"
 *   title="VIDEO TẠI SHOP GẤU BÔNG"
 *   description="Nơi khám phá những câu chuyện về tất cả sản phẩm của nhà Shop Gấu Bông."
 *   youtubeChannelUrl="https://youtube.com/@shopgaubong"
 * />
 */
export function VideoSection({
  videoId,
  title = 'VIDEO TẠI SHOP GẤU BÔNG',
  description = 'Khám phá những câu chuyện và sản phẩm tại Shop Gấu Bông.',
  thumbnail,
  youtubeChannelUrl,
}: VideoSectionProps) {
  const [isPlaying, setIsPlaying] = useState(false);

  // Default video ID nếu không có (placeholder)
  const defaultVideoId = videoId || 'dQw4w9WgXcQ'; // Replace với video ID thật

  // YouTube thumbnail URL
  const thumbnailUrl = thumbnail || `https://img.youtube.com/vi/${defaultVideoId}/maxresdefault.jpg`;

  const handlePlay = () => {
    setIsPlaying(true);
  };

  if (!videoId && !defaultVideoId) {
    return null; // Không hiển thị nếu không có video
  }

  return (
    <section className="container-mobile py-8 md:py-16">
      <div className="text-center mb-8 md:mb-12">
        <h2 className="font-heading text-2xl md:text-3xl font-bold mb-4">
          {title}
        </h2>
        {description && (
          <p className="text-text-muted text-base md:text-lg max-w-2xl mx-auto">
            {description}
          </p>
        )}
      </div>

      {/* Video Container */}
      <div className="relative aspect-video w-full max-w-4xl mx-auto rounded-2xl overflow-hidden bg-muted">
        {isPlaying ? (
          // YouTube iframe embed
          <iframe
            src={`https://www.youtube.com/embed/${defaultVideoId}?autoplay=1&rel=0`}
            title={title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="w-full h-full"
          />
        ) : (
          // Thumbnail với play button
          <button
            onClick={handlePlay}
            className={cn(
              'relative w-full h-full group cursor-pointer',
              'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2'
            )}
            aria-label="Phát video"
          >
            <Image
              src={thumbnailUrl}
              alt={title}
              fill
              className="object-cover"
              sizes="100vw"
            />
            {/* Play Button Overlay */}
            <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/40 transition-colors">
              <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-white/90 group-hover:bg-white flex items-center justify-center transition-transform group-hover:scale-110">
                <svg
                  className="w-8 h-8 md:w-10 md:h-10 text-primary ml-1"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
            </div>
          </button>
        )}
      </div>

      {/* YouTube Channel Link */}
      {youtubeChannelUrl && (
        <div className="text-center mt-6">
          <Link
            href={youtubeChannelUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonVariants({ variant: 'outline', size: 'sm' })}
          >
            Xem thêm trên YouTube →
          </Link>
        </div>
      )}
    </section>
  );
}

