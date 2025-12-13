/**
 * Vietnam Address Data Utility
 * 
 * Load và parse dữ liệu tỉnh thành, quận huyện, phường xã từ API routes
 * 
 * Note: Đã chuyển từ public JSON file sang API routes để tối ưu:
 * - Giảm bundle size (không load toàn bộ 1MB JSON)
 * - Tăng bảo mật (data không expose trực tiếp)
 * - Lazy loading theo nhu cầu (provinces, districts, wards)
 */

export interface City {
  cityId: string;
  name: string;
}

export interface District {
  cityId: string;
  districtId: string;
  name: string;
}

export interface Ward {
  districtId: string;
  wardId: string;
  name: string;
  // Note: Ward objects in JSON don't have cityId field
  // cityId is inferred from the district
}

/**
 * Get all cities (provinces) from API
 */
export async function getCities(): Promise<City[]> {
  try {
    const response = await fetch('/api/locations/provinces', {
      cache: 'force-cache', // Cache for better performance
    });
    
    if (!response.ok) {
      throw new Error('Failed to load provinces');
    }
    
    const data = await response.json();
    return data.provinces || [];
  } catch (error) {
    console.error('Error loading cities:', error);
    throw error;
  }
}

/**
 * Get districts by city ID from API
 */
export async function getDistrictsByCity(cityId: string): Promise<District[]> {
  if (!cityId) {
    return [];
  }

  try {
    const response = await fetch(`/api/locations/districts?provinceId=${encodeURIComponent(cityId)}`, {
      cache: 'force-cache', // Cache for better performance
    });
    
    if (!response.ok) {
      throw new Error('Failed to load districts');
    }
    
    const data = await response.json();
    return data.districts || [];
  } catch (error) {
    console.error('Error loading districts:', error);
    throw error;
  }
}

/**
 * Get wards by city ID and district ID from API
 * 
 * Note: Ward objects in JSON only have districtId, wardId, and name
 * (no cityId field). We verify that the district belongs to the city first for safety.
 */
export async function getWardsByDistrict(
  cityId: string,
  districtId: string
): Promise<Ward[]> {
  if (!cityId || !districtId) {
    return [];
  }

  try {
    // Verify that the district belongs to the city first
    const districts = await getDistrictsByCity(cityId);
    const districtExists = districts.some((d) => d.districtId === districtId);
    
    if (!districtExists) {
      console.warn(`District ${districtId} does not belong to city ${cityId}`);
      return [];
    }
    
    // Get wards by districtId
    const response = await fetch(`/api/locations/wards?districtId=${encodeURIComponent(districtId)}`, {
      cache: 'force-cache', // Cache for better performance
    });
    
    if (!response.ok) {
      throw new Error('Failed to load wards');
    }
    
    const data = await response.json();
    return data.wards || [];
  } catch (error) {
    console.error('Error loading wards:', error);
    throw error;
  }
}

/**
 * Find city by ID
 */
export async function getCityById(cityId: string): Promise<City | null> {
  const cities = await getCities();
  return cities.find((c) => c.cityId === cityId) || null;
}

/**
 * Find district by ID
 */
export async function getDistrictById(
  cityId: string,
  districtId: string
): Promise<District | null> {
  const districts = await getDistrictsByCity(cityId);
  return districts.find((d) => d.districtId === districtId) || null;
}

/**
 * Find ward by ID
 */
export async function getWardById(
  cityId: string,
  districtId: string,
  wardId: string
): Promise<Ward | null> {
  const wards = await getWardsByDistrict(cityId, districtId);
  return wards.find((w) => w.wardId === wardId) || null;
}

/**
 * Get all wards for a district (without city verification)
 * Useful for cases where you already know the district is valid
 */
export async function getWardsByDistrictId(districtId: string): Promise<Ward[]> {
  if (!districtId) {
    return [];
  }

  try {
    const response = await fetch(`/api/locations/wards?districtId=${encodeURIComponent(districtId)}`, {
      cache: 'force-cache', // Cache for better performance
    });
    
    if (!response.ok) {
      throw new Error('Failed to load wards');
    }
    
    const data = await response.json();
    return data.wards || [];
  } catch (error) {
    console.error('Error loading wards:', error);
    throw error;
  }
}

