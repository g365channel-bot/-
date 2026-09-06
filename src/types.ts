import type { StandardRegion9 } from './utils/regionMapping';

export type UserRole = 'temple_admin' | 'region_admin' | 'super_admin';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  assignedRegion?: StandardRegion9;
  templeId?: string;
  templeName?: string;
}

export type Region = 'กลาง' | 'เหนือ' | 'ตะวันออกเฉียงเหนือ' | 'ใต้' | 'ตะวันออก' | 'ตะวันตก';

export interface Temple {
  id: string;
  name: string;
  subdistrict: string;
  district: string;
  province: string;
  region: Region;
  region9?: StandardRegion9;
  abbotName: string;
  coordinatorName: string;
  contactPerson?: string;
  phone: string;
  healthServiceUnit: string;
  totalMonks: number;
  status?: string;
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Monk {
  id: string; // monkId unique identifier
  name: string; // ชื่อ เช่น พระสมชาย, พระมหาไพโรจน์
  monkName: string; // ฉายา เช่น ฐิตธมฺโม, ชินวํโส
  birthDate?: string;
  age: number; // อายุ (ปี)
  monasticYears: number; // พรรษา
  templeId: string;
  province: string;
  region9?: StandardRegion9;
  createdAt: string;
  updatedAt: string;
}

export type FrequencyLevel = 'rarely' | 'sometimes' | 'often' | 'regularly';
export type HealthStatus = 'normal' | 'monitor' | 'risk' | 'medical_attention';
export type SmokingStatus = 'never' | 'quit' | 'smoking';
export type SleepDuration = 'less_5' | '5_6' | '7_8' | 'more_8';
export type SleepQuality = 'sufficient' | 'barely' | 'insufficient';
export type MeditationDuration = 'less_15' | '15_30' | '31_60' | 'more_60';
export type FruitVegFrequency = 'almost_never' | '1_2_days' | '3_4_days' | '5_6_days' | 'daily';

export interface HealthCheck {
  id: string;
  monkId: string;
  templeId: string;
  year: number; // ปี พ.ศ. เช่น 2569, 2570 เป็นต้น
  checkDate: string; // YYYY-MM-DD
  healthServiceUnit: string;

  // ส่วนที่ 2: ผลตรวจสุขภาพ
  weight?: number | null;
  height?: number | null;
  bmi?: number | null;
  waist?: number | null;
  systolic?: number | null;
  diastolic?: number | null;
  bloodSugar?: number | null;
  cholesterol?: number | null;
  triglyceride?: number | null;
  hdl?: number | null;
  ldl?: number | null;
  creatinine?: number | null;
  egfr?: number | null;
  uricAcid?: number | null;

  // ส่วนที่ 3: โรคประจำตัว
  hasChronicDisease: 'none' | 'has';
  chronicDiseases: string[];
  otherChronicDisease?: string | null;

  // ส่วนที่ 4: พฤติกรรมสุขภาพ
  sweetFood: FrequencyLevel;
  fattyFood: FrequencyLevel;
  saltyFood: FrequencyLevel;
  spicyFood: FrequencyLevel;
  exerciseTypes: string[];
  exerciseDaysPerWeek: number; // 0-7
  meditationDaysPerWeek: number; // 0-7
  meditationDuration: MeditationDuration;
  smokingStatus: SmokingStatus;
  cigarettesPerDay?: number | null;
  sleepHours: SleepDuration;
  sleepQuality: SleepQuality;
  fruitVegetableFrequency: FruitVegFrequency;

  // ส่วนสรุป
  healthStatus: HealthStatus;
  followUpRequired: 'no' | 'yes';
  recommendation?: string | null;

  // ข้อมูลวัดและสถานที่
  templeName?: string;
  province?: string;
  region?: string;
  region9?: StandardRegion9;

  createdAt: string;
  updatedAt: string;
}

export type ActiveTab =
  | 'dashboard'
  | 'health_entry'
  | 'monk_list'
  | 'monk_detail'
  | 'yearly_comparison'
  | 'reports'
  | 'guide'
  | 'temple_management';

export const HEALTH_STATUS_LABELS: Record<HealthStatus, { label: string; color: string; bg: string; border: string }> = {
  normal: { label: 'ปกติ', color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200' },
  monitor: { label: 'เฝ้าระวัง', color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200' },
  risk: { label: 'กลุ่มเสี่ยง', color: 'text-orange-700', bg: 'bg-orange-50', border: 'border-orange-200' },
  medical_attention: { label: 'ควรพบแพทย์', color: 'text-rose-700', bg: 'bg-rose-50', border: 'border-rose-200' },
};

export const FREQUENCY_LABELS: Record<FrequencyLevel, string> = {
  rarely: 'น้อย / ไม่ค่อย',
  sometimes: 'บางครั้ง',
  often: 'บ่อย',
  regularly: 'เป็นประจำ',
};

export const SMOKING_LABELS: Record<SmokingStatus, string> = {
  never: 'ไม่เคยสูบ',
  quit: 'เคยสูบ แต่เลิกแล้ว',
  smoking: 'ปัจจุบันยังสูบ',
};

export const SLEEP_HOURS_LABELS: Record<SleepDuration, string> = {
  less_5: 'น้อยกว่า 5 ชั่วโมง',
  '5_6': '5–6 ชั่วโมง',
  '7_8': '7–8 ชั่วโมง',
  more_8: 'มากกว่า 8 ชั่วโมง',
};

export const SLEEP_QUALITY_LABELS: Record<SleepQuality, string> = {
  sufficient: 'เพียงพอ',
  barely: 'ไม่ค่อยเพียงพอ',
  insufficient: 'ไม่เพียงพอ',
};

export const MEDITATION_DURATION_LABELS: Record<MeditationDuration, string> = {
  less_15: 'น้อยกว่า 15 นาที',
  '15_30': '15–30 นาที',
  '31_60': '31–60 นาที',
  more_60: 'มากกว่า 60 นาที',
};

export const FRUIT_VEG_LABELS: Record<FruitVegFrequency, string> = {
  almost_never: 'แทบไม่ฉัน',
  '1_2_days': '1–2 วัน/สัปดาห์',
  '3_4_days': '3–4 วัน/สัปดาห์',
  '5_6_days': '5–6 วัน/สัปดาห์',
  daily: 'ทุกวัน',
};

export const CHRONIC_DISEASE_OPTIONS = [
  'เบาหวาน',
  'ความดันโลหิตสูง',
  'ไขมันในเลือดสูง',
  'โรคหัวใจ',
  'โรคหลอดเลือด',
  'โรคไต',
  'โรคทางเดินหายใจ',
  'โรคข้อและกระดูก',
  'อื่น ๆ',
];

export const EXERCISE_OPTIONS = [
  'เดิน',
  'วิ่ง',
  'ปั่นจักรยาน',
  'ยืดเหยียด / บริหารร่างกาย',
  'โยคะ',
  'กวาดลานวัด / ทำงานภายในวัด',
  'ทำสวน / งานเกษตร',
  'อื่น ๆ',
  'ไม่ได้ออกกำลังกายเป็นประจำ',
];
