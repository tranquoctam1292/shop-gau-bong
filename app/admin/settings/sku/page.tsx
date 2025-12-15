/**
 * SKU Settings Page
 * 
 * Phase 3: Settings Page UI
 * - Global Pattern section
 * - Category Exceptions table
 * - Abbreviation Dictionary table
 */

'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { GlobalPatternSection } from './components/GlobalPatternSection';
import { CategoryExceptionsTable } from './components/CategoryExceptionsTable';
import { AbbreviationDictionaryTable } from './components/AbbreviationDictionaryTable';

export default function SkuSettingsPage() {
  return (
    <div className="space-y-8 p-6">
      <div>
        <h1 className="text-3xl font-bold">Cài đặt SKU</h1>
        <p className="text-gray-600 mt-2">
          Cấu hình quy tắc tự động sinh mã SKU cho sản phẩm
        </p>
      </div>

      {/* Global Pattern Section */}
      <GlobalPatternSection />

      {/* Category Exceptions Table */}
      <CategoryExceptionsTable />

      {/* Abbreviation Dictionary Table */}
      <AbbreviationDictionaryTable />
    </div>
  );
}

