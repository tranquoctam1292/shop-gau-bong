'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Check, Image as ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import Image from 'next/image';
import type { GlobalTerm } from '@/lib/hooks/useGlobalAttributes';

interface VisualAttributeSelectorProps {
  label: string;
  type: 'text' | 'color' | 'image' | 'button';
  options: string[]; // Option names (from product.attributes[].options)
  terms?: GlobalTerm[]; // Global terms with visual data
  selectedValue: string | null;
  onSelect: (value: string) => void;
  sizeGuideImage?: string; // Optional size guide image URL
}

/**
 * Visual Attribute Selector Component
 * 
 * Displays attributes with visual previews based on type:
 * - Color: Color swatches with hex codes
 * - Image: Image thumbnails
 * - Button/Text: Button-style selectors
 */
export function VisualAttributeSelector({
  label,
  type,
  options,
  terms = [],
  selectedValue,
  onSelect,
  sizeGuideImage,
}: VisualAttributeSelectorProps) {
  // Create a map of option name -> term for quick lookup
  const termMap = new Map<string, GlobalTerm>();
  terms.forEach((term) => {
    termMap.set(term.name, term);
  });

  // Get term for an option name
  const getTerm = (optionName: string): GlobalTerm | undefined => {
    return termMap.get(optionName);
  };

  // Render based on attribute type
  if (type === 'color') {
    return (
      <div>
        <label className="block text-sm font-medium text-text-main mb-2">
          {label}
        </label>
        <div className="flex gap-3 items-center flex-wrap">
          {options.map((optionName, idx) => {
            const term = getTerm(optionName);
            const bgColor = term?.colorHex || term?.colorHex2 || '#E5E7EB';
            const isSelected = selectedValue === optionName;
            
            // Determine if color is light (for checkmark contrast)
            const lightColors = ['#FFFFFF', '#FDFBF7', '#F5F5DC', '#E5E7EB', '#FFF9FA', '#FEF3C7'];
            const bgColorUpper = bgColor.toUpperCase();
            const isLightColor = lightColors.includes(bgColorUpper) || 
                               optionName.toLowerCase().includes('trắng') || 
                               optionName.toLowerCase().includes('kem') ||
                               optionName.toLowerCase().includes('trang');
            
            return (
              <button
                key={idx}
                onClick={() => onSelect(optionName)}
                className={cn(
                  "w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center transition-all duration-200",
                  "border-2",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
                  isSelected 
                    ? "border-pink-600 ring-2 ring-pink-500 ring-offset-2 scale-110" 
                    : isLightColor
                      ? "border-gray-400 hover:scale-105 hover:border-pink-300"
                      : "border-gray-300 hover:scale-105 hover:border-pink-300"
                )}
                style={{ backgroundColor: bgColor }}
                title={`${label}: ${optionName}`}
                aria-label={`Chọn ${label.toLowerCase()} ${optionName}`}
                aria-pressed={isSelected}
              >
                {isSelected && (
                  <Check 
                    className={cn(
                      "w-4 h-4 md:w-5 md:h-5", 
                      isLightColor ? "text-gray-900" : "text-white"
                    )} 
                    strokeWidth={3}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  if (type === 'image') {
    return (
      <div>
        <label className="block text-sm font-medium text-text-main mb-2">
          {label}
        </label>
        <div className="flex gap-3 items-center flex-wrap">
          {options.map((optionName, idx) => {
            const term = getTerm(optionName);
            const imageUrl = term?.imageUrl;
            const isSelected = selectedValue === optionName;
            
            return (
              <button
                key={idx}
                onClick={() => onSelect(optionName)}
                className={cn(
                  "relative w-16 h-16 md:w-20 md:h-20 rounded-lg overflow-hidden border-2 transition-all",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
                  isSelected
                    ? "border-pink-600 ring-2 ring-pink-500 ring-offset-2 scale-105"
                    : "border-gray-200 hover:border-pink-300 hover:scale-105"
                )}
                title={`${label}: ${optionName}`}
                aria-label={`Chọn ${label.toLowerCase()} ${optionName}`}
                aria-pressed={isSelected}
              >
                {imageUrl ? (
                  <Image
                    src={imageUrl}
                    alt={optionName}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 64px, 80px"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                    <ImageIcon className="w-6 h-6 text-gray-400" />
                  </div>
                )}
                {isSelected && (
                  <div className="absolute inset-0 bg-pink-500/20 flex items-center justify-center">
                    <Check className="w-5 h-5 text-pink-600" strokeWidth={3} />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // Default: Button/Text style (for Size, Material, etc.)
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="block text-sm font-medium text-text-main">
          {label}
        </label>
        {sizeGuideImage && (
          <button
            type="button"
            onClick={() => {
              // Open size guide in new window or modal
              window.open(sizeGuideImage, '_blank');
            }}
            className="text-xs text-pink-600 hover:text-pink-700 underline"
            aria-label="Xem hướng dẫn kích thước"
          >
            Hướng dẫn kích thước
          </button>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        {options.map((optionName, idx) => {
          const isSelected = selectedValue === optionName;
          
          return (
            <button
              key={idx}
              onClick={() => onSelect(optionName)}
              className={cn(
                "text-sm font-medium px-4 py-2 rounded-md border-2 transition-all min-h-[44px]",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
                isSelected
                  ? "border-[#D6336C] bg-pink-50 text-[#D6336C]"
                  : "border-gray-200 bg-white text-gray-500 hover:border-pink-300 hover:text-pink-500"
              )}
              aria-label={`Chọn ${label.toLowerCase()} ${optionName}`}
              aria-pressed={isSelected}
            >
              {optionName}
            </button>
          );
        })}
      </div>
    </div>
  );
}
