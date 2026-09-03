import { Temple, Monk, HealthCheck, User } from './types';

export const INITIAL_USERS: User[] = [
  {
    id: 'U001',
    email: 'admin@monkhealth.go.th',
    name: 'นายแพทย์สรวิชญ์ สิทธิชัย (ผู้ดูแลระบบกลาง)',
    role: 'super_admin',
  },
  {
    id: 'U002',
    email: 'wat.bowon@monkhealth.go.th',
    name: 'พระครูวินัยธร / ผู้ประสานงานวัดบวรนิเวศวิหาร',
    role: 'temple_admin',
    templeId: 'T01',
    templeName: 'วัดบวรนิเวศวิหาร',
  },
  {
    id: 'U003',
    email: 'wat.phrasingh@monkhealth.go.th',
    name: 'พระมหาพัฒนะ / ผู้ประสานงานวัดพระสิงห์ วรมหาวิหาร',
    role: 'temple_admin',
    templeId: 'T03',
    templeName: 'วัดพระสิงห์ วรมหาวิหาร',
  },
];

export const INITIAL_TEMPLES: Temple[] = [
  {
    id: 'T01',
    name: 'วัดบวรนิเวศวิหาร',
    subdistrict: 'บวรนิเวศ',
    district: 'พระนคร',
    province: 'กรุงเทพมหานคร',
    region: 'กลาง',
    abbotName: 'สมเด็จพระวันรัต',
    coordinatorName: 'พระมหาประสิทธิ์ ธมฺมรังสี',
    phone: '02-281-2831',
    healthServiceUnit: 'โรงพยาบาลสงฆ์',
    totalMonks: 12,
  },
  {
    id: 'T02',
    name: 'วัดมหาธาตุยุวราชรังสฤษฎิ์',
    subdistrict: 'พระบรมมหาราชวัง',
    district: 'พระนคร',
    province: 'กรุงเทพมหานคร',
    region: 'กลาง',
    abbotName: 'พระธรรมวชิรเมธี',
    coordinatorName: 'พระครูปลัดสุทิน',
    phone: '02-222-6011',
    healthServiceUnit: 'โรงพยาบาลศิริราช',
    totalMonks: 8,
  },
  {
    id: 'T03',
    name: 'วัดพระสิงห์ วรมหาวิหาร',
    subdistrict: 'พระสิงห์',
    district: 'เมืองเชียงใหม่',
    province: 'เชียงใหม่',
    region: 'เหนือ',
    abbotName: 'พระธรรมเสนาบดี',
    coordinatorName: 'พระครูสมุห์อนันต์',
    phone: '053-416-027',
    healthServiceUnit: 'โรงพยาบาลมหาราชนครเชียงใหม่',
    totalMonks: 9,
  },
  {
    id: 'T04',
    name: 'วัดเจดีย์หลวง วรวิหาร',
    subdistrict: 'พระสิงห์',
    district: 'เมืองเชียงใหม่',
    province: 'เชียงใหม่',
    region: 'เหนือ',
    abbotName: 'พระราชวชิรสิทธิ',
    coordinatorName: 'พระมหาบุญรอด',
    phone: '053-276-140',
    healthServiceUnit: 'โรงพยาบาลมหาราชนครเชียงใหม่',
    totalMonks: 6,
  },
  {
    id: 'T05',
    name: 'วัดพระนารายณ์มหาราช วรวิหาร',
    subdistrict: 'ในเมือง',
    district: 'เมืองนครราชสีมา',
    province: 'นครราชสีมา',
    region: 'ตะวันออกเฉียงเหนือ',
    abbotName: 'พระพรหมวชิรนายก',
    coordinatorName: 'พระครูวินัยธรสุพจน์',
    phone: '044-242-124',
    healthServiceUnit: 'โรงพยาบาลมหาราชนครราชสีมา',
    totalMonks: 6,
  },
  {
    id: 'T06',
    name: 'วัดศาลาลอย',
    subdistrict: 'โพธิ์กลาง',
    district: 'เมืองนครราชสีมา',
    province: 'นครราชสีมา',
    region: 'ตะวันออกเฉียงเหนือ',
    abbotName: 'พระครูโสภณธรรมวาที',
    coordinatorName: 'พระมหาคำดี',
    phone: '044-254-880',
    healthServiceUnit: 'ศูนย์บริการสาธารณสุขเทศบาลนครนครราชสีมา',
    totalMonks: 5,
  },
  {
    id: 'T07',
    name: 'วัดพระบรมธาตุไชยาราชวรวิหาร',
    subdistrict: 'เวียง',
    district: 'ไชยา',
    province: 'สุราษฎร์ธานี',
    region: 'ใต้',
    abbotName: 'พระธรรมวิมลโมลี',
    coordinatorName: 'พระครูสุตธรรมโสภิต',
    phone: '077-431-402',
    healthServiceUnit: 'โรงพยาบาลไชยา',
    totalMonks: 6,
  },
  {
    id: 'T08',
    name: 'วัดพัฒนาราม (วัดใหม่)',
    subdistrict: 'ตลาด',
    district: 'เมืองสุราษฎร์ธานี',
    province: 'สุราษฎร์ธานี',
    region: 'ใต้',
    abbotName: 'พระครูวิสุทธิ์สุตากร',
    coordinatorName: 'พระสมุห์ธเนศ',
    phone: '077-282-350',
    healthServiceUnit: 'โรงพยาบาลสุราษฎร์ธานี',
    totalMonks: 4,
  },
  {
    id: 'T09',
    name: 'วัดหนองแวง พระอารามหลวง',
    subdistrict: 'ในเมือง',
    district: 'เมืองขอนแก่น',
    province: 'ขอนแก่น',
    region: 'ตะวันออกเฉียงเหนือ',
    abbotName: 'พระมหาประจักษ์',
    coordinatorName: 'พระมหาถนอม',
    phone: '043-224-526',
    healthServiceUnit: 'โรงพยาบาลขอนแก่น',
    totalMonks: 5,
  },
  {
    id: 'T10',
    name: 'วัดป่าแสงอรุณ',
    subdistrict: 'พระลับ',
    district: 'เมืองขอนแก่น',
    province: 'ขอนแก่น',
    region: 'ตะวันออกเฉียงเหนือ',
    abbotName: 'พระเทพพุทธิมุนี',
    coordinatorName: 'พระครูสัญญาบัตรวิจิตร',
    phone: '043-241-789',
    healthServiceUnit: 'โรงพยาบาลศูนย์อนามัยที่ 7 ขอนแก่น',
    totalMonks: 4,
  },
];

// Helper to generate Monks and Health Checks
export function generateInitialData(): { monks: Monk[]; healthChecks: HealthCheck[] } {
  const monks: Monk[] = [];
  const healthChecks: HealthCheck[] = [];

  const rawMonkTemplates = [
    // Bangkok - Wat Bowon (T01)
    { id: 'M001', name: 'พระมหาไพโรจน์', monkName: 'กิตฺติญาโณ', age: 58, monasticYears: 36, templeId: 'T01', province: 'กรุงเทพมหานคร' },
    { id: 'M002', name: 'พระครูสมุห์วิเชียร', monkName: 'จนฺทวํโส', age: 64, monasticYears: 42, templeId: 'T01', province: 'กรุงเทพมหานคร' },
    { id: 'M003', name: 'พระสมบัติ', monkName: 'ปภสฺสโร', age: 45, monasticYears: 22, templeId: 'T01', province: 'กรุงเทพมหานคร' },
    { id: 'M004', name: 'พระมหาชวลิต', monkName: 'ชวนปญฺโญ', age: 52, monasticYears: 30, templeId: 'T01', province: 'กรุงเทพมหานคร' },
    { id: 'M005', name: 'พระมนตรี', monkName: 'สุจิตฺโต', age: 39, monasticYears: 15, templeId: 'T01', province: 'กรุงเทพมหานคร' },
    { id: 'M006', name: 'พระประเสริฐ', monkName: 'วฑฺฒโน', age: 71, monasticYears: 50, templeId: 'T01', province: 'กรุงเทพมหานคร' },
    { id: 'M007', name: 'พระอธิการธวัช', monkName: 'เตชปญฺโญ', age: 48, monasticYears: 25, templeId: 'T01', province: 'กรุงเทพมหานคร' },
    { id: 'M008', name: 'พระณรงค์', monkName: 'อภินนฺโท', age: 34, monasticYears: 10, templeId: 'T01', province: 'กรุงเทพมหานคร' },
    { id: 'M009', name: 'พระมหาศักดิ์ดา', monkName: 'เขมธมฺโม', age: 60, monasticYears: 38, templeId: 'T01', province: 'กรุงเทพมหานคร' },
    { id: 'M010', name: 'พระสุรชัย', monkName: 'ชุตินฺธโร', age: 42, monasticYears: 18, templeId: 'T01', province: 'กรุงเทพมหานคร' },
    { id: 'M011', name: 'พระเอกชัย', monkName: 'ภูริปญฺโญ', age: 29, monasticYears: 6, templeId: 'T01', province: 'กรุงเทพมหานคร' },
    { id: 'M012', name: 'พระบุญเลิศ', monkName: 'โสภโณ', age: 67, monasticYears: 44, templeId: 'T01', province: 'กรุงเทพมหานคร' },

    // Bangkok - Wat Mahathat (T02)
    { id: 'M013', name: 'พระครูสุทธิธรรม', monkName: 'ธมฺมกาโม', age: 62, monasticYears: 39, templeId: 'T02', province: 'กรุงเทพมหานคร' },
    { id: 'M014', name: 'พระอนุชา', monkName: 'อนาลโย', age: 50, monasticYears: 28, templeId: 'T02', province: 'กรุงเทพมหานคร' },
    { id: 'M015', name: 'พระมหาเฉลิม', monkName: 'จารุวณฺโณ', age: 46, monasticYears: 23, templeId: 'T02', province: 'กรุงเทพมหานคร' },
    { id: 'M016', name: 'พระธีรพล', monkName: 'ธีรปญฺโญ', age: 38, monasticYears: 14, templeId: 'T02', province: 'กรุงเทพมหานคร' },
    { id: 'M017', name: 'พระประสิทธิ์', monkName: 'สิริวฑฺฒโก', age: 55, monasticYears: 32, templeId: 'T02', province: 'กรุงเทพมหานคร' },
    { id: 'M018', name: 'พระวีระ', monkName: 'วีรชโย', age: 69, monasticYears: 47, templeId: 'T02', province: 'กรุงเทพมหานคร' },
    { id: 'M019', name: 'พระกมล', monkName: 'กมโล', age: 32, monasticYears: 8, templeId: 'T02', province: 'กรุงเทพมหานคร' },
    { id: 'M020', name: 'พระศิริ', monkName: 'ศิริวํโส', age: 41, monasticYears: 17, templeId: 'T02', province: 'กรุงเทพมหานคร' },

    // Chiang Mai - Wat Phra Singh (T03)
    { id: 'M021', name: 'พระครูวิจิตรธรรม', monkName: 'สิรินฺธโร', age: 57, monasticYears: 34, templeId: 'T03', province: 'เชียงใหม่' },
    { id: 'M022', name: 'พระคำรณ', monkName: 'ฐิตวีโร', age: 63, monasticYears: 40, templeId: 'T03', province: 'เชียงใหม่' },
    { id: 'M023', name: 'พระมหานิธิ', monkName: 'นิธิญาโณ', age: 44, monasticYears: 21, templeId: 'T03', province: 'เชียงใหม่' },
    { id: 'M024', name: 'พระดนัย', monkName: 'ธมฺมรโต', age: 36, monasticYears: 12, templeId: 'T03', province: 'เชียงใหม่' },
    { id: 'M025', name: 'พระสมบูรณ์', monkName: 'สมปุณฺโณ', age: 68, monasticYears: 46, templeId: 'T03', province: 'เชียงใหม่' },
    { id: 'M026', name: 'พระนรินทร์', monkName: 'นริสฺสโร', age: 49, monasticYears: 26, templeId: 'T03', province: 'เชียงใหม่' },
    { id: 'M027', name: 'พระจิรพงษ์', monkName: 'จิรวฑฺฒโน', age: 31, monasticYears: 7, templeId: 'T03', province: 'เชียงใหม่' },
    { id: 'M028', name: 'พระเกรียงไกร', monkName: 'เตชวโร', age: 53, monasticYears: 30, templeId: 'T03', province: 'เชียงใหม่' },
    { id: 'M029', name: 'พระสนิท', monkName: 'สนฺตจิตฺโต', age: 61, monasticYears: 38, templeId: 'T03', province: 'เชียงใหม่' },

    // Chiang Mai - Wat Chedi Luang (T04)
    { id: 'M030', name: 'พระมหาอุทัย', monkName: 'อุทโย', age: 54, monasticYears: 31, templeId: 'T04', province: 'เชียงใหม่' },
    { id: 'M031', name: 'พระพิภพ', monkName: 'ปภสฺสโร', age: 47, monasticYears: 24, templeId: 'T04', province: 'เชียงใหม่' },
    { id: 'M032', name: 'พระสมคิด', monkName: 'จิตฺตทนฺโต', age: 66, monasticYears: 43, templeId: 'T04', province: 'เชียงใหม่' },
    { id: 'M033', name: 'พระธวัชชัย', monkName: 'ชยธมฺโม', age: 37, monasticYears: 13, templeId: 'T04', province: 'เชียงใหม่' },
    { id: 'M034', name: 'พระอุดม', monkName: 'อุดมวโร', age: 59, monasticYears: 36, templeId: 'T04', province: 'เชียงใหม่' },
    { id: 'M035', name: 'พระปัญญา', monkName: 'ปญฺญาธโร', age: 30, monasticYears: 6, templeId: 'T04', province: 'เชียงใหม่' },

    // Nakhon Ratchasima - Wat Phra Narai (T05)
    { id: 'M036', name: 'พระครูสุนทรศีล', monkName: 'สีลสุทฺโธ', age: 65, monasticYears: 42, templeId: 'T05', province: 'นครราชสีมา' },
    { id: 'M037', name: 'พระมหาประสิทธิ์', monkName: 'ปิยวณฺโณ', age: 51, monasticYears: 28, templeId: 'T05', province: 'นครราชสีมา' },
    { id: 'M038', name: 'พระวิรัช', monkName: 'วิรโช', age: 43, monasticYears: 20, templeId: 'T05', province: 'นครราชสีมา' },
    { id: 'M039', name: 'พระอนันต์', monkName: 'อนนฺตชโย', age: 58, monasticYears: 35, templeId: 'T05', province: 'นครราชสีมา' },
    { id: 'M040', name: 'พระสุทัศน์', monkName: 'ทสฺสนีโย', age: 35, monasticYears: 11, templeId: 'T05', province: 'นครราชสีมา' },
    { id: 'M041', name: 'พระบุญช่วย', monkName: 'ปุญฺญกาโร', age: 72, monasticYears: 49, templeId: 'T05', province: 'นครราชสีมา' },

    // Nakhon Ratchasima - Wat Sala Loi (T06)
    { id: 'M042', name: 'พระมหาทองดี', monkName: 'สุวณฺโณ', age: 53, monasticYears: 30, templeId: 'T06', province: 'นครราชสีมา' },
    { id: 'M043', name: 'พระเสน่ห์', monkName: 'เมตฺตาจิตฺโต', age: 60, monasticYears: 37, templeId: 'T06', province: 'นครราชสีมา' },
    { id: 'M044', name: 'พระเชิดชัย', monkName: 'ชิตมาโร', age: 46, monasticYears: 22, templeId: 'T06', province: 'นครราชสีมา' },
    { id: 'M045', name: 'พระธนากร', monkName: 'ธนปาโล', age: 33, monasticYears: 9, templeId: 'T06', province: 'นครราชสีมา' },
    { id: 'M046', name: 'พระยงยุทธ', monkName: 'ยุตฺตธมฺโม', age: 64, monasticYears: 41, templeId: 'T06', province: 'นครราชสีมา' },

    // Surat Thani - Wat Chaiya (T07)
    { id: 'M047', name: 'พระครูวิมลคุณากร', monkName: 'คุณากโร', age: 66, monasticYears: 43, templeId: 'T07', province: 'สุราษฎร์ธานี' },
    { id: 'M048', name: 'พระมหาชัยพร', monkName: 'ชยวฑฺโฒ', age: 48, monasticYears: 25, templeId: 'T07', province: 'สุราษฎร์ธานี' },
    { id: 'M049', name: 'พระสมพงษ์', monkName: 'พงฺสวโร', age: 55, monasticYears: 32, templeId: 'T07', province: 'สุราษฎร์ธานี' },
    { id: 'M050', name: 'พระอำนวย', monkName: 'อภิปุญฺโญ', age: 62, monasticYears: 39, templeId: 'T07', province: 'สุราษฎร์ธานี' },
    { id: 'M051', name: 'พระพีรพัฒน์', monkName: 'ญาณวีโร', age: 34, monasticYears: 10, templeId: 'T07', province: 'สุราษฎร์ธานี' },
    { id: 'M052', name: 'พระกิตติ', monkName: 'กิตฺติธโร', age: 40, monasticYears: 16, templeId: 'T07', province: 'สุราษฎร์ธานี' },

    // Surat Thani - Wat Phatthanaram (T08)
    { id: 'M053', name: 'พระครูโสภิตธรรม', monkName: 'โสภิตวํโส', age: 59, monasticYears: 36, templeId: 'T08', province: 'สุราษฎร์ธานี' },
    { id: 'M054', name: 'พระธีรศักดิ์', monkName: 'ธีรวโร', age: 45, monasticYears: 21, templeId: 'T08', province: 'สุราษฎร์ธานี' },
    { id: 'M055', name: 'พระเจริญ', monkName: 'เจริญญาโณ', age: 67, monasticYears: 45, templeId: 'T08', province: 'สุราษฎร์ธานี' },
    { id: 'M056', name: 'พระกฤต', monkName: 'กิตฺติสทฺโธ', age: 36, monasticYears: 12, templeId: 'T08', province: 'สุราษฎร์ธานี' },

    // Khon Kaen - Wat Nong Waeng (T09)
    { id: 'M057', name: 'พระมหาคำภีร์', monkName: 'คมฺภีรปญฺโญ', age: 56, monasticYears: 33, templeId: 'T09', province: 'ขอนแก่น' },
    { id: 'M058', name: 'พระบุญมี', monkName: 'ปุญฺญวโร', age: 61, monasticYears: 38, templeId: 'T09', province: 'ขอนแก่น' },
    { id: 'M059', name: 'พระประมวล', monkName: 'มโนมโย', age: 49, monasticYears: 26, templeId: 'T09', province: 'ขอนแก่น' },
    { id: 'M060', name: 'พระสุวิทย์', monkName: 'วิชฺชากาโร', age: 42, monasticYears: 18, templeId: 'T09', province: 'ขอนแก่น' },
    { id: 'M061', name: 'พระกิตติพงษ์', monkName: 'พงฺสวฑฺฒโน', age: 35, monasticYears: 11, templeId: 'T09', province: 'ขอนแก่น' },

    // Khon Kaen - Wat Pa Saeng Arun (T10)
    { id: 'M062', name: 'พระครูภาวนานุศาสก์', monkName: 'ภาวนาภิรโต', age: 64, monasticYears: 41, templeId: 'T10', province: 'ขอนแก่น' },
    { id: 'M063', name: 'พระมหาณัฐพงษ์', monkName: 'ณฏฺฐวํโส', age: 47, monasticYears: 24, templeId: 'T10', province: 'ขอนแก่น' },
    { id: 'M064', name: 'พระสง่า', monkName: 'สงฺฆโสภโณ', age: 58, monasticYears: 35, templeId: 'T10', province: 'ขอนแก่น' },
    { id: 'M065', name: 'พระอดิศร', monkName: 'สุทธิญาโณ', age: 38, monasticYears: 14, templeId: 'T10', province: 'ขอนแก่น' },
  ];

  rawMonkTemplates.forEach((item) => {
    monks.push({
      id: item.id,
      name: item.name,
      monkName: item.monkName,
      age: item.age,
      monasticYears: item.monasticYears,
      templeId: item.templeId,
      province: item.province,
      createdAt: '2024-01-10T08:00:00.000Z',
      updatedAt: '2026-02-15T08:00:00.000Z',
    });
  });

  // Archetypes for realistic yearly progression (2567 -> 2568 -> 2569)
  // 1. Weight Loss & Health Improvement (Health Promotion campaign)
  // 2. Diabetic / Sugar Improvement
  // 3. Quit smoking & active exercise
  // 4. Stable Healthy / Normal group
  // 5. Aging / Risk Monitoring (Older monk needing checkup)
  // 6. Mild BP increase (Stress or Salt)
  // 7. Missing 2567 (ordained 2568)
  // 8. Missing 2569 (transferred or postponed)

  monks.forEach((m, idx) => {
    const temple = INITIAL_TEMPLES.find((t) => t.id === m.templeId);
    const serviceUnit = temple?.healthServiceUnit || 'หน่วยบริการสุขภาพชุมชน';
    const archetype = idx % 8;

    const baseHeight = 165 + ((idx * 3) % 15); // 165 - 180 cm

    // Years to generate for this monk
    let years = [2567, 2568, 2569];
    if (archetype === 6) {
      years = [2568, 2569]; // Newly joined
    } else if (archetype === 7) {
      years = [2567, 2568]; // Missed 2569
    }

    years.forEach((yr) => {
      let weight = 70;
      let waist = 88;
      let systolic = 125;
      let diastolic = 82;
      let bloodSugar = 105;
      let cholesterol = 195;
      let triglyceride = 140;
      let hdl = 48;
      let ldl = 120;
      let creatinine = 0.95;
      let egfr = 88;
      let uricAcid = 5.8;

      let hasChronic: 'none' | 'has' = 'none';
      let chronicList: string[] = [];
      let sweetFood: HealthCheck['sweetFood'] = 'sometimes';
      let fattyFood: HealthCheck['fattyFood'] = 'sometimes';
      let saltyFood: HealthCheck['saltyFood'] = 'sometimes';
      let spicyFood: HealthCheck['spicyFood'] = 'sometimes';
      let exerciseTypes: string[] = ['เดิน', 'กวาดลานวัด / ทำงานภายในวัด'];
      let exerciseDays = 3;
      let meditationDays = 5;
      let meditationDur: HealthCheck['meditationDuration'] = '31_60';
      let smoking: HealthCheck['smokingStatus'] = 'never';
      let cigs: number | null = null;
      let sleepHrs: HealthCheck['sleepHours'] = '7_8';
      let sleepQual: HealthCheck['sleepQuality'] = 'sufficient';
      let fruitVeg: HealthCheck['fruitVegetableFrequency'] = '3_4_days';
      let status: HealthCheck['healthStatus'] = 'normal';
      let followUp: 'no' | 'yes' = 'no';
      let recommendation = 'สุขภาพโดยรวมอยู่ในเกณฑ์ดี ปฏิบัติศาสนกิจและฉันภัตตาหารตามปกติ';

      if (archetype === 0) {
        // IMPROVEMENT: Weight & Waist decrease, reduced sweet food
        if (yr === 2567) {
          weight = 84;
          waist = 99;
          bloodSugar = 118;
          cholesterol = 225;
          sweetFood = 'often';
          fattyFood = 'often';
          exerciseDays = 2;
          status = 'risk';
          followUp = 'yes';
          recommendation = 'ควรปรับลดฉันของหวาน ของทอด และเพิ่มการเดินจงกรมหรือออกกำลังกายเบา ๆ';
        } else if (yr === 2568) {
          weight = 81;
          waist = 95;
          bloodSugar = 112;
          cholesterol = 210;
          sweetFood = 'sometimes';
          fattyFood = 'sometimes';
          exerciseDays = 4;
          status = 'monitor';
          followUp = 'yes';
          recommendation = 'น้ำหนักและรอบเอวเริ่มลดลง ปฏิบัติต่อเนื่อง';
        } else {
          weight = 77;
          waist = 91;
          bloodSugar = 104;
          cholesterol = 195;
          sweetFood = 'rarely';
          fattyFood = 'sometimes';
          exerciseDays = 5;
          status = 'normal';
          followUp = 'no';
          recommendation = 'ผลตรวจดีขึ้นอย่างเห็นได้ชัด น้ำหนักและน้ำตาลอยู่ในเกณฑ์ที่น่าพอใจ';
        }
      } else if (archetype === 1) {
        // DIABETIC CHRONIC / IMPROVEMENT
        hasChronic = 'has';
        chronicList = ['เบาหวาน', 'ความดันโลหิตสูง'];
        if (yr === 2567) {
          weight = 79;
          waist = 94;
          systolic = 144;
          diastolic = 92;
          bloodSugar = 148;
          cholesterol = 215;
          sweetFood = 'often';
          exerciseDays = 1;
          status = 'medical_attention';
          followUp = 'yes';
          recommendation = 'ระดับน้ำตาลและความดันสูง ควรพบแพทย์เพื่อปรับขนาดยาและคุมอาหารหวาน';
        } else if (yr === 2568) {
          weight = 76;
          waist = 91;
          systolic = 138;
          diastolic = 86;
          bloodSugar = 126;
          cholesterol = 200;
          sweetFood = 'sometimes';
          exerciseDays = 3;
          status = 'risk';
          followUp = 'yes';
          recommendation = 'น้ำตาลลดลงตามเป้าหมาย รับยาต่อเนื่องตามแพทย์สั่ง';
        } else {
          weight = 73;
          waist = 88;
          systolic = 130;
          diastolic = 82;
          bloodSugar = 114;
          cholesterol = 188;
          sweetFood = 'rarely';
          exerciseDays = 4;
          status = 'monitor';
          followUp = 'yes';
          recommendation = 'คุมน้ำตาลและความดันได้ดี โรคประจำตัวคงที่';
        }
      } else if (archetype === 2) {
        // QUIT SMOKING & EXERCISE INCREASE
        if (yr === 2567) {
          weight = 68;
          waist = 84;
          smoking = 'smoking';
          cigs = 8;
          exerciseDays = 1;
          exerciseTypes = ['ไม่ได้ออกกำลังกายเป็นประจำ'];
          sleepQual = 'barely';
          status = 'risk';
          followUp = 'yes';
          recommendation = 'แนะนำโครงการเลิกบุหรี่เพื่อสุขภาพปอดและหัวใจ';
        } else if (yr === 2568) {
          weight = 69;
          waist = 85;
          smoking = 'smoking';
          cigs = 2;
          exerciseDays = 3;
          exerciseTypes = ['เดิน', 'ยืดเหยียด / บริหารร่างกาย'];
          status = 'monitor';
          followUp = 'no';
          recommendation = 'ลดปริมาณบุหรี่ได้ดี มีการออกกำลังกายเพิ่มขึ้น';
        } else {
          weight = 70;
          waist = 84;
          smoking = 'quit';
          cigs = null;
          exerciseDays = 5;
          exerciseTypes = ['เดิน', 'ยืดเหยียด / บริหารร่างกาย', 'กวาดลานวัด / ทำงานภายในวัด'];
          sleepQual = 'sufficient';
          status = 'normal';
          followUp = 'no';
          recommendation = 'เลิกสูบบุหรี่สำเร็จ สุขภาพร่างกายและจิตใจแจ่มใส';
        }
      } else if (archetype === 3) {
        // CONSISTENTLY HEALTHY & ACTIVE
        weight = 64 + (idx % 8);
        waist = 79 + (idx % 6);
        systolic = 118;
        diastolic = 76;
        bloodSugar = 92;
        cholesterol = 175;
        sweetFood = 'rarely';
        fattyFood = 'rarely';
        saltyFood = 'sometimes';
        exerciseDays = 6;
        exerciseTypes = ['เดิน', 'กวาดลานวัด / ทำงานภายในวัด', 'โยคะ'];
        meditationDays = 7;
        meditationDur = 'more_60';
        status = 'normal';
        followUp = 'no';
        recommendation = 'สุขภาพแข็งแรง สมบูรณ์ดี มีวินัยในการฉันอาหารและปฏิบัติธรรม';
      } else if (archetype === 4) {
        // SENIOR MONK - RENAL / MONITORING
        hasChronic = 'has';
        chronicList = ['โรคข้อและกระดูก', 'ไขมันในเลือดสูง'];
        weight = 74;
        waist = 92;
        systolic = 136;
        diastolic = 84;
        bloodSugar = 108;
        cholesterol = 230;
        creatinine = 1.25;
        egfr = 62;
        uricAcid = 7.4;
        sweetFood = 'sometimes';
        saltyFood = 'often';
        exerciseTypes = ['ยืดเหยียด / บริหารร่างกาย'];
        exerciseDays = 2;
        sleepHrs = '5_6';
        status = 'monitor';
        followUp = 'yes';
        recommendation = 'ติดตามการทำงานของไตและระดับกรดยูริก หลีกเลี่ยงอาหารรสเค็มจัด';
      } else if (archetype === 5) {
        // MILD BP ELEVATION DUE TO HIGH SODIUM
        if (yr === 2567) {
          systolic = 126;
          diastolic = 80;
          saltyFood = 'sometimes';
          status = 'normal';
        } else if (yr === 2568) {
          systolic = 136;
          diastolic = 88;
          saltyFood = 'often';
          status = 'monitor';
          recommendation = 'ความดันโลหิตเริ่มสูงขึ้น ควรลดภัตตาหารรสเค็ม แกงกะทิ และของหมักดอง';
        } else {
          systolic = 142;
          diastolic = 92;
          saltyFood = 'regularly';
          status = 'risk';
          followUp = 'yes';
          recommendation = 'ความดันยังคงสูง ควรตรวจวัดความดันซ้ำและปรึกษาแพทย์';
        }
      } else {
        // STANDARD TYPICAL
        weight = 71;
        waist = 87;
        systolic = 122;
        diastolic = 80;
        bloodSugar = 98;
        cholesterol = 190;
        status = 'normal';
      }

      const heightM = baseHeight / 100;
      const bmi = parseFloat((weight / (heightM * heightM)).toFixed(1));

      const monthDay = (idx % 28) + 1;
      const dayStr = monthDay < 10 ? `0${monthDay}` : `${monthDay}`;
      const checkDate = `${yr - 543}-07-${dayStr}`;

      healthChecks.push({
        id: `HC-${yr}-${m.id}`,
        monkId: m.id,
        templeId: m.templeId,
        year: yr,
        checkDate: checkDate,
        healthServiceUnit: serviceUnit,
        weight,
        height: baseHeight,
        bmi,
        waist,
        systolic,
        diastolic,
        bloodSugar,
        cholesterol,
        triglyceride,
        hdl,
        ldl,
        creatinine,
        egfr,
        uricAcid,
        hasChronicDisease: hasChronic,
        chronicDiseases: chronicList,
        sweetFood,
        fattyFood,
        saltyFood,
        spicyFood,
        exerciseTypes,
        exerciseDaysPerWeek: exerciseDays,
        meditationDaysPerWeek: meditationDays,
        meditationDuration: meditationDur,
        smokingStatus: smoking,
        cigarettesPerDay: cigs,
        sleepHours: sleepHrs,
        sleepQuality: sleepQual,
        fruitVegetableFrequency: fruitVeg,
        healthStatus: status,
        followUpRequired: followUp,
        recommendation,
        createdAt: `${yr - 543}-07-${dayStr}T09:30:00.000Z`,
        updatedAt: `${yr - 543}-07-${dayStr}T10:00:00.000Z`,
      });
    });
  });

  return { monks, healthChecks };
}
