# 💡 Media Library - Đề Xuất Soft Delete Pattern

**Ngày tạo:** 2025-01-XX  
**Mục tiêu:** Tránh rủi ro "Bản ghi ma" (Ghost Record) khi xóa media  
**Status:** Proposal (Chưa implement)

---

## 🎯 VẤN ĐỀ

### Rủi ro "Bản ghi ma" (Ghost Record)

**Tình huống:**
1. User xóa media → API gọi `storageService.delete()` → ✅ File xóa thành công
2. API gọi `deleteMedia(id)` → ❌ DB delete thất bại (lỗi mạng, timeout, transaction rollback)
3. **Kết quả:** 
   - File vật lý đã mất (không còn trong storage)
   - DB record vẫn còn (chưa bị xóa)
   - User thấy ảnh trong danh sách nhưng click vào → 404 error

**Tần suất:** Hiếm gặp nhưng có thể xảy ra trong production

---

## 💡 GIẢI PHÁP: SOFT DELETE PATTERN

### Tổng quan

Sử dụng **Soft Delete** pattern (giống như Products module):
1. **Soft Delete:** Đánh dấu xóa trong DB (set `deletedAt`), file vẫn còn
2. **Cron Job:** Tự động xóa file vật lý + hard delete DB sau 30 ngày
3. **Restore:** Có thể khôi phục nếu xóa nhầm

### Lợi ích

- ✅ **Tránh "Bản ghi ma":** File và DB luôn đồng bộ
- ✅ **Có thể khôi phục:** Restore nếu xóa nhầm
- ✅ **Tự động cleanup:** Cron job xóa sau 30 ngày
- ✅ **Consistent pattern:** Giống Products module (đã có sẵn)

---

## 📋 IMPLEMENTATION PLAN

### Phase 1: Database Schema Update

#### 1.1. Update MongoMedia Interface

**File:** `types/media.ts`

```typescript
export interface MongoMedia {
  _id: ObjectId;
  
  // ... existing fields ...
  
  // System
  uploadedBy?: ObjectId;
  deletedAt?: Date | null;  // NEW: Soft delete timestamp. NULL = chưa xóa
  createdAt: Date;
  updatedAt: Date;
}
```

#### 1.2. Update MediaInput Interface

**File:** `types/media.ts`

```typescript
export interface MediaInput {
  // ... existing fields ...
  uploadedBy?: ObjectId;
  // deletedAt không cần trong MediaInput (chỉ set khi soft delete)
}
```

#### 1.3. Create Migration Script

**File:** `scripts/migrate-media-soft-delete.ts`

```typescript
import { getCollections, closeDB } from '../lib/db';

async function migrateMediaSoftDelete() {
  console.log('🔄 Starting migration: Add Soft Delete Support to Media\n');

  try {
    const collections = await getCollections();

    // Step 1: Add deletedAt field to all existing media (set to null)
    console.log('📦 Step 1: Adding deletedAt field to existing media...');
    const updateResult = await collections.media.updateMany(
      { deletedAt: { $exists: false } },
      { $set: { deletedAt: null } }
    );
    console.log(`   ✅ Updated ${updateResult.modifiedCount} media documents\n`);

    // Step 2: Create index on deletedAt for performance
    console.log('📦 Step 2: Creating index on deletedAt field...');
    try {
      await collections.media.createIndex({ deletedAt: 1 });
      console.log('   ✅ Index created on deletedAt\n');
    } catch (error: any) {
      if (error.code === 85 || error.codeName === 'IndexOptionsConflict') {
        console.log('   ⚠️  Index already exists, skipping...\n');
      } else {
        throw error;
      }
    }

    // Step 3: Create compound index for common queries
    console.log('📦 Step 3: Creating compound index for type + deletedAt...');
    try {
      await collections.media.createIndex({ type: 1, deletedAt: 1 });
      console.log('   ✅ Compound index created\n');
    } catch (error: any) {
      if (error.code === 85 || error.codeName === 'IndexOptionsConflict') {
        console.log('   ⚠️  Compound index already exists, skipping...\n');
      } else {
        throw error;
      }
    }

    console.log('✅ Migration completed successfully!\n');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await closeDB();
  }
}

migrateMediaSoftDelete();
```

---

### Phase 2: Repository Update

#### 2.1. Update getMediaList - Filter deletedAt

**File:** `lib/repositories/mediaRepository.ts`

```typescript
export async function getMediaList(
  filters: MediaFilters = {},
  pagination: MediaPagination = { page: 1, limit: 20 }
): Promise<MediaListResponse> {
  const { media } = await getCollections();
  
  // ... existing code ...
  
  // Build query
  const query: any = {};

  // NEW: Filter out soft-deleted media by default
  query.deletedAt = null;

  // ... rest of existing filters ...
  
  // ... rest of code ...
}
```

#### 2.2. Update deleteMedia - Soft Delete

**File:** `lib/repositories/mediaRepository.ts`

```typescript
/**
 * Soft delete media document
 * 
 * @param id - Media ID (ObjectId string)
 * @returns true if soft deleted, false if not found
 */
export async function deleteMedia(id: string): Promise<boolean> {
  const { media } = await getCollections();
  
  try {
    const result = await media.updateOne(
      { _id: new ObjectId(id), deletedAt: null }, // Only soft delete if not already deleted
      { 
        $set: { 
          deletedAt: new Date(),
          updatedAt: new Date(),
        } 
      }
    );
    return result.modifiedCount > 0;
  } catch (error) {
    // Invalid ObjectId format
    return false;
  }
}

/**
 * Hard delete media document (permanently delete)
 * 
 * @param id - Media ID (ObjectId string)
 * @returns true if deleted, false if not found
 */
export async function hardDeleteMedia(id: string): Promise<boolean> {
  const { media } = await getCollections();
  
  try {
    const result = await media.deleteOne({ _id: new ObjectId(id) });
    return result.deletedCount > 0;
  } catch (error) {
    return false;
  }
}

/**
 * Restore soft-deleted media
 * 
 * @param id - Media ID (ObjectId string)
 * @returns true if restored, false if not found
 */
export async function restoreMedia(id: string): Promise<boolean> {
  const { media } = await getCollections();
  
  try {
    const result = await media.updateOne(
      { _id: new ObjectId(id), deletedAt: { $ne: null } }, // Only restore if deleted
      { 
        $set: { 
          deletedAt: null,
          updatedAt: new Date(),
        } 
      }
    );
    return result.modifiedCount > 0;
  } catch (error) {
    return false;
  }
}

/**
 * Get soft-deleted media list (for trash management)
 */
export async function getDeletedMediaList(
  filters: MediaFilters = {},
  pagination: MediaPagination = { page: 1, limit: 20 }
): Promise<MediaListResponse> {
  // Similar to getMediaList but query deletedAt: { $ne: null }
  // ... implementation ...
}
```

---

### Phase 3: API Routes Update

#### 3.1. Update DELETE Endpoint - Soft Delete

**File:** `app/api/admin/media/[id]/route.ts`

```typescript
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin();
    
    // Validate params
    const validationResult = deleteMediaParamsSchema.safeParse({ id: params.id });
    if (!validationResult.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid media ID' },
        { status: 400 }
      );
    }

    const { id } = validationResult.data;

    // Get media
    const media = await getMediaById(id);
    if (!media) {
      return NextResponse.json(
        { success: false, error: 'Media not found' },
        { status: 404 }
      );
    }

    // NEW: Soft delete (set deletedAt, don't delete file yet)
    const deleted = await deleteMedia(id);
    if (!deleted) {
      return NextResponse.json(
        { success: false, error: 'Failed to delete media' },
        { status: 500 }
      );
    }

    // Return response
    return NextResponse.json({
      success: true,
      message: 'Media moved to trash',
    });
  } catch (error) {
    // ... error handling ...
  }
}
```

#### 3.2. Create Restore Endpoint

**File:** `app/api/admin/media/[id]/restore/route.ts` (NEW)

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { restoreMedia, getMediaById } from '@/lib/repositories/mediaRepository';
import { getMediaDetailSchema } from '@/lib/validations/mediaSchema';
import { handleValidationError } from '@/lib/utils/validation-errors';

export const dynamic = 'force-dynamic';

/**
 * PATCH /api/admin/media/[id]/restore
 * Restore soft-deleted media
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin();

    const validationResult = getMediaDetailSchema.safeParse({ id: params.id });
    if (!validationResult.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid media ID' },
        { status: 400 }
      );
    }

    const { id } = validationResult.data;

    const restored = await restoreMedia(id);
    if (!restored) {
      return NextResponse.json(
        { success: false, error: 'Media not found or already restored' },
        { status: 404 }
      );
    }

    const media = await getMediaById(id);

    return NextResponse.json({
      success: true,
      message: 'Media restored successfully',
      data: media,
    });
  } catch (error) {
    // ... error handling ...
  }
}
```

#### 3.3. Create Force Delete Endpoint

**File:** `app/api/admin/media/[id]/force/route.ts` (NEW)

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { hardDeleteMedia, getMediaById } from '@/lib/repositories/mediaRepository';
import { getStorageServiceSingleton } from '@/lib/storage/storageFactory';
import { deleteMediaParamsSchema } from '@/lib/validations/mediaSchema';
import { handleValidationError } from '@/lib/utils/validation-errors';

export const dynamic = 'force-dynamic';

/**
 * DELETE /api/admin/media/[id]/force
 * Permanently delete media (hard delete)
 * 
 * WARNING: This action cannot be undone!
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin();

    const validationResult = deleteMediaParamsSchema.safeParse({ id: params.id });
    if (!validationResult.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid media ID' },
        { status: 400 }
      );
    }

    const { id } = validationResult.data;

    // Get media to get storage path/URL
    const media = await getMediaById(id);
    if (!media) {
      return NextResponse.json(
        { success: false, error: 'Media not found' },
        { status: 404 }
      );
    }

    // Delete from storage
    const storageService = getStorageServiceSingleton();
    try {
      if (media.url) {
        if ('deleteByUrl' in storageService && typeof storageService.deleteByUrl === 'function') {
          await (storageService as any).deleteByUrl(media.url);
        } else {
          await storageService.delete(media.path);
        }
      }
    } catch (storageError) {
      console.error('Error deleting from storage:', storageError);
      // Continue with DB deletion even if storage deletion fails
    }

    // Hard delete from database
    const deleted = await hardDeleteMedia(id);
    if (!deleted) {
      return NextResponse.json(
        { success: false, error: 'Failed to delete media' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Media permanently deleted',
    });
  } catch (error) {
    // ... error handling ...
  }
}
```

#### 3.4. Create Auto Cleanup Cron Job

**File:** `app/api/admin/media/auto-cleanup-trash/route.ts` (NEW)

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getCollections } from '@/lib/db';
import { getStorageServiceSingleton } from '@/lib/storage/storageFactory';
import { hardDeleteMedia } from '@/lib/repositories/mediaRepository';

export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/media/auto-cleanup-trash
 * 
 * Cron job endpoint to permanently delete media that has been in trash for > 30 days
 * 
 * Should be called by external cron service (Vercel Cron, GitHub Actions, etc.)
 * 
 * Security: Should require API key or admin authentication
 */
export async function POST(request: NextRequest) {
  try {
    // TODO: Add API key authentication or admin check
    // const apiKey = request.headers.get('x-api-key');
    // if (apiKey !== process.env.CRON_API_KEY) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    const { media } = await getCollections();
    const storageService = getStorageServiceSingleton();

    // Find media deleted more than 30 days ago
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const deletedMedia = await media
      .find({
        deletedAt: { $ne: null, $lte: thirtyDaysAgo },
      })
      .toArray();

    let deletedCount = 0;
    let errorCount = 0;

    for (const mediaDoc of deletedMedia) {
      try {
        // Delete file from storage
        if (mediaDoc.url) {
          if ('deleteByUrl' in storageService && typeof storageService.deleteByUrl === 'function') {
            await (storageService as any).deleteByUrl(mediaDoc.url);
          } else {
            await storageService.delete(mediaDoc.path);
          }
        }

        // Hard delete from database
        await hardDeleteMedia(mediaDoc._id.toString());
        deletedCount++;
      } catch (error) {
        console.error(`Error deleting media ${mediaDoc._id}:`, error);
        errorCount++;
      }
    }

    return NextResponse.json({
      success: true,
      message: `Cleanup completed: ${deletedCount} deleted, ${errorCount} errors`,
      deletedCount,
      errorCount,
      totalFound: deletedMedia.length,
    });
  } catch (error) {
    console.error('Error in auto-cleanup:', error);
    return NextResponse.json(
      { success: false, error: 'Cleanup failed' },
      { status: 500 }
    );
  }
}
```

---

### Phase 4: Frontend Update

#### 4.1. Update Media Library Page - Add Trash Tab

**File:** `app/admin/media/page.tsx`

- Thêm tab "Thùng rác" để hiển thị media đã xóa
- Thêm nút "Khôi phục" cho mỗi media trong trash
- Thêm nút "Xóa vĩnh viễn" (force delete)

#### 4.2. Update MediaDetailSidebar - Add Restore Button

**File:** `components/admin/media/MediaDetailSidebar.tsx`

- Nếu media đã bị xóa (`deletedAt !== null`), hiển thị nút "Khôi phục" thay vì "Xóa"

---

## 📅 CRON JOB SETUP

### Option 1: Vercel Cron (Recommended)

**File:** `vercel.json`

```json
{
  "crons": [
    {
      "path": "/api/admin/media/auto-cleanup-trash",
      "schedule": "0 2 * * *"
    }
  ]
}
```

### Option 2: External Cron Service

- GitHub Actions
- Cron-job.org
- EasyCron

---

## ✅ TESTING CHECKLIST

- [ ] Test soft delete: Media được đánh dấu `deletedAt`, không hiển thị trong list
- [ ] Test restore: Media được khôi phục, hiển thị lại trong list
- [ ] Test force delete: File và DB đều bị xóa vĩnh viễn
- [ ] Test auto cleanup: Media > 30 ngày bị xóa tự động
- [ ] Test "Bản ghi ma" scenario: Xóa file thành công nhưng DB fail → Media vẫn có thể restore

---

## 📊 COMPARISON

| Aspect | Hard Delete (Hiện tại) | Soft Delete (Đề xuất) |
|--------|------------------------|----------------------|
| **Rủi ro "Bản ghi ma"** | ⚠️ Có (nếu DB fail) | ✅ Không (file và DB luôn đồng bộ) |
| **Có thể khôi phục** | ❌ Không | ✅ Có (trong 30 ngày) |
| **Tự động cleanup** | ❌ Không | ✅ Có (cron job) |
| **Độ phức tạp** | ✅ Đơn giản | ⚠️ Phức tạp hơn |
| **Storage cost** | ✅ Thấp (xóa ngay) | ⚠️ Cao hơn (giữ 30 ngày) |
| **Pattern consistency** | ❌ Khác Products | ✅ Giống Products |

---

## 🎯 KẾT LUẬN

**Soft Delete Pattern là giải pháp tốt nhất** để tránh rủi ro "Bản ghi ma" và cung cấp tính năng restore.

**Khuyến nghị:**
- ✅ **Nếu có thời gian:** Implement Soft Delete (2-3 giờ)
- ⚠️ **Nếu không có thời gian:** Giữ hard delete hiện tại (chấp nhận được cho production)
- 💡 **Có thể implement sau:** Như một enhancement trong tương lai

---

**Last Updated:** 2025-01-XX
