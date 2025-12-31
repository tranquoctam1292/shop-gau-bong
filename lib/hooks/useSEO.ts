/**
 * useSEO Hooks
 *
 * React Query hooks for SEO module
 *
 * @see docs/plans/SEO_MODULE_PLAN.md
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type {
  SEOSettings,
  SEORedirect,
  SEODashboardStats,
  ProductSEOListItem,
  ProductSEOFields,
  BulkSEOUpdateResponse,
  SEOAuditResult,
} from '@/types/seo';

// ============================================
// Query Keys
// ============================================

export const seoKeys = {
  all: ['seo'] as const,
  dashboard: () => [...seoKeys.all, 'dashboard'] as const,
  settings: () => [...seoKeys.all, 'settings'] as const,
  redirects: () => [...seoKeys.all, 'redirects'] as const,
  redirectsList: (filters: RedirectsFilters) => [...seoKeys.redirects(), 'list', filters] as const,
  redirect: (id: string) => [...seoKeys.redirects(), id] as const,
  products: () => [...seoKeys.all, 'products'] as const,
  productsList: (filters: ProductsSEOFilters) => [...seoKeys.products(), 'list', filters] as const,
  productAudit: (id: string) => [...seoKeys.products(), 'audit', id] as const,
};

// ============================================
// Types
// ============================================

interface RedirectsFilters {
  page?: number;
  perPage?: number;
  enabled?: boolean;
  search?: string;
}

interface RedirectsResponse {
  redirects: SEORedirect[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
}

interface ProductsSEOFilters {
  page?: number;
  perPage?: number;
  search?: string;
  scoreMin?: number;
  scoreMax?: number;
  hasIssues?: boolean;
  sortBy?: 'score' | 'name' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
}

interface ProductsSEOResponse {
  products: ProductSEOListItem[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
}

// ============================================
// API Functions
// ============================================

async function fetchDashboardStats(): Promise<SEODashboardStats> {
  const response = await fetch('/api/admin/seo', {
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Lỗi khi lấy thống kê SEO');
  }

  return response.json();
}

async function fetchSettings(): Promise<SEOSettings | null> {
  const response = await fetch('/api/admin/seo/settings', {
    credentials: 'include',
  });

  if (!response.ok) {
    if (response.status === 404) return null;
    const error = await response.json();
    throw new Error(error.error || 'Lỗi khi lấy cài đặt SEO');
  }

  const data = await response.json();
  return data.settings;
}

async function updateSettings(settings: Partial<SEOSettings>): Promise<SEOSettings> {
  const response = await fetch('/api/admin/seo/settings', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(settings),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Lỗi khi cập nhật cài đặt SEO');
  }

  const data = await response.json();
  return data.settings;
}

async function fetchRedirects(filters: RedirectsFilters): Promise<RedirectsResponse> {
  const params = new URLSearchParams();

  if (filters.page) params.set('page', String(filters.page));
  if (filters.perPage) params.set('per_page', String(filters.perPage));
  if (typeof filters.enabled === 'boolean') params.set('enabled', String(filters.enabled));
  if (filters.search) params.set('search', filters.search);

  const response = await fetch(`/api/admin/seo/redirects?${params.toString()}`, {
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Lỗi khi lấy danh sách redirects');
  }

  return response.json();
}

async function createRedirect(data: {
  source: string;
  destination: string;
  type?: 301 | 302;
  enabled?: boolean;
  note?: string;
}): Promise<SEORedirect> {
  const response = await fetch('/api/admin/seo/redirects', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Lỗi khi tạo redirect');
  }

  const result = await response.json();
  return result.redirect;
}

async function updateRedirect(
  id: string,
  data: Partial<SEORedirect>
): Promise<SEORedirect> {
  const response = await fetch(`/api/admin/seo/redirects/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Lỗi khi cập nhật redirect');
  }

  const result = await response.json();
  return result.redirect;
}

async function deleteRedirect(id: string): Promise<void> {
  const response = await fetch(`/api/admin/seo/redirects/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Lỗi khi xóa redirect');
  }
}

async function fetchProductsSEO(filters: ProductsSEOFilters): Promise<ProductsSEOResponse> {
  const params = new URLSearchParams();

  if (filters.page) params.set('page', String(filters.page));
  if (filters.perPage) params.set('per_page', String(filters.perPage));
  if (filters.search) params.set('search', filters.search);
  if (typeof filters.scoreMin === 'number') params.set('score_min', String(filters.scoreMin));
  if (typeof filters.scoreMax === 'number') params.set('score_max', String(filters.scoreMax));
  if (typeof filters.hasIssues === 'boolean') params.set('has_issues', String(filters.hasIssues));
  if (filters.sortBy) params.set('sort_by', filters.sortBy);
  if (filters.sortOrder) params.set('sort_order', filters.sortOrder);

  const response = await fetch(`/api/admin/seo/products?${params.toString()}`, {
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Lỗi khi lấy danh sách SEO sản phẩm');
  }

  return response.json();
}

async function fetchProductSEO(productId: string): Promise<ProductSEOListItem | null> {
  const response = await fetch(`/api/admin/seo/products/${productId}`, {
    credentials: 'include',
  });

  if (!response.ok) {
    if (response.status === 404) return null;
    const error = await response.json();
    throw new Error(error.error || 'Lỗi khi lấy thông tin SEO sản phẩm');
  }

  const data = await response.json();
  return data.product;
}

async function updateProductSEO(params: {
  productId: string;
  seo: Partial<ProductSEOFields>;
}): Promise<ProductSEOListItem> {
  const response = await fetch(`/api/admin/seo/products/${params.productId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(params.seo),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Lỗi khi cập nhật SEO sản phẩm');
  }

  const data = await response.json();
  return data.product;
}

async function bulkUpdateProductsSEO(
  updates: Array<{ productId: string; seo: Partial<ProductSEOFields> }>
): Promise<BulkSEOUpdateResponse> {
  const response = await fetch('/api/admin/seo/products/bulk', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ updates }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Lỗi khi cập nhật SEO hàng loạt');
  }

  return response.json();
}

async function runProductAudit(productId: string): Promise<SEOAuditResult> {
  const response = await fetch('/api/admin/seo/audit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ productId }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Lỗi khi chạy SEO audit');
  }

  const result = await response.json();
  return result.audit;
}

async function runFullAudit(): Promise<{ processed: number; averageScore: number }> {
  const response = await fetch('/api/admin/seo/audit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ all: true }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Lỗi khi chạy SEO audit toàn bộ');
  }

  return response.json();
}

// ============================================
// Dashboard Hooks
// ============================================

/**
 * Hook để lấy thống kê SEO Dashboard
 */
export function useSEODashboard() {
  return useQuery({
    queryKey: seoKeys.dashboard(),
    queryFn: fetchDashboardStats,
    staleTime: 60 * 1000, // 1 minute
  });
}

// ============================================
// Settings Hooks
// ============================================

/**
 * Hook để lấy cài đặt SEO toàn cục
 */
export function useSEOSettings() {
  return useQuery({
    queryKey: seoKeys.settings(),
    queryFn: fetchSettings,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook để cập nhật cài đặt SEO toàn cục
 */
export function useUpdateSEOSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateSettings,
    onSuccess: (data) => {
      queryClient.setQueryData(seoKeys.settings(), data);
    },
  });
}

// ============================================
// Redirects Hooks
// ============================================

/**
 * Hook để lấy danh sách redirects
 */
export function useSEORedirects(filters: RedirectsFilters = {}) {
  return useQuery({
    queryKey: seoKeys.redirectsList(filters),
    queryFn: () => fetchRedirects(filters),
    staleTime: 30 * 1000, // 30 seconds
  });
}

/**
 * Hook để tạo redirect mới
 */
export function useCreateRedirect() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createRedirect,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: seoKeys.redirects() });
    },
  });
}

/**
 * Hook để cập nhật redirect
 */
export function useUpdateRedirect() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<SEORedirect> }) =>
      updateRedirect(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: seoKeys.redirects() });
    },
  });
}

/**
 * Hook để xóa redirect
 */
export function useDeleteRedirect() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteRedirect,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: seoKeys.redirects() });
    },
  });
}

// ============================================
// Products SEO Hooks
// ============================================

/**
 * Hook để lấy danh sách SEO sản phẩm
 */
export function useProductsSEO(filters: ProductsSEOFilters = {}) {
  return useQuery({
    queryKey: seoKeys.productsList(filters),
    queryFn: () => fetchProductsSEO(filters),
    staleTime: 30 * 1000, // 30 seconds
  });
}

/**
 * Hook để cập nhật SEO hàng loạt
 */
export function useBulkUpdateSEO() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: bulkUpdateProductsSEO,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: seoKeys.products() });
      queryClient.invalidateQueries({ queryKey: seoKeys.dashboard() });
    },
  });
}

/**
 * Hook để lấy thông tin SEO của một sản phẩm
 */
export function useProductSEO(productId: string) {
  return useQuery({
    queryKey: [...seoKeys.products(), 'single', productId],
    queryFn: () => fetchProductSEO(productId),
    enabled: !!productId,
    staleTime: 30 * 1000, // 30 seconds
  });
}

/**
 * Hook để cập nhật SEO của một sản phẩm
 */
export function useUpdateProductSEO() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateProductSEO,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: seoKeys.products() });
      queryClient.invalidateQueries({ queryKey: [...seoKeys.products(), 'single', variables.productId] });
      queryClient.invalidateQueries({ queryKey: seoKeys.dashboard() });
    },
  });
}

// ============================================
// Audit Hooks
// ============================================

/**
 * Hook để chạy SEO audit cho một sản phẩm
 */
export function useProductSEOAudit(productId: string) {
  return useQuery({
    queryKey: seoKeys.productAudit(productId),
    queryFn: () => runProductAudit(productId),
    enabled: !!productId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook để chạy SEO audit cho một sản phẩm (mutation)
 */
export function useRunProductAudit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: runProductAudit,
    onSuccess: (_, productId) => {
      queryClient.invalidateQueries({ queryKey: seoKeys.productAudit(productId) });
      queryClient.invalidateQueries({ queryKey: seoKeys.products() });
      queryClient.invalidateQueries({ queryKey: seoKeys.dashboard() });
    },
  });
}

/**
 * Hook để chạy SEO audit toàn bộ
 */
export function useRunFullAudit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: runFullAudit,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: seoKeys.products() });
      queryClient.invalidateQueries({ queryKey: seoKeys.dashboard() });
    },
  });
}
