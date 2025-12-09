'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  getCities,
  getDistrictsByCity,
  getWardsByDistrict,
  type City,
  type District,
  type Ward,
} from '@/lib/utils/vietnamAddress';
import { Select } from '@/components/ui/select';
import { cn } from '@/lib/utils/cn';

interface AddressSelectorProps {
  province?: string; // cityId
  district?: string; // districtId
  ward?: string; // wardId
  onProvinceChange: (cityId: string, cityName: string) => void;
  onDistrictChange: (districtId: string, districtName: string) => void;
  onWardChange: (wardId: string, wardName: string) => void;
  className?: string;
  error?: string;
  required?: boolean;
}

/**
 * Address Selector Component
 * 
 * Cascade dropdowns: Tỉnh/Thành → Quận/Huyện → Phường/Xã
 * Uses vietnam-seo-2.json data
 */
export function AddressSelector({
  province,
  district,
  ward,
  onProvinceChange,
  onDistrictChange,
  onWardChange,
  className,
  error,
  required = false,
}: AddressSelectorProps) {
  const [cities, setCities] = useState<City[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorState, setErrorState] = useState<string | null>(null);

  // Load cities on mount
  useEffect(() => {
    async function loadCities() {
      try {
        setLoading(true);
        setErrorState(null);
        const citiesData = await getCities();
        setCities(citiesData);
      } catch (err) {
        setErrorState('Không thể tải danh sách tỉnh thành');
        console.error('Error loading cities:', err);
      } finally {
        setLoading(false);
      }
    }

    loadCities();
  }, []);

  // Load districts when province changes
  useEffect(() => {
    async function loadDistricts() {
      if (!province) {
        setDistricts([]);
        setWards([]);
        return;
      }

      try {
        setLoading(true);
        const districtsData = await getDistrictsByCity(province);
        setDistricts(districtsData);
        // Reset ward when district changes
        setWards([]);
        if (district) {
          // If district was set, try to keep it if it exists in new list
          const existingDistrict = districtsData.find((d) => d.districtId === district);
          if (!existingDistrict) {
            onDistrictChange('', '');
            onWardChange('', '');
          }
        }
      } catch (err) {
        setErrorState('Không thể tải danh sách quận/huyện');
        console.error('Error loading districts:', err);
      } finally {
        setLoading(false);
      }
    }

    loadDistricts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [province]);

  // Load wards when district changes
  useEffect(() => {
    async function loadWards() {
      if (!province || !district) {
        setWards([]);
        return;
      }

      try {
        setLoading(true);
        const wardsData = await getWardsByDistrict(province, district);
        setWards(wardsData);
        // Reset ward selection if current ward doesn't exist in new list
        if (ward) {
          const existingWard = wardsData.find((w) => w.wardId === ward);
          if (!existingWard) {
            onWardChange('', '');
          }
        }
      } catch (err) {
        setErrorState('Không thể tải danh sách phường/xã');
        console.error('Error loading wards:', err);
      } finally {
        setLoading(false);
      }
    }

    loadWards();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [province, district]);

  const handleProvinceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const cityId = e.target.value;
    const selectedCity = cities.find((c) => c.cityId === cityId);
    if (selectedCity) {
      onProvinceChange(cityId, selectedCity.name);
      // Reset district and ward when province changes
      onDistrictChange('', '');
      onWardChange('', '');
    }
  };

  const handleDistrictChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const districtId = e.target.value;
    const selectedDistrict = districts.find((d) => d.districtId === districtId);
    if (selectedDistrict) {
      onDistrictChange(districtId, selectedDistrict.name);
      // Reset ward when district changes
      onWardChange('', '');
    }
  };

  const handleWardChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const wardId = e.target.value;
    const selectedWard = wards.find((w) => w.wardId === wardId);
    if (selectedWard) {
      onWardChange(wardId, selectedWard.name);
    }
  };

  if (errorState) {
    return (
      <div className={cn('text-sm text-destructive', className)}>
        {errorState}
      </div>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Tỉnh/Thành */}
      <div>
        <label className="block text-sm font-medium text-text-main mb-2">
          Tỉnh/Thành {required && '*'}
        </label>
        <Select
          value={province || ''}
          onChange={handleProvinceChange}
          required={required}
          disabled={loading}
          className={cn(error && 'border-destructive')}
        >
          <option value="">-- Chọn Tỉnh/Thành --</option>
          {cities.map((city) => (
            <option key={city.cityId} value={city.cityId}>
              {city.name}
            </option>
          ))}
        </Select>
        {error && <p className="text-xs text-destructive mt-1">{error}</p>}
      </div>

      {/* Quận/Huyện */}
      <div>
        <label className="block text-sm font-medium text-text-main mb-2">
          Quận/Huyện {required && '*'}
        </label>
        <Select
          value={district || ''}
          onChange={handleDistrictChange}
          required={required}
          disabled={loading || !province || districts.length === 0}
          className={cn(error && 'border-destructive')}
        >
          <option value="">-- Chọn Quận/Huyện --</option>
          {districts.map((d) => (
            <option key={d.districtId} value={d.districtId}>
              {d.name}
            </option>
          ))}
        </Select>
      </div>

      {/* Phường/Xã */}
      <div>
        <label className="block text-sm font-medium text-text-main mb-2">
          Phường/Xã {required && '*'}
        </label>
        <Select
          value={ward || ''}
          onChange={handleWardChange}
          required={required}
          disabled={loading || !province || !district || wards.length === 0}
          className={cn(error && 'border-destructive')}
        >
          <option value="">-- Chọn Phường/Xã --</option>
          {wards.map((w) => (
            <option key={w.wardId} value={w.wardId}>
              {w.name}
            </option>
          ))}
        </Select>
      </div>
    </div>
  );
}

