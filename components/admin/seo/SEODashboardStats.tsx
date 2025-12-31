'use client';

import { useSEODashboard } from '@/lib/hooks/useSEO';
import { SEOScoreDistribution, SEOScoreDonut } from './SEOScoreDistribution';
import { Loader2, TrendingUp, AlertTriangle, CheckCircle, FileWarning } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface SEODashboardStatsProps {
  className?: string;
}

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: typeof TrendingUp;
  color: 'green' | 'blue' | 'yellow' | 'red' | 'gray';
  href?: string;
}

const colorClasses = {
  green: {
    bg: 'bg-green-50',
    icon: 'text-green-600',
    border: 'border-green-200',
  },
  blue: {
    bg: 'bg-blue-50',
    icon: 'text-blue-600',
    border: 'border-blue-200',
  },
  yellow: {
    bg: 'bg-yellow-50',
    icon: 'text-yellow-600',
    border: 'border-yellow-200',
  },
  red: {
    bg: 'bg-red-50',
    icon: 'text-red-600',
    border: 'border-red-200',
  },
  gray: {
    bg: 'bg-gray-50',
    icon: 'text-gray-600',
    border: 'border-gray-200',
  },
};

function StatCard({ title, value, subtitle, icon: Icon, color, href }: StatCardProps) {
  const colors = colorClasses[color];

  const content = (
    <div
      className={cn(
        'p-4 rounded-lg border transition-all',
        colors.bg,
        colors.border,
        href && 'hover:shadow-md cursor-pointer'
      )}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-600">{title}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
          {subtitle && (
            <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
          )}
        </div>
        <div className={cn('p-2 rounded-full', colors.bg)}>
          <Icon className={cn('h-5 w-5', colors.icon)} />
        </div>
      </div>
    </div>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }

  return content;
}

export function SEODashboardStats({ className }: SEODashboardStatsProps) {
  const { data, isLoading, error } = useSEODashboard();

  if (isLoading) {
    return (
      <div className={cn('flex items-center justify-center py-12', className)}>
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        <span className="ml-2 text-gray-500">Đang tải thống kê SEO...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn('text-center py-12 text-red-500', className)}>
        <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
        <p>Lỗi khi tải thống kê SEO</p>
        <p className="text-sm text-gray-500 mt-1">
          {error instanceof Error ? error.message : 'Vui lòng thử lại sau'}
        </p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className={cn('text-center py-12 text-gray-500', className)}>
        <p>Không có dữ liệu SEO</p>
      </div>
    );
  }

  const { totalProducts, averageScore, scoreDistribution, commonIssues } = data;

  // Calculate percentages
  const auditedCount = totalProducts - (scoreDistribution?.notAudited || 0);
  const auditedPercent = totalProducts > 0
    ? Math.round((auditedCount / totalProducts) * 100)
    : 0;
  const excellentPercent = auditedCount > 0
    ? Math.round(((scoreDistribution?.excellent || 0) / auditedCount) * 100)
    : 0;

  return (
    <div className={cn('space-y-6', className)}>
      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Tổng sản phẩm"
          value={totalProducts}
          subtitle={`${auditedCount} đã kiểm tra (${auditedPercent}%)`}
          icon={FileWarning}
          color="gray"
          href="/admin/seo/products"
        />
        <StatCard
          title="Điểm trung bình"
          value={averageScore || 0}
          subtitle="Thang điểm 0-100"
          icon={TrendingUp}
          color={averageScore >= 80 ? 'green' : averageScore >= 60 ? 'blue' : averageScore >= 40 ? 'yellow' : 'red'}
        />
        <StatCard
          title="SEO xuất sắc"
          value={`${excellentPercent}%`}
          subtitle={`${scoreDistribution?.excellent || 0} sản phẩm (80-100 điểm)`}
          icon={CheckCircle}
          color="green"
          href="/admin/seo/products?score_min=80"
        />
        <StatCard
          title="Cần cải thiện"
          value={(scoreDistribution?.needsWork || 0) + (scoreDistribution?.poor || 0)}
          subtitle="Dưới 60 điểm"
          icon={AlertTriangle}
          color="yellow"
          href="/admin/seo/products?score_max=59"
        />
      </div>

      {/* Score Distribution */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border p-6">
          <h3 className="font-semibold mb-4">Phân bố điểm SEO</h3>
          {scoreDistribution && (
            <SEOScoreDistribution distribution={scoreDistribution} />
          )}
        </div>

        <div className="bg-white rounded-lg border p-6">
          <h3 className="font-semibold mb-4">Vấn đề phổ biến</h3>
          {commonIssues && commonIssues.length > 0 ? (
            <div className="space-y-3">
              {commonIssues.slice(0, 5).map((issue) => (
                <div key={issue.issue} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">
                    {issue.issue.replace(/_/g, ' ')}
                  </span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-yellow-500"
                        style={{
                          width: `${Math.min(100, (issue.count / auditedCount) * 100)}%`,
                        }}
                      />
                    </div>
                    <span className="text-sm font-medium w-12 text-right">
                      {issue.count}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
              <p>Không có vấn đề SEO phổ biến</p>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-3">
        <Link
          href="/admin/seo/products"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Xem tất cả sản phẩm
        </Link>
        <Link
          href="/admin/seo/products?has_issues=true"
          className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
        >
          Xem sản phẩm cần cải thiện
        </Link>
        <Link
          href="/admin/seo/settings"
          className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Cài đặt SEO
        </Link>
      </div>
    </div>
  );
}

// Compact widget variant for main dashboard
export function SEODashboardWidget({ className }: { className?: string }) {
  const { data, isLoading } = useSEODashboard();

  if (isLoading) {
    return (
      <div className={cn('flex items-center justify-center py-8', className)}>
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!data) return null;

  const { averageScore, scoreDistribution } = data;

  return (
    <div className={cn('flex items-center gap-4', className)}>
      {scoreDistribution && (
        <SEOScoreDonut distribution={scoreDistribution} size={80} />
      )}
      <div>
        <p className="text-sm text-gray-600">Điểm SEO trung bình</p>
        <p className="text-2xl font-bold">{averageScore || 0}</p>
        <Link
          href="/admin/seo"
          className="text-sm text-blue-600 hover:underline"
        >
          Xem chi tiết →
        </Link>
      </div>
    </div>
  );
}

export default SEODashboardStats;
