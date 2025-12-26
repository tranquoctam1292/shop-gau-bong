/**
 * Form Content Component
 * 
 * PHASE 6: Extract Form Content
 * 
 * Contains the entire form structure with all sections
 */

'use client';

import React from 'react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Package, DollarSign, Ruler, Tag, ImageIcon, ArrowUp } from 'lucide-react';
import { ProductQuickEditSkeleton } from '../../ProductQuickEditSkeleton';
import { LoadingProgressIndicator } from '../../LoadingProgressIndicator';
import { QuickEditSkipLinks } from './QuickEditSkipLinks';
import { BasicInfoSection } from '../sections/BasicInfoSection';
import { PricingSection } from '../sections/PricingSection';
import { InventorySection } from '../sections/InventorySection';
import { ProductTypeSection } from '../sections/ProductTypeSection';
import { ShippingSection } from '../sections/ShippingSection';
import { DimensionsSection } from '../sections/DimensionsSection';
import { CategoriesSection } from '../sections/CategoriesSection';
import { ImagesSection } from '../sections/ImagesSection';
import { SeoSection } from '../sections/SeoSection';
import { VariantsSection } from '../sections/VariantsSection';
import { ProductOptionsSection } from '../sections/ProductOptionsSection';
import { QuickEditFormProvider } from '../context/QuickEditFormProvider';
import type { UseFormReturn } from 'react-hook-form';
import type { QuickEditFormData } from '../types';
import type { MappedProduct, MappedCategory } from '@/lib/utils/productMapper';
import type { LoadingStep } from '../../LoadingProgressIndicator';
import type { ProductWithVariants } from '@/lib/hooks/useProduct';

export interface QuickEditFormContentProps {
  // Form methods
  register: UseFormReturn<QuickEditFormData>['register'];
  setValue: UseFormReturn<QuickEditFormData>['setValue'];
  watch: UseFormReturn<QuickEditFormData>['watch'];
  getValues: UseFormReturn<QuickEditFormData>['getValues'];
  reset: UseFormReturn<QuickEditFormData>['reset'];
  errors: UseFormReturn<QuickEditFormData>['formState']['errors'];
  formState: UseFormReturn<QuickEditFormData>['formState'];
  handleSubmit: UseFormReturn<QuickEditFormData>['handleSubmit'];
  
  // Handlers
  handleFieldFocus: (fieldId: string, e?: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  handleFieldBlur: (_e?: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  onSubmit: (data: QuickEditFormData) => void;
  onError: (errors: unknown) => void;
  
  // Validation
  getFieldClassName: (fieldName: string, currentValue: unknown, hasError: boolean, isSaved: boolean, fieldId?: string, isValid?: boolean) => string;
  getErrorCountForSection: (sectionId: string) => number;
  scrollToErrorField: (fieldName: string) => void;
  allValidationErrors: Array<{ field: string; message: string; label: string }>;
  
  // State
  savedFields: Set<string>;
  flashingFields: Set<string>;
  fieldOriginalValues: Record<string, unknown>;
  expandedSections: string[];
  setExpandedSections: React.Dispatch<React.SetStateAction<string[]>>;
  
  // Data
  skuValidation: { isValid: boolean | null; isValidating: boolean; error: string | null };
  allCategories: MappedProduct['categories'] | undefined;
  isLoadingCategories: boolean;
  variants: QuickEditFormData['variants'];
  
  // Flags
  isBulkMode: boolean;
  isMobile: boolean;
  loadingProduct: boolean;
  loadingStep: LoadingStep;
  showSuccessIndicator: boolean;
  isDirty: boolean;
  lastSavedTime: Date | null;
  
  // Product data
  product: MappedProduct | null | undefined;
  productWithVariants: ProductWithVariants | null | undefined;
  loadedSections: Set<string>;
  
  // Media library
  mediaLibraryOpen: boolean;
  setMediaLibraryOpen: (open: boolean) => void;
  mediaLibraryMode: 'featured' | 'gallery';
  setMediaLibraryMode: (mode: 'featured' | 'gallery') => void;
  
  // Status change warning
  showStatusChangeWarning: boolean;
  setShowStatusChangeWarning: (show: boolean) => void;
  pendingStatus: 'draft' | 'publish' | 'trash' | null;
  setPendingStatus: (status: 'draft' | 'publish' | 'trash' | null) => void;
  previousStatus: 'draft' | 'publish' | 'trash' | null;
  setPreviousStatus: (status: 'draft' | 'publish' | 'trash' | null) => void;
  
  // Product type warning
  showProductTypeWarning: boolean;
  setShowProductTypeWarning: (show: boolean) => void;
  pendingProductType: 'simple' | 'variable' | 'grouped' | 'external' | null;
  setPendingProductType: (type: 'simple' | 'variable' | 'grouped' | 'external' | null) => void;
  
}

export const QuickEditFormContent = React.memo<QuickEditFormContentProps>(({
  register,
  setValue,
  watch,
  getValues,
  reset,
  errors,
  formState: formStateFull,
  handleSubmit,
  handleFieldFocus,
  handleFieldBlur,
  onSubmit,
  onError,
  getFieldClassName,
  getErrorCountForSection,
  scrollToErrorField,
  allValidationErrors,
  savedFields,
  flashingFields,
  fieldOriginalValues,
  expandedSections,
  setExpandedSections,
  skuValidation,
  allCategories,
  isLoadingCategories,
  variants,
  isBulkMode,
  isMobile,
  loadingProduct,
  loadingStep,
  showSuccessIndicator,
  isDirty,
  lastSavedTime,
  product,
  productWithVariants,
  loadedSections,
  mediaLibraryOpen,
  setMediaLibraryOpen,
  mediaLibraryMode,
  setMediaLibraryMode,
  showStatusChangeWarning,
  setShowStatusChangeWarning,
  pendingStatus,
  setPendingStatus,
  previousStatus,
  setPreviousStatus,
  showProductTypeWarning,
  setShowProductTypeWarning,
  pendingProductType,
  setPendingProductType,
}) => {
  return (
    <QuickEditFormProvider
      register={register}
      setValue={setValue}
      watch={watch}
      getValues={getValues}
      reset={reset}
      errors={errors}
      formState={formStateFull}
      handleFieldFocus={handleFieldFocus}
      handleFieldBlur={handleFieldBlur}
      getFieldClassName={getFieldClassName}
      getErrorCountForSection={getErrorCountForSection}
      savedFields={savedFields}
      flashingFields={flashingFields}
      fieldOriginalValues={fieldOriginalValues}
      expandedSections={expandedSections}
      setExpandedSections={setExpandedSections}
      skuValidation={skuValidation}
      categories={(allCategories || []) as unknown as MappedCategory[]}
      isLoadingCategories={isLoadingCategories}
      variants={variants}
      isBulkMode={isBulkMode}
      isMobile={isMobile}
    >
      <form id="quick-edit-form" onSubmit={handleSubmit(onSubmit, onError)} className="space-y-4">
        {/* PERFORMANCE OPTIMIZATION (3.3.1): Show skeleton loader while loading */}
        {loadingProduct && !isBulkMode && (
          <ProductQuickEditSkeleton />
        )}
        
        {/* PHASE 4: Extract Components - QuickEditSkipLinks */}
        <QuickEditSkipLinks loadingProduct={loadingProduct} />
        
        {/* PHASE 2: Success Feedback Enhancement (7.11.4) - "All changes saved" message */}
        {/* UX/UI UPGRADE Phase 4.1.3: aria-live region cho success message */}
        {!loadingProduct && showSuccessIndicator && !isDirty && (
          <div 
            className="bg-green-50 border border-green-200 rounded-md p-3 md:p-4 space-y-2 animate-in slide-in-from-top-2"
            role="status"
            aria-live="polite"
            aria-atomic="true"
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" aria-hidden="true" />
              <h4 className="text-sm font-semibold text-green-900">
                Tất cả thay đổi đã được lưu
              </h4>
            </div>
            {lastSavedTime && (
              <p className="text-xs text-green-700 ml-7">
                Đã lưu lúc: {lastSavedTime.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </p>
            )}
          </div>
        )}
        
        {/* PHASE 1: Error Message Details (7.6.3) - Error Summary Section */}
        {/* UX/UI UPGRADE Phase 4.1.3: aria-live region cho error summary */}
        {!loadingProduct && allValidationErrors.length > 0 && (
          <div 
            className="bg-red-50 border border-red-200 rounded-md p-3 md:p-4 space-y-2 animate-in slide-in-from-top-2"
            role="alert"
            aria-live="assertive"
            aria-atomic="true"
          >
            <div className="flex items-center gap-2">
              <div className="h-5 w-5 rounded-full bg-red-500 flex items-center justify-center flex-shrink-0">
                <span className="text-white text-xs font-bold">{allValidationErrors.length}</span>
              </div>
              <h4 className="text-sm font-semibold text-red-900">
                Có {allValidationErrors.length} lỗi validation cần sửa:
              </h4>
            </div>
            <ul className="list-disc list-inside space-y-1 text-sm text-red-800 ml-7">
              {allValidationErrors.map((err, index) => (
                <li key={index}>
                  {/* UX/UI UPGRADE Phase 2.1.2: Error summary với clickable links */}
                  {/* UX/UI UPGRADE Phase 3.3.1: Touch target >= 44x44px */}
                  <button
                    type="button"
                    onClick={() => scrollToErrorField(err.field)}
                    className="text-left hover:underline hover:text-red-900 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 rounded px-1 -ml-1 transition-colors min-h-[44px] py-2 w-full"
                    aria-label={`Scroll to ${err.label} field`}
                  >
                    <span className="font-medium">{err.label}:</span> {err.message}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
        
        {/* PHASE 2: Loading Progress Indicator (7.9.3) - Enhanced loading with progress steps */}
        {/* PERFORMANCE OPTIMIZATION (3.3.1): Only show overlay loader for bulk mode, skeleton for single mode */}
        {loadingProduct && isBulkMode && (
          <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50 rounded-md">
            <LoadingProgressIndicator 
              step={loadingStep} 
              showTimeEstimate={true}
            />
          </div>
        )}
        {/* PHASE 1: Visual Hierarchy & Grouping (7.11.1) - Section Header */}
        {/* PERFORMANCE OPTIMIZATION (3.3.1): Hide form content while loading (skeleton shown above) */}
        {!loadingProduct && (
          <>
            {/* PHASE 5.3.2: Accordion Layout - Wrap sections in Accordion */}
            <Accordion 
              type="multiple" 
              value={expandedSections} 
              onValueChange={setExpandedSections}
              className="w-full space-y-0"
            >
              {/* Basic Info Section */}
              <AccordionItem value="section-basic-info" className="border-b border-slate-200">
                <AccordionTrigger 
                  id="section-basic-info"
                  className="hover:no-underline py-4 scroll-mt-4"
                  aria-label="Thông tin cơ bản"
                >
                  <div className="flex items-center gap-2">
                    <Package className="h-5 w-5 text-slate-600" aria-hidden="true" />
                    <h3 className="text-base font-semibold text-slate-900">Thông tin cơ bản</h3>
                    {getErrorCountForSection('section-basic-info') > 0 && (
                      <Badge variant="destructive" className="ml-2 h-5 min-w-[20px] px-1.5 text-xs">
                        {getErrorCountForSection('section-basic-info')}
                      </Badge>
                    )}
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-0 pb-4">
                  {/* PHASE 2: Extract Form Sections - BasicInfoSection */}
                  <BasicInfoSection skuValidation={{ isValid: skuValidation.isValid, isValidating: skuValidation.isValidating, error: skuValidation.error }} />
                </AccordionContent>
              </AccordionItem>

              {/* Pricing Section */}
              <AccordionItem value="section-pricing" className="border-b border-slate-200">
                <AccordionTrigger 
                  id="section-pricing"
                  className="hover:no-underline py-4 scroll-mt-4"
                  aria-label="Giá & Trạng thái"
                >
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-slate-600" aria-hidden="true" />
                    <h3 className="text-base font-semibold text-slate-900">Giá & Trạng thái</h3>
                    {getErrorCountForSection('section-pricing') > 0 && (
                      <Badge variant="destructive" className="ml-2 h-5 min-w-[20px] px-1.5 text-xs">
                        {getErrorCountForSection('section-pricing')}
                      </Badge>
                    )}
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-0 pb-4">
                  {/* PHASE 2: Extract Form Sections - PricingSection */}
                  <PricingSection
                    showStatusChangeWarning={showStatusChangeWarning}
                    setShowStatusChangeWarning={setShowStatusChangeWarning}
                    pendingStatus={pendingStatus}
                    setPendingStatus={setPendingStatus}
                    previousStatus={previousStatus}
                    setPreviousStatus={setPreviousStatus}
                  />

                  {/* PHASE 2: Extract Form Sections - InventorySection */}
                  <InventorySection loadedSections={loadedSections} />
                </AccordionContent>
              </AccordionItem>

              {/* Product Type Section */}
              <AccordionItem value="section-product-type" className="border-b border-slate-200">
                <AccordionTrigger 
                  id="section-product-type"
                  className="hover:no-underline py-4 scroll-mt-4"
                  aria-label="Loại sản phẩm & Hiển thị"
                >
                  <div className="flex items-center gap-2">
                    <Package className="h-5 w-5 text-slate-600" aria-hidden="true" />
                    <h3 className="text-base font-semibold text-slate-900">Loại sản phẩm & Hiển thị</h3>
                    {getErrorCountForSection('section-product-type') > 0 && (
                      <Badge variant="destructive" className="ml-2 h-5 min-w-[20px] px-1.5 text-xs">
                        {getErrorCountForSection('section-product-type')}
                      </Badge>
                    )}
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-0 pb-4">
                  {/* PHASE 2: Extract Form Sections - ProductTypeSection */}
                  {/* PERFORMANCE OPTIMIZATION (3.3.2): Progressive loading - Load secondary sections after critical sections */}
                  {loadedSections.has('secondary') ? (
                    <ProductTypeSection
                      showProductTypeWarning={showProductTypeWarning}
                      setShowProductTypeWarning={setShowProductTypeWarning}
                      pendingProductType={pendingProductType}
                      setPendingProductType={setPendingProductType}
                    />
                  ) : (
                    <div className="mt-6 space-y-4 animate-pulse">
                      <div className="h-5 w-48 bg-slate-200 rounded" />
                      {/* PHASE 5.3.6: Mobile compact layout - Reduce padding on mobile */}
                      <div className="bg-slate-50 border border-slate-200 rounded-md p-3 md:p-4 space-y-4">
                        <div className="h-10 bg-slate-200 rounded" />
                        <div className="h-10 bg-slate-200 rounded" />
                      </div>
                    </div>
                  )}
                </AccordionContent>
              </AccordionItem>

              {/* Shipping & Tax Section */}
              <AccordionItem value="section-shipping" className="border-b border-slate-200">
                <AccordionTrigger 
                  id="section-shipping"
                  className="hover:no-underline py-4 scroll-mt-4"
                  aria-label="Giao hàng & Thuế"
                >
                  <div className="flex items-center gap-2">
                    <Ruler className="h-5 w-5 text-slate-600" aria-hidden="true" />
                    <h3 className="text-base font-semibold text-slate-900">Giao hàng & Thuế</h3>
                    {getErrorCountForSection('section-shipping') > 0 && (
                      <Badge variant="destructive" className="ml-2 h-5 min-w-[20px] px-1.5 text-xs">
                        {getErrorCountForSection('section-shipping')}
                      </Badge>
                    )}
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-0 pb-4">
                  {/* PHASE 2: Extract Form Sections - ShippingSection */}
                  {/* PERFORMANCE OPTIMIZATION (3.3.2): Progressive loading - Load secondary sections after critical sections */}
                  {loadedSections.has('secondary') ? (
                    <ShippingSection />
                  ) : (
                    <div className="mt-6 space-y-4 animate-pulse">
                      <div className="h-5 w-40 bg-slate-200 rounded" />
                      {/* PHASE 5.3.6: Mobile compact layout - Reduce padding on mobile */}
                      <div className="bg-slate-50 border border-slate-200 rounded-md p-3 md:p-4 space-y-4">
                        <div className="h-10 bg-slate-200 rounded" />
                        <div className="h-10 bg-slate-200 rounded" />
                        <div className="h-10 bg-slate-200 rounded" />
                      </div>
                    </div>
                  )}

                  {/* PHASE 2: Extract Form Sections - DimensionsSection */}
                  {/* PERFORMANCE OPTIMIZATION (3.3.2): Progressive loading - Load secondary sections after critical sections */}
                  {loadedSections.has('secondary') ? (
                    <DimensionsSection />
                  ) : (
                    <div className="mb-6 mt-6 space-y-4 animate-pulse">
                      <div className="h-5 w-56 bg-slate-200 rounded" />
                      {/* PHASE 5.3.6: Mobile compact layout - Reduce padding on mobile */}
                      <div className="bg-slate-50 border border-slate-200 rounded-md p-3 md:p-4 space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="h-10 bg-slate-200 rounded" />
                          <div className="h-10 bg-slate-200 rounded" />
                          <div className="h-10 bg-slate-200 rounded" />
                          <div className="h-10 bg-slate-200 rounded" />
                        </div>
                      </div>
                    </div>
                  )}
                </AccordionContent>
              </AccordionItem>

              {/* Categories & Tags Section */}
              <AccordionItem value="section-categories" className="border-b border-slate-200">
                <AccordionTrigger 
                  id="section-categories"
                  className="hover:no-underline py-4 scroll-mt-4"
                  aria-label="Danh mục & Thẻ"
                >
                  <div className="flex items-center gap-2">
                    <Tag className="h-5 w-5 text-slate-600" aria-hidden="true" />
                    <h3 className="text-base font-semibold text-slate-900">Danh mục & Thẻ</h3>
                    {getErrorCountForSection('section-categories') > 0 && (
                      <Badge variant="destructive" className="ml-2 h-5 min-w-[20px] px-1.5 text-xs">
                        {getErrorCountForSection('section-categories')}
                      </Badge>
                    )}
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-0 pb-4">
                  {/* PHASE 1: Visual Hierarchy & Grouping (7.11.1) - Section Header */}
                  {/* PERFORMANCE OPTIMIZATION (3.3.2): Progressive loading - Categories already lazy loaded, but show skeleton if section not loaded */}
                  {loadedSections.has('secondary') ? (
                    <>
                      {/* PHASE 2: Extract Form Sections - CategoriesSection */}
                      <CategoriesSection categories={(allCategories || []) as unknown as MappedCategory[]} isLoadingCategories={isLoadingCategories} />
                    </>
                  ) : (
                    <div className="mb-6 mt-6 space-y-4 animate-pulse">
                      <div className="h-5 w-32 bg-slate-200 rounded" />
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="h-32 bg-slate-200 rounded" />
                      </div>
                    </div>
                  )}
                </AccordionContent>
              </AccordionItem>

              {/* Images Section */}
              <AccordionItem value="section-images" className="border-b border-slate-200">
                <AccordionTrigger 
                  id="section-images"
                  className="hover:no-underline py-4 scroll-mt-4"
                  aria-label="Hình ảnh sản phẩm"
                >
                  <div className="flex items-center gap-2">
                    <ImageIcon className="h-5 w-5 text-slate-600" aria-hidden="true" />
                    <h3 className="text-base font-semibold text-slate-900">Hình ảnh sản phẩm</h3>
                    {getErrorCountForSection('section-images') > 0 && (
                      <Badge variant="destructive" className="ml-2 h-5 min-w-[20px] px-1.5 text-xs">
                        {getErrorCountForSection('section-images')}
                      </Badge>
                    )}
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-0 pb-4">
                  {/* PERFORMANCE OPTIMIZATION (3.3.2): Progressive loading - Load secondary sections after critical sections */}
                  {loadedSections.has('secondary') ? (
                    <>
                      {/* PHASE 2: Extract Form Sections - ImagesSection */}
                      <ImagesSection
                        product={product || undefined}
                        mediaLibraryOpen={mediaLibraryOpen}
                        setMediaLibraryOpen={setMediaLibraryOpen}
                        mediaLibraryMode={mediaLibraryMode}
                        setMediaLibraryMode={setMediaLibraryMode}
                      />
                    </>
                  ) : (
                    <div className="mb-6 mt-6 space-y-4 animate-pulse">
                      <div className="h-5 w-32 bg-slate-200 rounded" />
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="h-32 bg-slate-200 rounded" />
                        <div className="space-y-2">
                          <div className="h-10 bg-slate-200 rounded" />
                          <div className="grid grid-cols-3 gap-2">
                            <div className="h-20 bg-slate-200 rounded" />
                            <div className="h-20 bg-slate-200 rounded" />
                            <div className="h-20 bg-slate-200 rounded" />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </AccordionContent>
              </AccordionItem>

              {/* PHASE 2: Extract Form Sections - SeoSection */}
              {/* PERFORMANCE OPTIMIZATION (3.3.2): Progressive loading - Load secondary sections after critical sections */}
              {loadedSections.has('secondary') ? (
                <SeoSection
                  product={product || undefined}
                  isBulkMode={isBulkMode}
                  onClose={() => {}} // onClose will be handled by parent
                />
              ) : (
                <div className="mt-6 space-y-4 animate-pulse">
                  <div className="h-5 w-32 bg-slate-200 rounded" />
                  <div className="space-y-4">
                    <div className="h-10 bg-slate-200 rounded" />
                    <div className="h-20 bg-slate-200 rounded" />
                    <div className="h-10 bg-slate-200 rounded" />
                  </div>
                </div>
              )}
            </Accordion>

            {/* PHASE 2: Extract Form Sections - VariantsSection */}
            <VariantsSection
              productWithVariants={productWithVariants ?? null}
              loadingProduct={loadingProduct}
              loadedSections={loadedSections}
            />

            {/* PHASE 2.5: Extract ProductOptionsSection - Attributes Enable/Disable */}
            <ProductOptionsSection 
              product={product || undefined}
              productWithVariants={productWithVariants ?? null}
            />
          </>
        )}
      </form>
    </QuickEditFormProvider>
  );
});

QuickEditFormContent.displayName = 'QuickEditFormContent';

