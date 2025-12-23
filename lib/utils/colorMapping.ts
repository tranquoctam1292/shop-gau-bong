/**
 * Color mapping utility for product color attributes
 * Maps Vietnamese color names/slugs to HEX color codes
 * 
 * This is a shared utility used by both ProductCard and ProductInfo components
 * to avoid code duplication (DRY principle).
 */

export const COLOR_MAP: Record<string, string> = {
  // Màu cơ bản
  'den': '#000000',
  'đen': '#000000',
  'do': '#EF4444',
  'đỏ': '#EF4444',
  'trang': '#FFFFFF',
  'trắng': '#FFFFFF',
  'vang': '#FCD34D',
  'vàng': '#FCD34D',
  'xam': '#9CA3AF',
  'xám': '#9CA3AF',
  'tim': '#8B5CF6',
  'tím': '#8B5CF6',
  // Tông Hồng (Rất quan trọng cho shop gấu)
  'hong': '#F472B6',
  'hồng': '#F472B6',
  'hong-dam': '#DB2777',
  'hồng đậm': '#DB2777',
  'hong-dậm': '#DB2777',
  'hong-nhat': '#FBCFE8',
  'hồng nhạt': '#FBCFE8',
  'hong-nhạt': '#FBCFE8',
  'hong-phan': '#FFB6C1', // Hồng Phấn (Light Pink)
  'hồng phấn': '#FFB6C1',
  'hong-phấn': '#FFB6C1',
  'hong-dao': '#FF69B4', // Hồng Đào (Hot Pink)
  'hồng đào': '#FF69B4',
  'hong-đào': '#FF69B4',
  'hong-canh-sen': '#FFB3BA', // Hồng Cánh Sen
  'hồng cánh sen': '#FFB3BA',
  'hong-cánh-sen': '#FFB3BA',
  'hong-pastel': '#FFD1DC', // Hồng Pastel
  'hồng pastel': '#FFD1DC',
  // Tông Nâu/Kem (Gấu Teddy)
  'kem': '#FDFBF7', // Màu kem ấm
  'nau': '#78350F',
  'nâu': '#78350F',
  'nau-nhat': '#B45309',
  'nâu nhạt': '#B45309',
  'nau-nhạt': '#B45309',
  'nau-dam': '#5D4037', // Nâu Đậm
  'nâu đậm': '#5D4037',
  'nau-đậm': '#5D4037',
  'nau-sua': '#D2B48C', // Nâu Sữa (Tan)
  'nâu sữa': '#D2B48C',
  'nau-sữa': '#D2B48C',
  'nau-cafe': '#6F4E37', // Nâu Cà Phê
  'nâu cà phê': '#6F4E37',
  'nau-cà-phê': '#6F4E37',
  'nau-ca-phe': '#6F4E37',
  // Tông Xanh
  'xanh-duong': '#3B82F6',
  'xanh dương': '#3B82F6',
  'xanh-dương': '#3B82F6',
  'xanh-la': '#10B981',
  'xanh lá': '#10B981',
  'xanh-lá': '#10B981',
  'xanh-nhat': '#93C5FD', // Xanh Nhạt
  'xanh nhạt': '#93C5FD',
  'xanh-nhạt': '#93C5FD',
  'xanh-dam': '#1E40AF', // Xanh Đậm
  'xanh đậm': '#1E40AF',
  'xanh-đậm': '#1E40AF',
  // Tông Vàng/Kem
  'vang-nhat': '#FEF3C7', // Vàng Nhạt
  'vàng nhạt': '#FEF3C7',
  'vang-nhạt': '#FEF3C7',
  'vang-dam': '#F59E0B', // Vàng Đậm
  'vàng đậm': '#F59E0B',
  'vang-đậm': '#F59E0B',
  // Tông Xám
  'xam-nhat': '#E5E7EB', // Xám Nhạt
  'xám nhạt': '#E5E7EB',
  'xam-nhạt': '#E5E7EB',
  'xam-dam': '#4B5563', // Xám Đậm
  'xám đậm': '#4B5563',
  'xam-đậm': '#4B5563',
};

/**
 * Normalize Vietnamese text: Remove diacritics (dấu) and convert to lowercase
 * Example: "Hồng Phấn" → "hong phan"
 */
function normalizeVietnamese(text: string): string {
  const vietnameseMap: Record<string, string> = {
    'à': 'a', 'á': 'a', 'ạ': 'a', 'ả': 'a', 'ã': 'a',
    'â': 'a', 'ầ': 'a', 'ấ': 'a', 'ậ': 'a', 'ẩ': 'a', 'ẫ': 'a',
    'ă': 'a', 'ằ': 'a', 'ắ': 'a', 'ặ': 'a', 'ẳ': 'a', 'ẵ': 'a',
    'è': 'e', 'é': 'e', 'ẹ': 'e', 'ẻ': 'e', 'ẽ': 'e',
    'ê': 'e', 'ề': 'e', 'ế': 'e', 'ệ': 'e', 'ể': 'e', 'ễ': 'e',
    'ì': 'i', 'í': 'i', 'ị': 'i', 'ỉ': 'i', 'ĩ': 'i',
    'ò': 'o', 'ó': 'o', 'ọ': 'o', 'ỏ': 'o', 'õ': 'o',
    'ô': 'o', 'ồ': 'o', 'ố': 'o', 'ộ': 'o', 'ổ': 'o', 'ỗ': 'o',
    'ơ': 'o', 'ờ': 'o', 'ớ': 'o', 'ợ': 'o', 'ở': 'o', 'ỡ': 'o',
    'ù': 'u', 'ú': 'u', 'ụ': 'u', 'ủ': 'u', 'ũ': 'u',
    'ư': 'u', 'ừ': 'u', 'ứ': 'u', 'ự': 'u', 'ử': 'u', 'ữ': 'u',
    'ỳ': 'y', 'ý': 'y', 'ỵ': 'y', 'ỷ': 'y', 'ỹ': 'y',
    'đ': 'd',
  };
  
  return text
    .toLowerCase()
    .split('')
    .map(char => vietnameseMap[char] || char)
    .join('')
    .trim();
}

/**
 * Get HEX color code from color slug/name
 * @param colorSlug - Color name or slug (e.g., "hong-dam", "Hồng Phấn", "HỒNG", "#DB2777")
 * @returns HEX color code or null if not found
 */
export function getColorHex(colorSlug: string): string | null {
  if (!colorSlug) return null;
  
  // If already a HEX color, return as is
  if (colorSlug.startsWith('#')) {
    return colorSlug;
  }
  
  // Step 1: Try exact match (case-insensitive)
  const exactMatch = colorSlug.toLowerCase().trim();
  if (COLOR_MAP[exactMatch]) {
    return COLOR_MAP[exactMatch];
  }
  
  // Step 2: Normalize Vietnamese and try multiple formats
  const normalized = normalizeVietnamese(colorSlug);
  
  // Try with dashes (e.g., "hong-phan")
  const withDashes = normalized.replace(/\s+/g, '-');
  if (COLOR_MAP[withDashes]) {
    return COLOR_MAP[withDashes];
  }
  
  // Try with spaces (e.g., "hong phan")
  const withSpaces = normalized.replace(/-/g, ' ');
  if (COLOR_MAP[withSpaces]) {
    return COLOR_MAP[withSpaces];
  }
  
  // Try without spaces/dashes (e.g., "hongphan")
  const withoutSpaces = normalized.replace(/[\s-]+/g, '');
  if (COLOR_MAP[withoutSpaces]) {
    return COLOR_MAP[withoutSpaces];
  }
  
  // Step 3: Try partial match (for compound colors like "Hồng Phấn")
  // Split by space/dash and try to find base color
  const parts = normalized.split(/[\s-]+/);
  if (parts.length > 1) {
    // Try first part (e.g., "hong" from "hong-phan")
    if (COLOR_MAP[parts[0]]) {
      return COLOR_MAP[parts[0]];
    }
    // Try last part (e.g., "phan" might map to "hong-phan")
    if (COLOR_MAP[parts[parts.length - 1]]) {
      return COLOR_MAP[parts[parts.length - 1]];
    }
  }
  
  // Step 4: Try fuzzy match - check if any key contains the normalized string
  const fuzzyMatch = Object.keys(COLOR_MAP).find(key => {
    const normalizedKey = normalizeVietnamese(key);
    return normalizedKey.includes(normalized) || normalized.includes(normalizedKey);
  });
  
  if (fuzzyMatch) {
    return COLOR_MAP[fuzzyMatch];
  }
  
  // Not found
  return null;
}

