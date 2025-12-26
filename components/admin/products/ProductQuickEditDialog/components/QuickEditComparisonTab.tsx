'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download } from 'lucide-react';
import type { QuickEditFormData } from '../types';
import { useQuickEditFormContext } from '../hooks/useQuickEditFormContext';
import { formatValueForDisplay, formatPriceValue, getComparisonFields, hasFieldChanged } from '../utils/formHelpers';

export interface QuickEditComparisonTabProps {
  snapshotInitialData: QuickEditFormData | null;
  productId?: string;
  productName?: string;
  onExport?: (comparison: unknown) => void;
}

export const QuickEditComparisonTab = React.memo<QuickEditComparisonTabProps>(({
  snapshotInitialData,
  productId,
  productName,
  onExport,
}) => {
  const { getValues } = useQuickEditFormContext();

  // Helper to normalize values for comparison
  const normalizeValue = (value: unknown): unknown => {
    if (value === null || value === undefined) return undefined;
    if (typeof value === 'string' && value.trim() === '') return '';
    if (typeof value === 'number' && isNaN(value)) return undefined;
    return value;
  };

  if (!snapshotInitialData) {
    return (
      <div className="text-center py-8 text-slate-500">
        Không có dữ liệu để so sánh
      </div>
    );
  }

  const currentData = getValues();
  const oldData = snapshotInitialData;

  // PHASE 5.1: Use formHelpers for formatting and comparison
  const fieldsToCompare = getComparisonFields();

  const changedFields = fieldsToCompare.filter(f => 
    hasFieldChanged(f.key, oldData as Record<string, unknown>, currentData as Record<string, unknown>, normalizeValue)
  );

  const handleExport = () => {
    const comparison = {
      productId,
      productName,
      timestamp: new Date().toISOString(),
      changes: changedFields.map(f => ({
        field: f.label,
        oldValue: f.format ? f.format((oldData as Record<string, unknown>)[f.key]) : formatValueForDisplay((oldData as Record<string, unknown>)[f.key]),
        newValue: f.format ? f.format((currentData as Record<string, unknown>)[f.key]) : formatValueForDisplay((currentData as Record<string, unknown>)[f.key]),
      })),
    };
    
    if (onExport) {
      onExport(comparison);
    } else {
      // Default export behavior
      const blob = new Blob([JSON.stringify(comparison, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `comparison-${productId || 'product'}-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div className="space-y-4">
      {changedFields.length === 0 ? (
        <div className="text-center py-8 text-slate-500">
          Không có thay đổi nào
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-sm">
                {changedFields.length} thay đổi
              </Badge>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleExport}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Xuất báo cáo
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Old Values Column */}
            <div className="space-y-4">
              <div className="sticky top-0 bg-slate-50 border-b border-slate-200 p-3 rounded-t-md">
                <h3 className="font-semibold text-slate-900">Giá trị cũ</h3>
              </div>
              <div className="space-y-3">
                {changedFields.map((field) => {
                  const oldVal = (oldData as Record<string, unknown>)[field.key];
                              const formatted = field.format ? field.format(oldVal) : formatValueForDisplay(oldVal);
                  return (
                    <div key={field.key} className="p-3 bg-slate-50 border border-slate-200 rounded-md">
                      <div className="text-xs font-medium text-slate-600 mb-1">{field.label}</div>
                      <div className="text-sm text-slate-900 break-words">{formatted}</div>
                    </div>
                  );
                })}
              </div>
            </div>
            {/* New Values Column */}
            <div className="space-y-4">
              <div className="sticky top-0 bg-green-50 border-b border-green-200 p-3 rounded-t-md">
                <h3 className="font-semibold text-green-900">Giá trị mới</h3>
              </div>
              <div className="space-y-3">
                {changedFields.map((field) => {
                  const newVal = (currentData as Record<string, unknown>)[field.key];
                              const formatted = field.format ? field.format(newVal) : formatValueForDisplay(newVal);
                  return (
                    <div key={field.key} className="p-3 bg-green-50 border border-green-200 rounded-md">
                      <div className="text-xs font-medium text-green-700 mb-1">{field.label}</div>
                      <div className="text-sm text-green-900 break-words">{formatted}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
});

QuickEditComparisonTab.displayName = 'QuickEditComparisonTab';

