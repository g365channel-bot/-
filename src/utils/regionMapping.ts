/**
 * Standard 9-Region Structure and Province Mapping
 *
 * This module defines the 9-region administrative health model for Thailand (77 provinces).
 * Prepared for future region_admin structure without affecting existing 6-region Firestore data.
 */

export type StandardRegion9 =
  | 'ภาคเหนือบน'
  | 'ภาคเหนือล่าง'
  | 'ภาคกลาง'
  | 'ภาคตะวันออก'
  | 'ภาคตะวันตก'
  | 'ภาคอีสานบน'
  | 'ภาคอีสานล่าง'
  | 'ภาคใต้บน'
  | 'ภาคใต้ล่าง';

export const STANDARD_REGIONS_9: readonly StandardRegion9[] = [
  'ภาคเหนือบน',
  'ภาคเหนือล่าง',
  'ภาคกลาง',
  'ภาคตะวันออก',
  'ภาคตะวันตก',
  'ภาคอีสานบน',
  'ภาคอีสานล่าง',
  'ภาคใต้บน',
  'ภาคใต้ล่าง',
] as const;

/**
 * 77 Provinces categorized into exactly 9 regions
 */
export const PROVINCES_BY_REGION_9: Record<StandardRegion9, readonly string[]> = {
  ภาคเหนือบน: [
    'เชียงใหม่',
    'เชียงราย',
    'ลำพูน',
    'ลำปาง',
    'แม่ฮ่องสอน',
    'พะเยา',
    'แพร่',
    'น่าน',
  ],
  ภาคเหนือล่าง: [
    'อุตรดิตถ์',
    'พิษณุโลก',
    'สุโขทัย',
    'ตาก',
    'กำแพงเพชร',
    'พิจิตร',
    'เพชรบูรณ์',
    'นครสวรรค์',
    'อุทัยธานี',
  ],
  ภาคกลาง: [
    'กรุงเทพมหานคร',
    'นนทบุรี',
    'ปทุมธานี',
    'สมุทรปราการ',
    'พระนครศรีอยุธยา',
    'อ่างทอง',
    'ลพบุรี',
    'สิงห์บุรี',
    'ชัยนาท',
    'สระบุรี',
    'นครนายก',
    'นครปฐม',
  ],
  ภาคตะวันออก: [
    'ฉะเชิงเทรา',
    'ชลบุรี',
    'ระยอง',
    'จันทบุรี',
    'ตราด',
    'ปราจีนบุรี',
    'สระแก้ว',
  ],
  ภาคตะวันตก: [
    'กาญจนบุรี',
    'ราชบุรี',
    'สุพรรณบุรี',
    'เพชรบุรี',
    'ประจวบคีรีขันธ์',
    'สมุทรสาคร',
    'สมุทรสงคราม',
  ],
  ภาคอีสานบน: [
    'เลย',
    'หนองบัวลำภู',
    'อุดรธานี',
    'หนองคาย',
    'บึงกาฬ',
    'สกลนคร',
    'นครพนม',
    'ขอนแก่น',
    'กาฬสินธุ์',
    'มหาสารคาม',
    'ร้อยเอ็ด',
  ],
  ภาคอีสานล่าง: [
    'นครราชสีมา',
    'ชัยภูมิ',
    'บุรีรัมย์',
    'สุรินทร์',
    'ศรีสะเกษ',
    'อุบลราชธานี',
    'ยโสธร',
    'อำนาจเจริญ',
    'มุกดาหาร',
  ],
  ภาคใต้บน: [
    'ชุมพร',
    'ระนอง',
    'สุราษฎร์ธานี',
    'พังงา',
    'ภูเก็ต',
    'กระบี่',
    'นครศรีธรรมราช',
  ],
  ภาคใต้ล่าง: [
    'ตรัง',
    'พัทลุง',
    'สงขลา',
    'สตูล',
    'ปัตตานี',
    'ยะลา',
    'นราธิวาส',
  ],
};

/**
 * Direct lookup map: Province Name -> StandardRegion9
 */
export const PROVINCE_TO_REGION_9: Record<string, StandardRegion9> = (() => {
  const map: Record<string, StandardRegion9> = {};
  for (const region of STANDARD_REGIONS_9) {
    const provinceList = PROVINCES_BY_REGION_9[region];
    for (const province of provinceList) {
      map[province] = region;
    }
  }
  return map;
})();

/**
 * Helper to get 9-region standard from province name.
 * Handles inputs with or without 'จังหวัด' or 'จ.' prefix and whitespace.
 *
 * @param province - Province name in Thai (e.g., 'เชียงใหม่' or 'จังหวัดเชียงใหม่')
 * @returns StandardRegion9 | null
 */
export function getRegionFromProvince(province?: string | null): StandardRegion9 | null {
  if (!province || typeof province !== 'string') return null;

  const raw = province.trim();
  if (!raw) return null;

  // Direct lookup
  if (PROVINCE_TO_REGION_9[raw]) {
    return PROVINCE_TO_REGION_9[raw];
  }

  // Strip prefix 'จังหวัด' or 'จ.'
  const normalized = raw.replace(/^(จังหวัด|จ\.)\s*/, '').trim();
  if (PROVINCE_TO_REGION_9[normalized]) {
    return PROVINCE_TO_REGION_9[normalized];
  }

  return null;
}

/**
 * Validation check ensuring all 77 Thai provinces are mapped exactly once.
 */
export function validateProvinceRegionMapping(): {
  isValid: boolean;
  totalProvinces: number;
  duplicateProvinces: string[];
  missingProvinces: string[];
} {
  const seen = new Set<string>();
  const duplicates: string[] = [];

  for (const region of STANDARD_REGIONS_9) {
    const list = PROVINCES_BY_REGION_9[region];
    for (const p of list) {
      if (seen.has(p)) {
        duplicates.push(p);
      }
      seen.add(p);
    }
  }

  return {
    isValid: seen.size === 77 && duplicates.length === 0,
    totalProvinces: seen.size,
    duplicateProvinces: duplicates,
    missingProvinces: [],
  };
}
