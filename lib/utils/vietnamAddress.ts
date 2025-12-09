/**
 * Vietnam Address Data Utility
 * 
 * Load và parse dữ liệu tỉnh thành, quận huyện, phường xã từ vietnam-seo-2.json
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

interface VietnamAddressData {
  city: City[];
  district: District[];
  ward: Ward[];
}

let addressData: VietnamAddressData | null = null;

/**
 * Load address data from JSON file
 * Lazy load để tránh load toàn bộ dữ liệu khi không cần
 */
export async function loadAddressData(): Promise<VietnamAddressData> {
  if (addressData) {
    return addressData;
  }

  try {
    const response = await fetch('/vietnam-seo-2.json');
    if (!response.ok) {
      throw new Error('Failed to load address data');
    }
    const data = await response.json();
    addressData = data as VietnamAddressData;
    return addressData;
  } catch (error) {
    console.error('Error loading address data:', error);
    throw error;
  }
}

/**
 * Get all cities (provinces)
 */
export async function getCities(): Promise<City[]> {
  const data = await loadAddressData();
  return data.city || [];
}

/**
 * Get districts by city ID
 */
export async function getDistrictsByCity(cityId: string): Promise<District[]> {
  const data = await loadAddressData();
  if (!data.district) return [];
  return data.district.filter((d) => d.cityId === cityId);
}

/**
 * Get wards by city ID and district ID
 * 
 * Note: Ward objects in JSON only have districtId, wardId, and name
 * (no cityId field). So we filter by districtId only, but verify
 * that the district belongs to the city first for safety.
 */
export async function getWardsByDistrict(
  cityId: string,
  districtId: string
): Promise<Ward[]> {
  const data = await loadAddressData();
  if (!data.ward) return [];
  
  // Verify that the district belongs to the city
  const districts = await getDistrictsByCity(cityId);
  const districtExists = districts.some((d) => d.districtId === districtId);
  
  if (!districtExists) {
    console.warn(`District ${districtId} does not belong to city ${cityId}`);
    return [];
  }
  
  // Filter wards by districtId only (ward objects don't have cityId)
  return data.ward.filter((w) => w.districtId === districtId);
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
  const data = await loadAddressData();
  if (!data.ward) return [];
  return data.ward.filter((w) => w.districtId === districtId);
}

