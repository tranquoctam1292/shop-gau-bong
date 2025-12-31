'use client';

import { useMemo } from 'react';
import { cn } from '@/lib/utils';

interface ScoreDistribution {
  excellent: number;
  good: number;
  needsWork: number;
  poor: number;
  notAudited: number;
}

interface SEOScoreDistributionProps {
  distribution: ScoreDistribution;
  className?: string;
  showLegend?: boolean;
}

const categories = [
  { key: 'excellent', label: 'Xuất sắc (80-100)', color: 'bg-green-500', textColor: 'text-green-600' },
  { key: 'good', label: 'Tốt (60-79)', color: 'bg-blue-500', textColor: 'text-blue-600' },
  { key: 'needsWork', label: 'Cần cải thiện (40-59)', color: 'bg-yellow-500', textColor: 'text-yellow-600' },
  { key: 'poor', label: 'Kém (0-39)', color: 'bg-red-500', textColor: 'text-red-600' },
  { key: 'notAudited', label: 'Chưa kiểm tra', color: 'bg-gray-300', textColor: 'text-gray-500' },
] as const;

export function SEOScoreDistribution({
  distribution,
  className,
  showLegend = true,
}: SEOScoreDistributionProps) {
  const total = useMemo(() => {
    return Object.values(distribution).reduce((sum, val) => sum + val, 0);
  }, [distribution]);

  const percentages = useMemo(() => {
    if (total === 0) return {};
    return Object.fromEntries(
      Object.entries(distribution).map(([key, value]) => [
        key,
        Math.round((value / total) * 100),
      ])
    );
  }, [distribution, total]);

  if (total === 0) {
    return (
      <div className={cn('text-center py-8 text-gray-500', className)}>
        <p>Chưa có dữ liệu SEO</p>
        <p className="text-sm">Chạy kiểm tra SEO để xem phân bố điểm</p>
      </div>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Progress bar */}
      <div className="h-4 rounded-full overflow-hidden flex bg-gray-200">
        {categories.map(({ key, color }) => {
          const value = distribution[key as keyof ScoreDistribution];
          if (value === 0) return null;
          const width = (value / total) * 100;
          return (
            <div
              key={key}
              className={cn('transition-all duration-300', color)}
              style={{ width: `${width}%` }}
              title={`${categories.find(c => c.key === key)?.label}: ${value} sản phẩm (${Math.round(width)}%)`}
            />
          );
        })}
      </div>

      {/* Legend */}
      {showLegend && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
          {categories.map(({ key, label, color, textColor }) => {
            const value = distribution[key as keyof ScoreDistribution];
            const percent = percentages[key] || 0;
            return (
              <div key={key} className="flex items-center gap-2">
                <div className={cn('w-3 h-3 rounded-full', color)} />
                <div className="flex-1 min-w-0">
                  <p className={cn('text-sm font-medium truncate', textColor)}>
                    {value}
                  </p>
                  <p className="text-xs text-gray-500 truncate" title={label}>
                    {label} ({percent}%)
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Compact donut chart variant
interface SEOScoreDonutProps {
  distribution: ScoreDistribution;
  size?: number;
  className?: string;
}

export function SEOScoreDonut({
  distribution,
  size = 120,
  className,
}: SEOScoreDonutProps) {
  const total = useMemo(() => {
    return Object.values(distribution).reduce((sum, val) => sum + val, 0);
  }, [distribution]);

  const segments = useMemo(() => {
    if (total === 0) return [];

    let currentAngle = 0;
    return categories
      .map(({ key, color }) => {
        const value = distribution[key as keyof ScoreDistribution];
        if (value === 0) return null;
        const angle = (value / total) * 360;
        const segment = {
          key,
          color,
          startAngle: currentAngle,
          endAngle: currentAngle + angle,
        };
        currentAngle += angle;
        return segment;
      })
      .filter(Boolean);
  }, [distribution, total]);

  const radius = size / 2;
  const strokeWidth = size / 5;
  const normalizedRadius = radius - strokeWidth / 2;
  const circumference = normalizedRadius * 2 * Math.PI;

  if (total === 0) {
    return (
      <div
        className={cn('flex items-center justify-center', className)}
        style={{ width: size, height: size }}
      >
        <div className="text-gray-400 text-center text-xs">Chưa có dữ liệu</div>
      </div>
    );
  }

  // Calculate average score for center display
  const auditedProducts = total - distribution.notAudited;
  const avgScore = auditedProducts > 0
    ? Math.round(
        (distribution.excellent * 90 +
          distribution.good * 70 +
          distribution.needsWork * 50 +
          distribution.poor * 20) /
          auditedProducts
      )
    : 0;

  return (
    <div
      className={cn('relative flex items-center justify-center', className)}
      style={{ width: size, height: size }}
    >
      <svg
        height={size}
        width={size}
        viewBox={`0 0 ${size} ${size}`}
        className="transform -rotate-90"
      >
        {segments.map((segment) => {
          if (!segment) return null;
          const startPercent = segment.startAngle / 360;
          const endPercent = segment.endAngle / 360;
          const dashArray = circumference * (endPercent - startPercent);
          const dashOffset = -circumference * startPercent;

          // Map Tailwind color to hex
          const colorMap: Record<string, string> = {
            'bg-green-500': '#22c55e',
            'bg-blue-500': '#3b82f6',
            'bg-yellow-500': '#eab308',
            'bg-red-500': '#ef4444',
            'bg-gray-300': '#d1d5db',
          };

          return (
            <circle
              key={segment.key}
              stroke={colorMap[segment.color] || '#d1d5db'}
              fill="transparent"
              strokeWidth={strokeWidth}
              strokeDasharray={`${dashArray} ${circumference}`}
              strokeDashoffset={dashOffset}
              r={normalizedRadius}
              cx={radius}
              cy={radius}
            />
          );
        })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold">{avgScore}</span>
        <span className="text-xs text-gray-500">Trung bình</span>
      </div>
    </div>
  );
}

export default SEOScoreDistribution;
