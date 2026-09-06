import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import {
  currentBuddhistYear,
  getFilterYearOptions,
  formatBuddhistYearLabel,
} from '../utils/buddhistYear';
import {
  Building2,
  Users,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  HeartPulse,
  Filter,
  PlusCircle,
  ChevronRight,
  Sparkles,
  Stethoscope,
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  LineChart,
  Line,
  Legend,
} from 'recharts';

export const DashboardView: React.FC = () => {
  const {
    currentUser,
    temples,
    monks,
    healthChecks,
    setActiveTab,
    setPrefillHealthEntry,
  } = useApp();

  // Filters
  const [selectedYear, setSelectedYear] = useState<number>(currentBuddhistYear);
  const availableYears = useMemo(
    () => getFilterYearOptions(healthChecks.map((hc) => hc.year)),
    [healthChecks]
  );
  const [selectedRegion, setSelectedRegion] = useState<string>('all');
  const [selectedProvince, setSelectedProvince] = useState<string>('all');
  const [selectedTempleId, setSelectedTempleId] = useState<string>(() => {
    if (currentUser?.role === 'temple_admin' && currentUser.templeId) {
      return currentUser.templeId;
    }
    return 'all';
  });

  // Metric selector for Graph 4 (Yearly Trend)
  const [trendMetric, setTrendMetric] = useState<string>('normal');

  // Regions & Provinces options
  const regions = useMemo(() => {
    const set = new Set(temples.map((t) => t.region));
    return Array.from(set);
  }, [temples]);

  const provinces = useMemo(() => {
    let filteredTemples = temples;
    if (selectedRegion !== 'all') {
      filteredTemples = filteredTemples.filter((t) => t.region === selectedRegion);
    }
    const set = new Set(filteredTemples.map((t) => t.province));
    return Array.from(set);
  }, [temples, selectedRegion]);

  const filteredTemplesList = useMemo(() => {
    return temples.filter((t) => {
      if (currentUser?.role === 'temple_admin' && currentUser.templeId) {
        return t.id === currentUser.templeId;
      }
      if (selectedRegion !== 'all' && t.region !== selectedRegion) return false;
      if (selectedProvince !== 'all' && t.province !== selectedProvince) return false;
      return true;
    });
  }, [temples, selectedRegion, selectedProvince, currentUser]);

  // Filtered Monks in scope
  const filteredMonks = useMemo(() => {
    const templeIds = new Set(
      selectedTempleId !== 'all'
        ? [selectedTempleId]
        : filteredTemplesList.map((t) => t.id)
    );
    return monks.filter((m) => templeIds.has(m.templeId));
  }, [monks, selectedTempleId, filteredTemplesList]);

  // Filtered Health Checks for selected year in scope
  const yearChecks = useMemo(() => {
    const monkIds = new Set(filteredMonks.map((m) => m.id));
    return healthChecks.filter(
      (hc) => hc.year === selectedYear && monkIds.has(hc.monkId)
    );
  }, [healthChecks, selectedYear, filteredMonks]);

  // Stats Calculations
  const totalTemplesCount =
    selectedTempleId !== 'all' ? 1 : filteredTemplesList.length;
  const totalMonksCount = filteredMonks.length;
  const checkedMonksCount = yearChecks.length;
  const uncheckedMonksCount = Math.max(0, totalMonksCount - checkedMonksCount);
  const coveragePercent =
    totalMonksCount > 0
      ? Math.round((checkedMonksCount / totalMonksCount) * 100)
      : 0;

  const normalCount = yearChecks.filter((c) => c.healthStatus === 'normal').length;
  const monitorCount = yearChecks.filter((c) => c.healthStatus === 'monitor').length;
  const riskCount = yearChecks.filter((c) => c.healthStatus === 'risk').length;
  const medicalCount = yearChecks.filter((c) => c.healthStatus === 'medical_attention').length;

  const normalPct = checkedMonksCount > 0 ? Math.round((normalCount / checkedMonksCount) * 100) : 0;
  const monitorPct = checkedMonksCount > 0 ? Math.round((monitorCount / checkedMonksCount) * 100) : 0;
  const riskPct = checkedMonksCount > 0 ? Math.round((riskCount / checkedMonksCount) * 100) : 0;
  const medicalPct = checkedMonksCount > 0 ? Math.round((medicalCount / checkedMonksCount) * 100) : 0;

  // Graph 1: Health Status Donut
  const statusPieData = [
    { name: 'ปกติ', value: normalCount, color: '#059669', pct: normalPct },
    { name: 'เฝ้าระวัง', value: monitorCount, color: '#d97706', pct: monitorPct },
    { name: 'กลุ่มเสี่ยง', value: riskCount, color: '#ea580c', pct: riskPct },
    { name: 'ควรพบแพทย์', value: medicalCount, color: '#e11d48', pct: medicalPct },
  ].filter((d) => d.value > 0);

  // Graph 2: Highlight Health Findings (ผลตรวจที่น่าสนใจ)
  const findingsData = useMemo(() => {
    if (checkedMonksCount === 0) return [];
    const highBmi = yearChecks.filter((c) => (c.bmi || 0) >= 25).length;
    const highWaist = yearChecks.filter((c) => (c.waist || 0) >= 90).length;
    const highBP = yearChecks.filter(
      (c) => (c.systolic || 0) >= 140 || (c.diastolic || 0) >= 90
    ).length;
    const highSugar = yearChecks.filter((c) => (c.bloodSugar || 0) >= 126).length;
    const highChol = yearChecks.filter((c) => (c.cholesterol || 0) >= 200).length;
    const renalFollow = yearChecks.filter(
      (c) => (c.egfr && c.egfr < 60) || (c.creatinine && c.creatinine >= 1.2)
    ).length;

    return [
      { name: 'BMI สูง (≥25)', count: highBmi, pct: Math.round((highBmi / checkedMonksCount) * 100) },
      { name: 'รอบเอวเกิน (≥90 ซม.)', count: highWaist, pct: Math.round((highWaist / checkedMonksCount) * 100) },
      { name: 'ความดันโลหิตสูง', count: highBP, pct: Math.round((highBP / checkedMonksCount) * 100) },
      { name: 'น้ำตาลในเลือดสูง', count: highSugar, pct: Math.round((highSugar / checkedMonksCount) * 100) },
      { name: 'ไขมันในเลือดสูง', count: highChol, pct: Math.round((highChol / checkedMonksCount) * 100) },
      { name: 'การทำงานไตผิดปกติ', count: renalFollow, pct: Math.round((renalFollow / checkedMonksCount) * 100) },
    ];
  }, [yearChecks, checkedMonksCount]);

  // Graph 3: Health Behaviors (พฤติกรรมสุขภาพ)
  const behaviorData = useMemo(() => {
    if (checkedMonksCount === 0) return [];
    const sweet = yearChecks.filter((c) => c.sweetFood === 'often' || c.sweetFood === 'regularly').length;
    const fatty = yearChecks.filter((c) => c.fattyFood === 'often' || c.fattyFood === 'regularly').length;
    const salty = yearChecks.filter((c) => c.saltyFood === 'often' || c.saltyFood === 'regularly').length;
    const spicy = yearChecks.filter((c) => c.spicyFood === 'often' || c.spicyFood === 'regularly').length;
    const exercise3Days = yearChecks.filter((c) => c.exerciseDaysPerWeek >= 3).length;
    const meditation5Days = yearChecks.filter((c) => c.meditationDaysPerWeek >= 5).length;
    const smoking = yearChecks.filter((c) => c.smokingStatus === 'smoking').length;
    const sleepLack = yearChecks.filter((c) => c.sleepQuality === 'insufficient' || c.sleepHours === 'less_5').length;

    return [
      { label: 'ฉันหวานบ่อย/ประจำ', count: sweet, pct: Math.round((sweet / checkedMonksCount) * 100), color: '#f59e0b' },
      { label: 'ฉันมันบ่อย/ประจำ', count: fatty, pct: Math.round((fatty / checkedMonksCount) * 100), color: '#f59e0b' },
      { label: 'ฉันเค็มบ่อย/ประจำ', count: salty, pct: Math.round((salty / checkedMonksCount) * 100), color: '#f59e0b' },
      { label: 'ฉันรสจัดบ่อย/ประจำ', count: spicy, pct: Math.round((spicy / checkedMonksCount) * 100), color: '#f59e0b' },
      { label: 'ออกกำลังกาย ≥3 วัน/สัปดาห์', count: exercise3Days, pct: Math.round((exercise3Days / checkedMonksCount) * 100), color: '#10b981' },
      { label: 'เจริญสติ/สมาธิ ≥5 วัน/สัปดาห์', count: meditation5Days, pct: Math.round((meditation5Days / checkedMonksCount) * 100), color: '#059669' },
      { label: 'สูบบุหรี่', count: smoking, pct: Math.round((smoking / checkedMonksCount) * 100), color: '#ef4444' },
      { label: 'พักผ่อนไม่เพียงพอ', count: sleepLack, pct: Math.round((sleepLack / checkedMonksCount) * 100), color: '#f97316' },
    ];
  }, [yearChecks, checkedMonksCount]);

  // Graph 4: Yearly Trend
  const trendYears = useMemo(() => {
    const endYear = selectedYear || currentBuddhistYear;
    return [endYear - 2, endYear - 1, endYear];
  }, [selectedYear]);

  const yearlyTrendData = useMemo(() => {
    const monkIds = new Set(filteredMonks.map((m) => m.id));

    return trendYears.map((yr) => {
      const checks = healthChecks.filter((hc) => hc.year === yr && monkIds.has(hc.monkId));
      const total = checks.length;
      if (total === 0) {
        return { year: `ปี ${yr}`, value: 0, count: 0 };
      }

      let metricVal = 0;
      let unit = '%';

      if (trendMetric === 'normal') {
        const c = checks.filter((x) => x.healthStatus === 'normal').length;
        metricVal = Math.round((c / total) * 100);
      } else if (trendMetric === 'risk') {
        const c = checks.filter((x) => x.healthStatus === 'risk' || x.healthStatus === 'medical_attention').length;
        metricVal = Math.round((c / total) * 100);
      } else if (trendMetric === 'bmi') {
        const valid = checks.filter((x) => x.bmi);
        const avg = valid.reduce((sum, x) => sum + (x.bmi || 0), 0) / (valid.length || 1);
        metricVal = parseFloat(avg.toFixed(1));
        unit = 'กก./ม.²';
      } else if (trendMetric === 'waist') {
        const valid = checks.filter((x) => x.waist);
        const avg = valid.reduce((sum, x) => sum + (x.waist || 0), 0) / (valid.length || 1);
        metricVal = parseFloat(avg.toFixed(1));
        unit = 'ซม.';
      } else if (trendMetric === 'sugar') {
        const valid = checks.filter((x) => x.bloodSugar);
        const avg = valid.reduce((sum, x) => sum + (x.bloodSugar || 0), 0) / (valid.length || 1);
        metricVal = Math.round(avg);
        unit = 'มก./ดล.';
      } else if (trendMetric === 'smoking') {
        const c = checks.filter((x) => x.smokingStatus === 'smoking').length;
        metricVal = Math.round((c / total) * 100);
      } else if (trendMetric === 'exercise') {
        const c = checks.filter((x) => x.exerciseDaysPerWeek >= 3).length;
        metricVal = Math.round((c / total) * 100);
      }

      return {
        year: `พ.ศ. ${yr}`,
        value: metricVal,
        totalChecked: total,
        unit,
      };
    });
  }, [filteredMonks, healthChecks, trendMetric]);

  const handleStartEntry = () => {
    setPrefillHealthEntry({
      year: selectedYear,
      templeId: selectedTempleId !== 'all' ? selectedTempleId : (currentUser?.role === 'temple_admin' ? currentUser.templeId : undefined),
    });
    setActiveTab('health_entry');
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner / Call to Action */}
      <div className="bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-800 rounded-2xl text-white p-5 sm:p-6 shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="bg-amber-400 text-stone-900 text-[11px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider font-heading">
              สรุปภาพรวม
            </span>
            <span className="text-emerald-200 text-xs font-mono">
              ข้อมูลประจำปี พ.ศ. {selectedYear}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold font-heading text-white tracking-tight">
            แดชบอร์ดสถานการณ์สุขภาพพระสงฆ์
          </h1>
          <p className="text-emerald-100 text-xs sm:text-sm max-w-2xl leading-relaxed">
            ติดตามและสรุปผลตรวจสุขภาพประจำปี เพื่อส่งเสริมสุขภาวะที่ดีอย่างยั่งยืน
          </p>
        </div>

        <button
          id="dashboard-record-btn"
          onClick={handleStartEntry}
          className="px-4 py-2.5 bg-amber-400 hover:bg-amber-300 text-stone-900 font-bold rounded-xl text-sm flex items-center gap-2 shadow-md transition-all hover:scale-[1.02] cursor-pointer shrink-0 font-heading"
        >
          <PlusCircle className="w-5 h-5 text-stone-900" />
          <span>+ บันทึกผลตรวจสุขภาพ</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-2xl p-4 shadow-xs border border-stone-200">
        <div className="flex items-center gap-2 text-stone-700 font-semibold text-xs mb-3 pb-2 border-b border-stone-100">
          <Filter className="w-4 h-4 text-emerald-700" />
          <span>ตัวกรองพื้นที่และปีตรวจสุขภาพ</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Year Filter */}
          <div>
            <label className="block text-xs font-medium text-stone-500 mb-1">
              ปีที่ตรวจสุขภาพ
            </label>
            <select
              id="filter-year-select"
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="w-full bg-stone-50 border border-stone-300 rounded-lg px-3 py-2 text-sm font-semibold text-stone-800 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
            >
              {availableYears.map((yr) => (
                <option key={yr} value={yr}>
                  {formatBuddhistYearLabel(yr)}
                </option>
              ))}
            </select>
          </div>

          {/* Region Filter (Disabled for temple admin) */}
          <div>
            <label className="block text-xs font-medium text-stone-500 mb-1">ภาค</label>
            <select
              id="filter-region-select"
              value={selectedRegion}
              disabled={currentUser?.role === 'temple_admin'}
              onChange={(e) => {
                setSelectedRegion(e.target.value);
                setSelectedProvince('all');
                setSelectedTempleId('all');
              }}
              className="w-full bg-stone-50 border border-stone-300 rounded-lg px-3 py-2 text-sm text-stone-800 focus:ring-2 focus:ring-emerald-600 focus:outline-none disabled:bg-stone-100 disabled:text-stone-400"
            >
              <option value="all">ทุกภาคทั่วประเทศ</option>
              {regions.map((r) => (
                <option key={r} value={r}>
                  ภาค{r}
                </option>
              ))}
            </select>
          </div>

          {/* Province Filter */}
          <div>
            <label className="block text-xs font-medium text-stone-500 mb-1">จังหวัด</label>
            <select
              id="filter-province-select"
              value={selectedProvince}
              disabled={currentUser?.role === 'temple_admin'}
              onChange={(e) => {
                setSelectedProvince(e.target.value);
                setSelectedTempleId('all');
              }}
              className="w-full bg-stone-50 border border-stone-300 rounded-lg px-3 py-2 text-sm text-stone-800 focus:ring-2 focus:ring-emerald-600 focus:outline-none disabled:bg-stone-100 disabled:text-stone-400"
            >
              <option value="all">ทุกจังหวัด</option>
              {provinces.map((p) => (
                <option key={p} value={p}>
                  จังหวัด{p}
                </option>
              ))}
            </select>
          </div>

          {/* Temple Filter */}
          <div>
            <label className="block text-xs font-medium text-stone-500 mb-1">วัด</label>
            <select
              id="filter-temple-select"
              value={selectedTempleId}
              disabled={currentUser?.role === 'temple_admin'}
              onChange={(e) => setSelectedTempleId(e.target.value)}
              className="w-full bg-stone-50 border border-stone-300 rounded-lg px-3 py-2 text-sm text-stone-800 focus:ring-2 focus:ring-emerald-600 focus:outline-none disabled:bg-stone-100 disabled:text-stone-400 font-medium"
            >
              {currentUser?.role === 'super_admin' && <option value="all">ทุกวัดในพื้นที่</option>}
              {filteredTemplesList.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.province})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Summary Stat Cards - Big Numbers */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        {/* Total Temples */}
        <div className="bg-white rounded-2xl p-4 border border-stone-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-xs font-semibold">จำนวนวัด</span>
            <Building2 className="w-4 h-4 text-stone-400" />
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-bold font-heading text-stone-900">
              {totalTemplesCount}
            </div>
            <div className="text-[11px] text-stone-500 mt-0.5">แห่งในพื้นที่ที่เลือก</div>
          </div>
        </div>

        {/* Total Monks */}
        <div className="bg-white rounded-2xl p-4 border border-stone-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-xs font-semibold">พระสงฆ์ทั้งหมด</span>
            <Users className="w-4 h-4 text-emerald-600" />
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-bold font-heading text-stone-900">
              {totalMonksCount}
            </div>
            <div className="text-[11px] text-stone-500 mt-0.5">รูปในทะเบียน</div>
          </div>
        </div>

        {/* Checked Monks */}
        <div className="bg-white rounded-2xl p-4 border border-emerald-200 bg-emerald-50/40 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-emerald-800 mb-2">
            <span className="text-xs font-semibold">ตรวจสุขภาพแล้ว</span>
            <CheckCircle className="w-4 h-4 text-emerald-600" />
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-bold font-heading text-emerald-900">
              {checkedMonksCount}
            </div>
            <div className="text-[11px] text-emerald-700 mt-0.5 font-medium">
              คิดเป็น {coveragePercent}% ของทั้งหมด
            </div>
          </div>
        </div>

        {/* Unchecked Monks */}
        <div className="bg-white rounded-2xl p-4 border border-stone-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-xs font-semibold">ยังไม่ได้ตรวจ</span>
            <AlertCircle className="w-4 h-4 text-amber-500" />
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-bold font-heading text-stone-700">
              {uncheckedMonksCount}
            </div>
            <div className="text-[11px] text-amber-700 mt-0.5 font-medium">
              รอตรวจเพิ่มในปีนี้
            </div>
          </div>
        </div>

        {/* Coverage Percentage */}
        <div className="bg-gradient-to-br from-emerald-800 to-teal-900 text-white rounded-2xl p-4 shadow-xs flex flex-col justify-between col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between text-emerald-200 mb-2">
            <span className="text-xs font-semibold">ความครอบคลุม</span>
            <TrendingUp className="w-4 h-4 text-amber-300" />
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-bold font-heading text-amber-300">
              {coveragePercent}%
            </div>
            <div className="text-[11px] text-emerald-100 mt-0.5">
              เป้าหมาย &gt; 80%
            </div>
          </div>
        </div>
      </div>

      {/* Health Status 4 Breakdown Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        {/* Normal */}
        <div className="bg-emerald-50/80 border border-emerald-200 rounded-2xl p-4">
          <div className="text-xs font-bold text-emerald-800 font-heading flex items-center justify-between">
            <span>กลุ่มปกติ</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-200/80 text-emerald-900 font-mono">
              {normalPct}%
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-bold font-heading text-emerald-900 mt-2">
            {normalCount} <span className="text-sm font-normal text-emerald-700">รูป</span>
          </div>
          <p className="text-[11px] text-emerald-700 mt-1">ผลตรวจอยู่ในเกณฑ์มาตรฐาน</p>
        </div>

        {/* Monitor */}
        <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-4">
          <div className="text-xs font-bold text-amber-800 font-heading flex items-center justify-between">
            <span>กลุ่มเฝ้าระวัง</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-amber-200/80 text-amber-900 font-mono">
              {monitorPct}%
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-bold font-heading text-amber-900 mt-2">
            {monitorCount} <span className="text-sm font-normal text-amber-700">รูป</span>
          </div>
          <p className="text-[11px] text-amber-700 mt-1">ค่าเริ่มสูง ปรับพฤติกรรม</p>
        </div>

        {/* Risk */}
        <div className="bg-orange-50/80 border border-orange-200 rounded-2xl p-4">
          <div className="text-xs font-bold text-orange-800 font-heading flex items-center justify-between">
            <span>กลุ่มเสี่ยง</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-orange-200/80 text-orange-900 font-mono">
              {riskPct}%
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-bold font-heading text-orange-900 mt-2">
            {riskCount} <span className="text-sm font-normal text-orange-700">รูป</span>
          </div>
          <p className="text-[11px] text-orange-700 mt-1">มีความเสี่ยงโรคเรื้อรัง (NCDs)</p>
        </div>

        {/* Medical Attention */}
        <div className="bg-rose-50/80 border border-rose-200 rounded-2xl p-4">
          <div className="text-xs font-bold text-rose-800 font-heading flex items-center justify-between">
            <span>ควรพบแพทย์</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-rose-200/80 text-rose-900 font-mono">
              {medicalPct}%
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-bold font-heading text-rose-900 mt-2">
            {medicalCount} <span className="text-sm font-normal text-rose-700">รูป</span>
          </div>
          <p className="text-[11px] text-rose-700 mt-1">ควรส่งต่อตรวจวินิจฉัย</p>
        </div>
      </div>

      {/* 4 Dashboard Graphs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Graph 1: Health Status Donut */}
        <div className="bg-white rounded-2xl p-5 shadow-xs border border-stone-200 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="text-base font-bold font-heading text-stone-900">
                กราฟที่ 1: สถานะสุขภาพพระสงฆ์
              </h3>
              <p className="text-xs text-stone-500">
                สัดส่วนการจำแนกกลุ่มสุขภาพประจำปี {selectedYear}
              </p>
            </div>
            <span className="text-xs bg-stone-100 text-stone-600 px-2.5 py-1 rounded-full font-mono font-medium">
              รวม {checkedMonksCount} รูป
            </span>
          </div>

          <div className="h-64 sm:h-72 w-full flex items-center justify-center">
            {checkedMonksCount > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusPieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={95}
                    paddingAngle={3}
                  >
                    {statusPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val: number, name: string) => [
                      `${val} รูป (${Math.round((val / checkedMonksCount) * 100)}%)`,
                      name,
                    ]}
                  />
                  <Legend
                    formatter={(value) => (
                      <span className="text-xs text-stone-700 font-medium">{value}</span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center text-stone-400 text-sm py-12">
                ยังไม่มีข้อมูลผลตรวจสุขภาพในปี {selectedYear}
              </div>
            )}
          </div>

          <div className="grid grid-cols-4 gap-2 pt-3 border-t border-stone-100 text-center text-xs">
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-800">
              <div className="font-bold">{normalCount} รูป</div>
              <div className="text-[10px] text-emerald-600">ปกติ ({normalPct}%)</div>
            </div>
            <div className="p-2 rounded-lg bg-amber-50 text-amber-800">
              <div className="font-bold">{monitorCount} รูป</div>
              <div className="text-[10px] text-amber-600">เฝ้าระวัง ({monitorPct}%)</div>
            </div>
            <div className="p-2 rounded-lg bg-orange-50 text-orange-800">
              <div className="font-bold">{riskCount} รูป</div>
              <div className="text-[10px] text-orange-600">กลุ่มเสี่ยง ({riskPct}%)</div>
            </div>
            <div className="p-2 rounded-lg bg-rose-50 text-rose-800">
              <div className="font-bold">{medicalCount} รูป</div>
              <div className="text-[10px] text-rose-600">พบแพทย์ ({medicalPct}%)</div>
            </div>
          </div>
        </div>

        {/* Graph 2: Highlight Health Findings */}
        <div className="bg-white rounded-2xl p-5 shadow-xs border border-stone-200 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="text-base font-bold font-heading text-stone-900">
                กราฟที่ 2: ผลตรวจสุขภาพที่น่าสนใจ
              </h3>
              <p className="text-xs text-stone-500">
                ร้อยละของพระสงฆ์ที่มีค่าผลตรวจเกินเกณฑ์มาตรฐาน
              </p>
            </div>
            <span className="text-[11px] bg-amber-100 text-amber-900 px-2 py-0.5 rounded font-medium">
              สถิติภาพรวม
            </span>
          </div>

          <div className="h-64 sm:h-72 w-full">
            {checkedMonksCount > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={findingsData}
                  layout="vertical"
                  margin={{ top: 10, right: 30, left: 35, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e7e5e4" />
                  <XAxis
                    type="number"
                    domain={[0, 100]}
                    unit="%"
                    tick={{ fontSize: 11, fill: '#78716c' }}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fontSize: 11, fill: '#44403c' }}
                    width={110}
                  />
                  <Tooltip
                    formatter={(value: number) => [`${value}% ของผู้รับการตรวจ`, 'สัดส่วน']}
                  />
                  <Bar dataKey="pct" fill="#ea580c" radius={[0, 6, 6, 0]} barSize={18} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center text-stone-400 text-sm py-12">
                ไม่มีข้อมูลผลตรวจ
              </div>
            )}
          </div>

          <div className="text-[11px] text-stone-500 bg-stone-50 p-2.5 rounded-xl border border-stone-100 flex items-center gap-1.5">
            <Stethoscope className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              ข้อมูลเพื่อการคัดกรองและส่งเสริมสุขภาพเบื้องต้น ไม่ใช่การวินิจฉัยโรค
            </span>
          </div>
        </div>

        {/* Graph 3: Health Behaviors */}
        <div className="bg-white rounded-2xl p-5 shadow-xs border border-stone-200 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="text-base font-bold font-heading text-stone-900">
                กราฟที่ 3: พฤติกรรมสุขภาพของพระสงฆ์
              </h3>
              <p className="text-xs text-stone-500">
                การฉันภัตตาหาร กิจกรรมทางกาย การสูบบุหรี่ และการพักผ่อน
              </p>
            </div>
            <span className="text-[11px] bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded font-medium">
              พฤติกรรม
            </span>
          </div>

          <div className="h-64 sm:h-72 w-full">
            {checkedMonksCount > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={behaviorData}
                  margin={{ top: 10, right: 10, left: -15, bottom: 40 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e7e5e4" />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 10, fill: '#44403c' }}
                    interval={0}
                    angle={-25}
                    textAnchor="end"
                    height={50}
                  />
                  <YAxis
                    domain={[0, 100]}
                    unit="%"
                    tick={{ fontSize: 11, fill: '#78716c' }}
                  />
                  <Tooltip
                    formatter={(val: number) => [`${val}% (${Math.round((val * checkedMonksCount) / 100)} รูป)`, 'สัดส่วน']}
                  />
                  <Bar dataKey="pct" fill="#059669" radius={[6, 6, 0, 0]} barSize={22} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center text-stone-400 text-sm py-12">
                ไม่มีข้อมูลพฤติกรรม
              </div>
            )}
          </div>

          <div className="flex items-center justify-between text-[11px] text-stone-600 bg-stone-50 p-2.5 rounded-xl border border-stone-100">
            <span>💡 ข้อมูลช่วยชี้ทิศทางการรณรงค์ถวายภัตตาหารสุขภาพในวัด</span>
            <button
              onClick={() => setActiveTab('yearly_comparison')}
              className="text-emerald-700 font-semibold hover:underline flex items-center gap-0.5"
            >
              ดูเปรียบเทียบพฤติกรรม <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Graph 4: Multi-Year Trend */}
        <div className="bg-white rounded-2xl p-5 shadow-xs border border-stone-200 flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
            <div>
              <h3 className="text-base font-bold font-heading text-stone-900">
                กราฟที่ 4: แนวโน้มรายปี ({trendYears.join(' → ')})
              </h3>
              <p className="text-xs text-stone-500">
                เปรียบเทียบพัฒนาการตามตัวชี้วัดสุขภาพ
              </p>
            </div>
            {/* Metric Selector */}
            <select
              id="trend-metric-select"
              value={trendMetric}
              onChange={(e) => setTrendMetric(e.target.value)}
              className="bg-stone-50 border border-stone-300 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-stone-800 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
            >
              <option value="normal">ร้อยละกลุ่มปกติ (%)</option>
              <option value="risk">ร้อยละกลุ่มเสี่ยง/พบแพทย์ (%)</option>
              <option value="bmi">BMI เฉลี่ย (กก./ม.²)</option>
              <option value="waist">รอบเอวเฉลี่ย (ซม.)</option>
              <option value="sugar">น้ำตาลเฉลี่ย (มก./ดล.)</option>
              <option value="smoking">ร้อยละผู้สูบบุหรี่ (%)</option>
              <option value="exercise">ผู้ออกกำลังกาย ≥3 วัน (%)</option>
            </select>
          </div>

          <div className="h-64 sm:h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={yearlyTrendData}
                margin={{ top: 15, right: 25, left: -10, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
                <XAxis dataKey="year" tick={{ fontSize: 11, fill: '#44403c' }} />
                <YAxis tick={{ fontSize: 11, fill: '#78716c' }} />
                <Tooltip
                  formatter={(val: number) => [
                    `${val} ${yearlyTrendData[0]?.unit || ''}`,
                    'ค่าตัวชี้วัด',
                  ]}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  name="ค่าตัวชี้วัด"
                  stroke="#059669"
                  strokeWidth={3}
                  dot={{ r: 6, fill: '#059669', strokeWidth: 2, stroke: '#fff' }}
                  activeDot={{ r: 8 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="flex items-center justify-between text-[11px] text-stone-600 bg-emerald-50/60 p-2.5 rounded-xl border border-emerald-100">
            <div className="flex items-center gap-1.5 text-emerald-900 font-medium">
              <Sparkles className="w-4 h-4 text-amber-600" />
              <span>แนวโน้มภาพรวมสะท้อนการปรับเปลี่ยนพฤติกรรมที่ดีขึ้น</span>
            </div>
            <button
              onClick={() => setActiveTab('yearly_comparison')}
              className="text-emerald-800 font-semibold hover:underline flex items-center gap-0.5"
            >
              เปรียบเทียบละเอียด <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
