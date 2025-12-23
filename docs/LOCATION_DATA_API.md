# 📍 Location Data API Documentation

**Ngày tạo:** 2025-12-13  
**Phase:** Phase 5 - Location Data Optimization

---

## 🎯 Overview

Location data (tỉnh thành, quận huyện, phường xã) đã được chuyển từ public JSON file sang API routes để tối ưu:

- ✅ **Giảm bundle size**: Không load toàn bộ 1MB JSON file
- ✅ **Tăng bảo mật**: Data không expose trực tiếp từ public folder
- ✅ **Lazy loading**: Chỉ load data khi cần (provinces, districts, wards)
- ✅ **Caching**: API routes có cache headers (1 day cache, 7 days stale)

---

## 📁 File Structure

```
data/
└── vietnam-seo-2.json          # Location data (moved from public/)

app/api/locations/
├── provinces/
│   └── route.ts               # GET /api/locations/provinces
├── districts/
│   └── route.ts               # GET /api/locations/districts?provinceId=xxx
└── wards/
    └── route.ts                # GET /api/locations/wards?districtId=xxx

lib/utils/
└── vietnamAddress.ts          # Updated to use API routes
```

---

## 🔌 API Endpoints

> **Note:** Routes with query parameters are marked as `dynamic = 'force-dynamic'` to prevent static generation errors in Next.js.

### 1. Get All Provinces

**Endpoint:** `GET /api/locations/provinces`

**Route Type:** Static (no query parameters)

**Response:**
```json
{
  "provinces": [
    {
      "cityId": "01",
      "name": "TP. Hà Nội"
    },
    {
      "cityId": "03",
      "name": "Tỉnh Vĩnh Phúc"
    }
  ],
  "count": 63
}
```

**Cache:** 1 day (86400 seconds), 7 days stale-while-revalidate

---

### 2. Get Districts by Province

**Endpoint:** `GET /api/locations/districts?provinceId=xxx`

**Route Type:** Dynamic (uses query parameters)

**Query Parameters:**
- `provinceId` (required): City/Province ID

**Response:**
```json
{
  "districts": [
    {
      "cityId": "01",
      "districtId": "001",
      "name": "Quận Ba Đình"
    },
    {
      "cityId": "01",
      "districtId": "002",
      "name": "Quận Hoàn Kiếm"
    }
  ],
  "count": 30,
  "provinceId": "01"
}
```

**Cache:** 1 day (86400 seconds), 7 days stale-while-revalidate

**Error Response (400):**
```json
{
  "error": "Missing required parameter: provinceId"
}
```

---

### 3. Get Wards by District

**Endpoint:** `GET /api/locations/wards?districtId=xxx`

**Route Type:** Dynamic (uses query parameters)

**Query Parameters:**
- `districtId` (required): District ID

**Response:**
```json
{
  "wards": [
    {
      "districtId": "001",
      "wardId": "00001",
      "name": "Phường Cống Vị"
    },
    {
      "districtId": "001",
      "wardId": "00002",
      "name": "Phường Điện Biên"
    }
  ],
  "count": 14,
  "districtId": "001"
}
```

**Cache:** 1 day (86400 seconds), 7 days stale-while-revalidate

**Error Response (400):**
```json
{
  "error": "Missing required parameter: districtId"
}
```

---

## 💻 Usage

### Client-Side (React Components)

```typescript
import { getCities, getDistrictsByCity, getWardsByDistrict } from '@/lib/utils/vietnamAddress';

// Get all provinces
const cities = await getCities();

// Get districts by province
const districts = await getDistrictsByCity('01'); // Hà Nội

// Get wards by district
const wards = await getWardsByDistrict('01', '001'); // Ba Đình
```

### Direct API Calls

```typescript
// Get provinces
const response = await fetch('/api/locations/provinces');
const { provinces } = await response.json();

// Get districts
const response = await fetch('/api/locations/districts?provinceId=01');
const { districts } = await response.json();

// Get wards
const response = await fetch('/api/locations/wards?districtId=001');
const { wards } = await response.json();
```

---

## 🔄 Migration Notes

### Before (Public JSON)
- File: `public/vietnam-seo-2.json` (~1MB)
- Load: `fetch('/vietnam-seo-2.json')` - Load toàn bộ file
- Issues:
  - Bundle size lớn
  - Data expose trực tiếp
  - Load toàn bộ data mỗi lần

### After (API Routes)
- File: `data/vietnam-seo-2.json` (server-side only)
- Load: API routes - Load theo nhu cầu
- Benefits:
  - ✅ Giảm bundle size
  - ✅ Tăng bảo mật
  - ✅ Lazy loading
  - ✅ Caching

---

## 🧪 Testing

### Manual Testing

1. **Test Provinces API:**
   ```bash
   curl http://localhost:3000/api/locations/provinces
   ```

2. **Test Districts API:**
   ```bash
   curl "http://localhost:3000/api/locations/districts?provinceId=01"
   ```

3. **Test Wards API:**
   ```bash
   curl "http://localhost:3000/api/locations/wards?districtId=001"
   ```

### Component Testing

Test `AddressSelector` component:
- Select province → Districts should load
- Select district → Wards should load
- Verify data loads correctly

---

## 📊 Performance

### Before
- Initial load: ~1MB JSON file
- Subsequent loads: Cached in memory (client-side)

### After
- Initial load: ~0KB (no data loaded)
- Provinces load: ~50KB (63 provinces)
- Districts load: ~200KB (varies by province)
- Wards load: ~100KB (varies by district)
- **Total savings**: Only load what's needed

### Caching
- API responses cached for 1 day
- Stale-while-revalidate for 7 days
- Client-side cache via `cache: 'force-cache'`

---

## 🔒 Security

- ✅ JSON file moved from `public/` to `data/` (not accessible via URL)
- ✅ API routes validate input parameters
- ✅ Error messages don't expose file paths in production
- ✅ Rate limiting via `vercel.json` (if configured)

---

## 📝 Notes

1. **Backward Compatibility:**
   - Old file `public/vietnam-seo-2.json` can be kept for backward compatibility
   - Or removed if not needed

2. **Future Enhancements:**
   - Consider moving to MongoDB if data needs frequent updates
   - Add search/filter functionality
   - Add pagination for large datasets

3. **Error Handling:**
   - API routes return user-friendly error messages
   - Client-side functions throw errors that can be caught by components

---

**Last Updated:** 2025-12-13
