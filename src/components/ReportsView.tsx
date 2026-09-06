import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import {
  currentBuddhistYear,
  getFilterYearOptions,
  formatBuddhistYearLabel,
} from '../utils/buddhistYear';
import {
  FileSpreadsheet,
  Download,
  Printer,
  FileText,
  Building,
  CheckCircle,
  AlertTriangle,
  HeartPulse,
  Filter,
  Search,
  Loader2,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { HEALTH_STATUS_LABELS, SMOKING_LABELS, FREQUENCY_LABELS } from '../types';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { getRegionFromProvince } from '../utils/regionMapping';

export const ReportsView: React.FC = () => {
  const { currentUser, temples, monks, healthChecks } = useApp();

  const [reportType, setReportType] = useState<'summary' | 'ncd_risk' | 'behavior' | 'roster'>('summary');
  const [selectedYear, setSelectedYear] = useState<number>(currentBuddhistYear);

  // Temporary Super Admin HealthCheck Region9 Audit State (Read-Only)
  interface HealthCheckAuditItem {
    id: string;
    monkId: string;
    year: number;
    templeId: string;
    templeName: string;
    templeProvince: string;
    currentRegion9?: string;
    expectedRegion9?: string | null;
    status: 'correct' | 'missing' | 'incorrect' | 'temple_not_found' | 'unmappable_temple_province';
  }

  interface HealthCheckAuditSummary {
    total: number;
    validCount: number;
    missingCount: number;
    incorrectCount: number;
    templeNotFoundCount: number;
    unmappableProvinceCount: number;
    problemItems: HealthCheckAuditItem[];
  }

  const [isAuditing, setIsAuditing] = useState(false);
  const [auditSummary, setAuditSummary] = useState<HealthCheckAuditSummary | null>(null);
  const [auditError, setAuditError] = useState<string | null>(null);

  const runHealthCheckRegion9Audit = async () => {
    setIsAuditing(true);
    setAuditError(null);
    try {
      let allHealthChecks: Array<{
        id: string;
        monkId: string;
        templeId: string;
        year: number;
        region9?: string;
      }> = [];

      const allTemplesMap = new Map<string, { id: string; name: string; province?: string }>();

      // Read directly from Firestore with authenticated Super Admin session
      try {
        const [checksSnap, templesSnap] = await Promise.all([
          getDocs(collection(db, 'healthChecks')),
          getDocs(collection(db, 'temples')),
        ]);

        checksSnap.forEach((docSnap) => {
          const d = docSnap.data();
          allHealthChecks.push({
            id: docSnap.id,
            monkId: d.monkId || '',
            templeId: d.templeId || '',
            year: d.year || 0,
            region9: d.region9 || undefined,
          });
        });

        templesSnap.forEach((docSnap) => {
          const d = docSnap.data();
          allTemplesMap.set(docSnap.id, {
            id: docSnap.id,
            name: d.name || '(ไม่มีชื่อวัด)',
            province: typeof d.province === 'string' ? d.province.trim() : '',
          });
        });
      } catch (fsErr: any) {
        console.warn('Direct Firestore read failed, using context data:', fsErr);
        allHealthChecks = healthChecks.map((hc) => ({
          id: hc.id,
          monkId: hc.monkId,
          templeId: hc.templeId,
          year: hc.year,
          region9: hc.region9,
        }));
      }

      // Also ensure any temples already in context are available
      temples.forEach((t) => {
        if (!allTemplesMap.has(t.id)) {
          allTemplesMap.set(t.id, {
            id: t.id,
            name: t.name,
            province: typeof t.province === 'string' ? t.province.trim() : '',
          });
        }
      });

      // If allHealthChecks is still empty but context has healthChecks, sync from context
      if (allHealthChecks.length === 0 && healthChecks.length > 0) {
        allHealthChecks = healthChecks.map((hc) => ({
          id: hc.id,
          monkId: hc.monkId,
          templeId: hc.templeId,
          year: hc.year,
          region9: hc.region9,
        }));
      }

      let validCount = 0;
      let missingCount = 0;
      let incorrectCount = 0;
      let templeNotFoundCount = 0;
      let unmappableProvinceCount = 0;
      const problemItems: HealthCheckAuditItem[] = [];

      allHealthChecks.forEach((hc) => {
        const temple = allTemplesMap.get(hc.templeId);
        const templeName = temple?.name || '(ไม่พบวัด)';
        const templeProvince = temple?.province || '';

        if (!temple) {
          templeNotFoundCount++;
          problemItems.push({
            id: hc.id,
            monkId: hc.monkId,
            year: hc.year,
            templeId: hc.templeId,
            templeName: '(ไม่พบวัดในระบบ)',
            templeProvince: '-',
            currentRegion9: hc.region9,
            expectedRegion9: null,
            status: 'temple_not_found',
          });
          return;
        }

        // Temple province is the Source of Truth: derive expectedRegion9 ONLY from temple.province
        // Do NOT derive from hc.region, hc.province, or monk.province!
        const expectedRegion9 = getRegionFromProvince(templeProvince);

        if (!expectedRegion9) {
          unmappableProvinceCount++;
          problemItems.push({
            id: hc.id,
            monkId: hc.monkId,
            year: hc.year,
            templeId: hc.templeId,
            templeName,
            templeProvince: templeProvince || '(ไม่มีจังหวัด)',
            currentRegion9: hc.region9,
            expectedRegion9: null,
            status: 'unmappable_temple_province',
          });
          return;
        }

        if (!hc.region9) {
          missingCount++;
          problemItems.push({
            id: hc.id,
            monkId: hc.monkId,
            year: hc.year,
            templeId: hc.templeId,
            templeName,
            templeProvince,
            currentRegion9: undefined,
            expectedRegion9,
            status: 'missing',
          });
        } else if (hc.region9 === expectedRegion9) {
          validCount++;
        } else {
          incorrectCount++;
          problemItems.push({
            id: hc.id,
            monkId: hc.monkId,
            year: hc.year,
            templeId: hc.templeId,
            templeName,
            templeProvince,
            currentRegion9: hc.region9,
            expectedRegion9,
            status: 'incorrect',
          });
        }
      });

      setAuditSummary({
        total: allHealthChecks.length,
        validCount,
        missingCount,
        incorrectCount,
        templeNotFoundCount,
        unmappableProvinceCount,
        problemItems,
      });
    } catch (err: any) {
      console.error('HealthCheck audit error:', err);
      setAuditError(err?.message || 'เกิดข้อผิดพลาดในการตรวจสอบข้อมูลผลตรวจสุขภาพ');
    } finally {
      setIsAuditing(false);
    }
  };
  const availableYears = useMemo(
    () => getFilterYearOptions(healthChecks.map((hc) => hc.year)),
    [healthChecks]
  );
  const [selectedTempleId, setSelectedTempleId] = useState<string>(() => {
    if (currentUser?.role === 'temple_admin' && currentUser.templeId) {
      return currentUser.templeId;
    }
    return 'all';
  });

  // Filtered Monks
  const filteredMonks = useMemo(() => {
    return monks.filter((m) => {
      if (currentUser?.role === 'temple_admin' && currentUser.templeId) {
        return m.templeId === currentUser.templeId;
      }
      if (selectedTempleId !== 'all' && m.templeId !== selectedTempleId) {
        return false;
      }
      return true;
    });
  }, [monks, currentUser, selectedTempleId]);

  const monkIds = useMemo(() => new Set(filteredMonks.map((m) => m.id)), [filteredMonks]);

  // Health checks in scope
  const yearChecks = useMemo(() => {
    return healthChecks.filter((hc) => hc.year === selectedYear && monkIds.has(hc.monkId));
  }, [healthChecks, selectedYear, monkIds]);

  const monkCheckMap = useMemo(() => {
    return new Map(yearChecks.map((c) => [c.monkId, c]));
  }, [yearChecks]);

  // Export CSV Handler
  const handleExportCSV = () => {
    let headers: string[] = [];
    let rows: string[][] = [];

    if (reportType === 'summary' || reportType === 'roster') {
      headers = [
        'ลำดับ',
        'รหัสพระสงฆ์',
        'ชื่อ-ฉายา',
        'อายุ',
        'พรรษา',
        'วัด',
        'จังหวัด',
        'ปีที่ตรวจ',
        'วันที่ตรวจ',
        'สถานะสุขภาพ',
        'BMI',
        'ความดันโลหิต',
        'น้ำตาลในเลือด',
        'Cholesterol',
        'โรคประจำตัว',
        'คำแนะนำ',
      ];

      rows = filteredMonks.map((m, idx) => {
        const c = monkCheckMap.get(m.id);
        const temple = temples.find((t) => t.id === m.templeId);
        return [
          String(idx + 1),
          m.id,
          `${m.name} (${m.monkName})`,
          String(m.age),
          String(m.monasticYears),
          temple?.name || m.templeId,
          m.province,
          c ? String(c.year) : 'ไม่ได้ตรวจ',
          c ? c.checkDate : '-',
          c ? HEALTH_STATUS_LABELS[c.healthStatus]?.label || c.healthStatus : 'ไม่ได้ตรวจ',
          c?.bmi ? String(c.bmi) : '-',
          c?.systolic && c?.diastolic ? `${c.systolic}/${c.diastolic}` : '-',
          c?.bloodSugar ? String(c.bloodSugar) : '-',
          c?.cholesterol ? String(c.cholesterol) : '-',
          c?.hasChronicDisease === 'has' ? (c.chronicDiseases?.join(';') || 'มี') : 'ไม่มี',
          c?.recommendation || '-',
        ];
      });
    } else if (reportType === 'ncd_risk') {
      headers = [
        'ลำดับ',
        'รหัสพระสงฆ์',
        'ชื่อ-ฉายา',
        'วัด',
        'สถานะสุขภาพ',
        'BMI',
        'รอบเอว(ซม.)',
        'ความดัน(mmHg)',
        'น้ำตาล(mg/dL)',
        'Cholesterol',
        'Creatinine',
        'eGFR',
        'โรคประจำตัว',
        'ควรติดตามผล',
      ];

      rows = yearChecks.map((c, idx) => {
        const m = monks.find((x) => x.id === c.monkId);
        const t = temples.find((x) => x.id === c.templeId);
        return [
          String(idx + 1),
          c.monkId,
          m ? `${m.name} (${m.monkName})` : '-',
          t?.name || c.templeId,
          HEALTH_STATUS_LABELS[c.healthStatus]?.label || c.healthStatus,
          c.bmi ? String(c.bmi) : '-',
          c.waist ? String(c.waist) : '-',
          c.systolic && c.diastolic ? `${c.systolic}/${c.diastolic}` : '-',
          c.bloodSugar ? String(c.bloodSugar) : '-',
          c.cholesterol ? String(c.cholesterol) : '-',
          c.creatinine ? String(c.creatinine) : '-',
          c.egfr ? String(c.egfr) : '-',
          c.hasChronicDisease === 'has' ? (c.chronicDiseases?.join(';') || 'มี') : 'ไม่มี',
          c.followUpRequired === 'yes' ? 'ควรติดตาม' : 'ปกติ',
        ];
      });
    } else {
      // Behavior report
      headers = [
        'ลำดับ',
        'รหัสพระสงฆ์',
        'ชื่อ-ฉายา',
        'วัด',
        'อาหารหวาน',
        'อาหารมัน',
        'อาหารเค็ม',
        'อาหารเผ็ด',
        'ออกกำลังกาย(วัน/สัปดาห์)',
        'เจริญสติ(วัน/สัปดาห์)',
        'สูบบุหรี่',
        'นอนหลับ(ชม./คืน)',
        'ฉันผักผลไม้',
      ];

      rows = yearChecks.map((c, idx) => {
        const m = monks.find((x) => x.id === c.monkId);
        const t = temples.find((x) => x.id === c.templeId);
        return [
          String(idx + 1),
          c.monkId,
          m ? `${m.name} (${m.monkName})` : '-',
          t?.name || c.templeId,
          FREQUENCY_LABELS[c.sweetFood],
          FREQUENCY_LABELS[c.fattyFood],
          FREQUENCY_LABELS[c.saltyFood],
          FREQUENCY_LABELS[c.spicyFood],
          String(c.exerciseDaysPerWeek),
          String(c.meditationDaysPerWeek),
          SMOKING_LABELS[c.smokingStatus],
          c.sleepHours,
          c.fruitVegetableFrequency,
        ];
      });
    }

    // Convert to CSV format with UTF-8 BOM for Excel in Thai
    const csvContent =
      '\uFEFF' +
      [headers.join(','), ...rows.map((r) => r.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(','))].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      `รายงานสุขภาพพระสงฆ์_${reportType}_ปี${selectedYear}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-xs border border-stone-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <FileSpreadsheet className="w-5 h-5 text-emerald-700" />
            <span className="text-xs font-bold text-stone-500 uppercase tracking-wider font-heading">
              ระบบออกรายงาน
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold font-heading text-stone-900 tracking-tight">
            รายงานสถิติและสรุปผลตรวจสุขภาพ
          </h1>
          <p className="text-stone-500 text-xs sm:text-sm">
            สำหรับวัด ผู้บริหาร หน่วยงานสาธารณสุข และโรงพยาบาลพี่เลี้ยง
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2 no-print">
          <button
            id="report-export-csv-btn"
            onClick={handleExportCSV}
            className="px-4 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer font-heading"
          >
            <Download className="w-4 h-4 text-amber-300" />
            <span>ส่งออก CSV (Excel)</span>
          </button>

          <button
            id="report-print-btn"
            onClick={handlePrint}
            className="px-4 py-2.5 bg-white border border-stone-300 hover:bg-stone-50 text-stone-700 text-xs font-semibold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Printer className="w-4 h-4 text-stone-500" />
            <span>พิมพ์รายงาน (Print)</span>
          </button>
        </div>
      </div>

      {/* Temporary Super Admin Read-Only HealthCheck Region9 Audit Section */}
      {currentUser?.role === 'super_admin' && (
        <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-xs border border-indigo-200 space-y-4 no-print">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-100">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-700">
                <Search className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold font-heading text-stone-900">
                    ตรวจสอบ Region9 ของผลตรวจสุขภาพ (เครื่องมือวินิจฉัยข้อมูลชั่วคราว)
                  </h2>
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-100 text-indigo-800">
                    Read-Only
                  </span>
                </div>
                <p className="text-xs text-stone-500">
                  ตรวจสอบความถูกต้องของฟิลด์ Region9 โดยอิงจังหวัดของวัด (Temple Province) เป็น Source of Truth
                </p>
              </div>
            </div>

            <button
              id="btn-audit-healthcheck-region9"
              onClick={runHealthCheckRegion9Audit}
              disabled={isAuditing}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold rounded-xl text-xs flex items-center gap-2 transition-colors cursor-pointer shadow-xs shrink-0 self-start sm:self-auto"
            >
              {isAuditing ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>กำลังตรวจสอบ...</span>
                </>
              ) : (
                <>
                  <Search className="w-3.5 h-3.5" />
                  <span>ตรวจสอบ Region9 ของผลตรวจสุขภาพ</span>
                </>
              )}
            </button>
          </div>

          {/* Actual Error Display */}
          {auditError && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">เกิดข้อผิดพลาดในการอ่านข้อมูล:</p>
                <p className="font-mono mt-0.5 text-[11px] break-all">{auditError}</p>
              </div>
            </div>
          )}

          {/* Audit Results Summary & Table */}
          {auditSummary && (
            <div className="space-y-4 pt-1">
              {/* 6 Summary Metric Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
                <div className="p-3 bg-stone-50 border border-stone-200 rounded-xl text-center">
                  <span className="block text-[11px] font-medium text-stone-500">จำนวนผลตรวจทั้งหมด</span>
                  <span className="block text-xl font-bold text-stone-900 mt-0.5">{auditSummary.total}</span>
                </div>
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-center">
                  <span className="block text-[11px] font-medium text-emerald-700">region9 ถูกต้อง</span>
                  <span className="block text-xl font-bold text-emerald-800 mt-0.5">{auditSummary.validCount}</span>
                </div>
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-center">
                  <span className="block text-[11px] font-medium text-amber-700">ยังไม่มี region9</span>
                  <span className="block text-xl font-bold text-amber-800 mt-0.5">{auditSummary.missingCount}</span>
                </div>
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-center">
                  <span className="block text-[11px] font-medium text-rose-700">region9 ไม่ตรง</span>
                  <span className="block text-xl font-bold text-rose-800 mt-0.5">{auditSummary.incorrectCount}</span>
                </div>
                <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl text-center">
                  <span className="block text-[11px] font-medium text-purple-700">ไม่พบวัดตาม templeId</span>
                  <span className="block text-xl font-bold text-purple-800 mt-0.5">{auditSummary.templeNotFoundCount}</span>
                </div>
                <div className="p-3 bg-orange-50 border border-orange-200 rounded-xl text-center">
                  <span className="block text-[11px] font-medium text-orange-700">จังหวัดของวัดไม่สามารถจับคู่ได้</span>
                  <span className="block text-xl font-bold text-orange-800 mt-0.5">{auditSummary.unmappableProvinceCount}</span>
                </div>
              </div>

              {/* Detail Table for missing, incorrect, unmappable, or missing-temple records */}
              {auditSummary.problemItems.length > 0 ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-stone-700">
                      รายการผลตรวจสุขภาพที่ต้องตรวจสอบ ({auditSummary.problemItems.length} รายการ):
                    </span>
                  </div>
                  <div className="overflow-x-auto rounded-xl border border-stone-200 max-h-72 overflow-y-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-stone-50 border-b border-stone-200 text-stone-600 sticky top-0">
                        <tr>
                          <th className="py-2.5 px-3 font-semibold">Document ID</th>
                          <th className="py-2.5 px-3 font-semibold">Monk ID</th>
                          <th className="py-2.5 px-3 font-semibold">ปี (พ.ศ.)</th>
                          <th className="py-2.5 px-3 font-semibold">ชื่อวัด</th>
                          <th className="py-2.5 px-3 font-semibold">จังหวัดของวัด</th>
                          <th className="py-2.5 px-3 font-semibold">Region9 ปัจจุบัน</th>
                          <th className="py-2.5 px-3 font-semibold">Region9 ที่ควรเป็น</th>
                          <th className="py-2.5 px-3 font-semibold">สถานะ</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-100">
                        {auditSummary.problemItems.map((item) => (
                          <tr key={item.id} className="hover:bg-stone-50/60">
                            <td className="py-2 px-3 font-mono text-[11px] text-stone-800 font-medium">{item.id}</td>
                            <td className="py-2 px-3 font-mono text-[11px] text-stone-600">{item.monkId || '-'}</td>
                            <td className="py-2 px-3 text-stone-800 font-medium">{item.year || '-'}</td>
                            <td className="py-2 px-3 text-stone-700">{item.templeName}</td>
                            <td className="py-2 px-3 text-stone-700">{item.templeProvince}</td>
                            <td className="py-2 px-3 text-stone-600">
                              {item.currentRegion9 ? (
                                <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-stone-100 text-stone-800">
                                  {item.currentRegion9}
                                </span>
                              ) : (
                                <span className="text-amber-600 italic">ยังไม่มี</span>
                              )}
                            </td>
                            <td className="py-2 px-3 font-medium">
                              {item.expectedRegion9 ? (
                                <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                                  {item.expectedRegion9}
                                </span>
                              ) : (
                                <span className="text-rose-600 italic">ไม่สามารถจับคู่ได้</span>
                              )}
                            </td>
                            <td className="py-2 px-3">
                              {item.status === 'missing' && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-800">
                                  ยังไม่มี region9
                                </span>
                              )}
                              {item.status === 'incorrect' && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-100 text-rose-800">
                                  region9 ไม่ตรง
                                </span>
                              )}
                              {item.status === 'temple_not_found' && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-100 text-purple-800">
                                  ไม่พบวัดตาม templeId
                                </span>
                              )}
                              {item.status === 'unmappable_temple_province' && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-orange-100 text-orange-800">
                                  จังหวัดของวัดไม่สามารถจับคู่ได้
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>ผลตรวจสุขภาพทุกรายการในระบบมี Region9 ครบถ้วนและถูกต้องตรงตามจังหวัดของวัด</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Filter and Report Type Selector */}
      <div className="bg-white rounded-2xl p-4 shadow-xs border border-stone-200 space-y-4 no-print">
        {/* Report Types Tabs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <button
            id="rep-tab-summary"
            onClick={() => setReportType('summary')}
            className={`p-3 rounded-xl text-left border transition-all ${
              reportType === 'summary'
                ? 'bg-emerald-800 text-white border-emerald-900 shadow-xs'
                : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
            }`}
          >
            <div className="text-xs font-bold font-heading">1. สรุปผลตรวจประจำปี</div>
            <div className={`text-[11px] mt-0.5 ${reportType === 'summary' ? 'text-emerald-200' : 'text-stone-400'}`}>
              ภาพรวมและผลการตรวจรายบุคคล
            </div>
          </button>

          <button
            id="rep-tab-ncd"
            onClick={() => setReportType('ncd_risk')}
            className={`p-3 rounded-xl text-left border transition-all ${
              reportType === 'ncd_risk'
                ? 'bg-emerald-800 text-white border-emerald-900 shadow-xs'
                : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
            }`}
          >
            <div className="text-xs font-bold font-heading">2. ความเสี่ยง NCDs</div>
            <div className={`text-[11px] mt-0.5 ${reportType === 'ncd_risk' ? 'text-emerald-200' : 'text-stone-400'}`}>
              เบาหวาน ความดัน ไขมัน ไต
            </div>
          </button>

          <button
            id="rep-tab-behavior"
            onClick={() => setReportType('behavior')}
            className={`p-3 rounded-xl text-left border transition-all ${
              reportType === 'behavior'
                ? 'bg-emerald-800 text-white border-emerald-900 shadow-xs'
                : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
            }`}
          >
            <div className="text-xs font-bold font-heading">3. พฤติกรรมสุขภาพ</div>
            <div className={`text-[11px] mt-0.5 ${reportType === 'behavior' ? 'text-emerald-200' : 'text-stone-400'}`}>
              อาหาร ออกกำลังกาย บุหรี่
            </div>
          </button>

          <button
            id="rep-tab-roster"
            onClick={() => setReportType('roster')}
            className={`p-3 rounded-xl text-left border transition-all ${
              reportType === 'roster'
                ? 'bg-emerald-800 text-white border-emerald-900 shadow-xs'
                : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
            }`}
          >
            <div className="text-xs font-bold font-heading">4. ทะเบียนพระสงฆ์</div>
            <div className={`text-[11px] mt-0.5 ${reportType === 'roster' ? 'text-emerald-200' : 'text-stone-400'}`}>
              รายชื่อ พรรษา และสถานะ
            </div>
          </button>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-stone-100">
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              ปีที่ตรวจสุขภาพ
            </label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-xs font-bold text-stone-800 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
            >
              {availableYears.map((yr) => (
                <option key={yr} value={yr}>
                  ประจำปี {formatBuddhistYearLabel(yr)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">พื้นที่ / วัด</label>
            <select
              value={selectedTempleId}
              disabled={currentUser?.role === 'temple_admin'}
              onChange={(e) => setSelectedTempleId(e.target.value)}
              className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-xs text-stone-800 focus:ring-2 focus:ring-emerald-600 focus:outline-none disabled:bg-stone-100 font-medium"
            >
              {currentUser?.role === 'super_admin' && <option value="all">ทุกวัดในระบบ</option>}
              {temples.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.province})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Printable Report Header */}
      <div className="bg-white rounded-2xl p-6 shadow-xs border border-stone-200 space-y-4 print:border-none print:shadow-none">
        <div className="text-center pb-4 border-b border-stone-200">
          <h2 className="text-lg font-bold font-heading text-stone-900">
            {reportType === 'summary' && `รายงานสรุปผลการตรวจสุขภาพพระสงฆ์ ประจำปี พ.ศ. ${selectedYear}`}
            {reportType === 'ncd_risk' && `รายงานการคัดกรองและเฝ้าระวังกลุ่มเสี่ยงโรค NCDs ประจำปี พ.ศ. ${selectedYear}`}
            {reportType === 'behavior' && `รายงานพฤติกรรมสุขภาพและการส่งเสริมสุขภาวะ ประจำปี พ.ศ. ${selectedYear}`}
            {reportType === 'roster' && `ทะเบียนรายชื่อพระสงฆ์และประวัติสุขภาพ ประจำปี พ.ศ. ${selectedYear}`}
          </h2>
          <p className="text-xs text-stone-600 mt-1">
            พื้นที่:{' '}
            <strong>
              {selectedTempleId === 'all'
                ? 'ภาพรวมทุกวัด'
                : temples.find((t) => t.id === selectedTempleId)?.name}
            </strong>{' '}
            | จำนวนพระสงฆ์ในรายงาน: <strong>{filteredMonks.length} รูป</strong> | ตรวจแล้ว:{' '}
            <strong>{yearChecks.length} รูป</strong>
          </p>
        </div>

        {/* Report Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse border border-stone-300">
            <thead>
              <tr className="bg-stone-100 text-stone-800 font-heading border-b border-stone-300">
                <th className="p-2 border border-stone-300 text-center w-10">ลำดับ</th>
                <th className="p-2 border border-stone-300 font-bold">รหัส</th>
                <th className="p-2 border border-stone-300 font-bold">ชื่อ - ฉายา</th>
                <th className="p-2 border border-stone-300 text-center">อายุ/พรรษา</th>
                <th className="p-2 border border-stone-300">วัดต้นสังกัด</th>

                {reportType === 'summary' && (
                  <>
                    <th className="p-2 border border-stone-300 text-center">สถานะ</th>
                    <th className="p-2 border border-stone-300 text-center">BMI</th>
                    <th className="p-2 border border-stone-300 text-center">BP (mmHg)</th>
                    <th className="p-2 border border-stone-300 text-center">FBS (mg/dL)</th>
                    <th className="p-2 border border-stone-300 text-center">Cholesterol</th>
                    <th className="p-2 border border-stone-300">โรคประจำตัว</th>
                  </>
                )}

                {reportType === 'ncd_risk' && (
                  <>
                    <th className="p-2 border border-stone-300 text-center">สถานะ</th>
                    <th className="p-2 border border-stone-300 text-center">รอบเอว</th>
                    <th className="p-2 border border-stone-300 text-center">BP</th>
                    <th className="p-2 border border-stone-300 text-center">FBS</th>
                    <th className="p-2 border border-stone-300 text-center">eGFR</th>
                    <th className="p-2 border border-stone-300 text-center">การติดตาม</th>
                  </>
                )}

                {reportType === 'behavior' && (
                  <>
                    <th className="p-2 border border-stone-300 text-center">ฉันหวาน</th>
                    <th className="p-2 border border-stone-300 text-center">ฉันมัน</th>
                    <th className="p-2 border border-stone-300 text-center">ออกกำลังกาย</th>
                    <th className="p-2 border border-stone-300 text-center">เจริญสติ</th>
                    <th className="p-2 border border-stone-300 text-center">สูบบุหรี่</th>
                  </>
                )}

                {reportType === 'roster' && (
                  <>
                    <th className="p-2 border border-stone-300">จังหวัด</th>
                    <th className="p-2 border border-stone-300 text-center">ตรวจปี {selectedYear}</th>
                    <th className="p-2 border border-stone-300 text-center">สถานะล่าสุด</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200">
              {filteredMonks.map((monk, idx) => {
                const c = monkCheckMap.get(monk.id);
                const temple = temples.find((t) => t.id === monk.templeId);

                return (
                  <tr key={monk.id} className="hover:bg-stone-50">
                    <td className="p-2 border border-stone-300 text-center text-stone-500">
                      {idx + 1}
                    </td>
                    <td className="p-2 border border-stone-300 font-mono font-bold text-stone-900">
                      {monk.id}
                    </td>
                    <td className="p-2 border border-stone-300 font-medium">
                      {monk.name} ({monk.monkName})
                    </td>
                    <td className="p-2 border border-stone-300 text-center">
                      {monk.age} / {monk.monasticYears}
                    </td>
                    <td className="p-2 border border-stone-300">
                      {temple?.name}
                    </td>

                    {reportType === 'summary' && (
                      <>
                        <td className="p-2 border border-stone-300 text-center font-bold">
                          {c ? (
                            <span className={HEALTH_STATUS_LABELS[c.healthStatus]?.color}>
                              {HEALTH_STATUS_LABELS[c.healthStatus]?.label}
                            </span>
                          ) : (
                            <span className="text-stone-400">ยังไม่ตรวจ</span>
                          )}
                        </td>
                        <td className="p-2 border border-stone-300 text-center">
                          {c?.bmi || '—'}
                        </td>
                        <td className="p-2 border border-stone-300 text-center">
                          {c?.systolic && c?.diastolic ? `${c.systolic}/${c.diastolic}` : '—'}
                        </td>
                        <td className="p-2 border border-stone-300 text-center">
                          {c?.bloodSugar || '—'}
                        </td>
                        <td className="p-2 border border-stone-300 text-center">
                          {c?.cholesterol || '—'}
                        </td>
                        <td className="p-2 border border-stone-300">
                          {c?.hasChronicDisease === 'has'
                            ? c.chronicDiseases?.join(', ')
                            : 'ไม่มี'}
                        </td>
                      </>
                    )}

                    {reportType === 'ncd_risk' && (
                      <>
                        <td className="p-2 border border-stone-300 text-center font-bold">
                          {c ? HEALTH_STATUS_LABELS[c.healthStatus]?.label : '—'}
                        </td>
                        <td className="p-2 border border-stone-300 text-center">
                          {c?.waist ? `${c.waist} ซม.` : '—'}
                        </td>
                        <td className="p-2 border border-stone-300 text-center">
                          {c?.systolic && c?.diastolic ? `${c.systolic}/${c.diastolic}` : '—'}
                        </td>
                        <td className="p-2 border border-stone-300 text-center">
                          {c?.bloodSugar || '—'}
                        </td>
                        <td className="p-2 border border-stone-300 text-center">
                          {c?.egfr || '—'}
                        </td>
                        <td className="p-2 border border-stone-300 text-center">
                          {c?.followUpRequired === 'yes' ? '⚠️ ควรติดตาม' : 'ปกติ'}
                        </td>
                      </>
                    )}

                    {reportType === 'behavior' && (
                      <>
                        <td className="p-2 border border-stone-300 text-center">
                          {c ? FREQUENCY_LABELS[c.sweetFood] : '—'}
                        </td>
                        <td className="p-2 border border-stone-300 text-center">
                          {c ? FREQUENCY_LABELS[c.fattyFood] : '—'}
                        </td>
                        <td className="p-2 border border-stone-300 text-center">
                          {c ? `${c.exerciseDaysPerWeek} วัน/สัปดาห์` : '—'}
                        </td>
                        <td className="p-2 border border-stone-300 text-center">
                          {c ? `${c.meditationDaysPerWeek} วัน/สัปดาห์` : '—'}
                        </td>
                        <td className="p-2 border border-stone-300 text-center">
                          {c ? SMOKING_LABELS[c.smokingStatus] : '—'}
                        </td>
                      </>
                    )}

                    {reportType === 'roster' && (
                      <>
                        <td className="p-2 border border-stone-300">
                          {monk.province}
                        </td>
                        <td className="p-2 border border-stone-300 text-center">
                          {c ? '✓ ตรวจแล้ว' : 'รอตรวจ'}
                        </td>
                        <td className="p-2 border border-stone-300 text-center">
                          {c ? HEALTH_STATUS_LABELS[c.healthStatus]?.label : '—'}
                        </td>
                      </>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer Signature Box for Print */}
        <div className="pt-8 grid grid-cols-2 gap-8 text-center text-xs text-stone-700">
          <div>
            <div className="h-12 border-b border-stone-300 w-48 mx-auto" />
            <p className="mt-2 font-semibold">เจ้าหน้าที่ผู้จัดทำรายงาน / ผู้ประสานงานวัด</p>
            <p className="text-[11px] text-stone-400 mt-0.5">วันที่ ............/............/............</p>
          </div>
          <div>
            <div className="h-12 border-b border-stone-300 w-48 mx-auto" />
            <p className="mt-2 font-semibold">เจ้าอาวาส / ผู้รับรองข้อมูล</p>
            <p className="text-[11px] text-stone-400 mt-0.5">วันที่ ............/............/............</p>
          </div>
        </div>
      </div>
    </div>
  );
};
