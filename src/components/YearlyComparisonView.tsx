import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import {
  currentBuddhistYear,
  getFilterYearOptions,
  formatBuddhistYearLabel,
} from '../utils/buddhistYear';
import {
  GitCompare,
  TrendingDown,
  TrendingUp,
  Minus,
  Filter,
  Sparkles,
  Users,
  CheckCircle2,
  AlertTriangle,
  Cigarette,
  HeartPulse,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';

import { HealthCheck, Monk } from '../types';

export const YearlyComparisonView: React.FC = () => {
  const { currentUser, temples, monks, healthChecks } = useApp();

  const [baseYear, setBaseYear] = useState<number>(currentBuddhistYear - 1);
  const [targetYear, setTargetYear] = useState<number>(currentBuddhistYear);
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

  const monkIdSet = useMemo(() => new Set(filteredMonks.map((m) => m.id)), [filteredMonks]);

  // Base Year Checks & Target Year Checks
  const baseChecks = useMemo(() => {
    return healthChecks.filter((hc) => hc.year === baseYear && monkIdSet.has(hc.monkId));
  }, [healthChecks, baseYear, monkIdSet]);

  const targetChecks = useMemo(() => {
    return healthChecks.filter((hc) => hc.year === targetYear && monkIdSet.has(hc.monkId));
  }, [healthChecks, targetYear, monkIdSet]);

  // Monks checked in both years for paired comparative analysis
  const pairedMonksAnalysis = useMemo(() => {
    const baseMap = new Map<string, HealthCheck>(baseChecks.map((c) => [c.monkId, c]));
    const targetMap = new Map<string, HealthCheck>(targetChecks.map((c) => [c.monkId, c]));

    let improvedCount = 0;
    let worsenedCount = 0;
    let quitSmokingCount = 0;
    let exerciseIncreasedCount = 0;

    const list: Array<{
      monk: Monk;
      base: HealthCheck;
      target: HealthCheck;
      bmiDiff: number | null;
      sugarDiff: number | null;
      bpDiff: number | null;
      statusChange: 'improved' | 'worsened' | 'same';
    }> = [];

    filteredMonks.forEach((m) => {
      const b = baseMap.get(m.id);
      const t = targetMap.get(m.id);
      if (b && t) {
        const bmiDiff = b.bmi && t.bmi ? parseFloat((t.bmi - b.bmi).toFixed(1)) : null;
        const sugarDiff = b.bloodSugar && t.bloodSugar ? t.bloodSugar - b.bloodSugar : null;
        const bpDiff = b.systolic && t.systolic ? t.systolic - b.systolic : null;

        // Health Status ranking: normal(1) < monitor(2) < risk(3) < medical(4)
        const rankMap: Record<string, number> = {
          normal: 1,
          monitor: 2,
          risk: 3,
          medical_attention: 4,
        };
        const bRank = rankMap[b.healthStatus] || 2;
        const tRank = rankMap[t.healthStatus] || 2;

        let statusChange: 'improved' | 'worsened' | 'same' = 'same';
        if (tRank < bRank || (bmiDiff !== null && bmiDiff < -0.5 && tRank <= bRank)) {
          statusChange = 'improved';
          improvedCount++;
        } else if (tRank > bRank || (sugarDiff !== null && sugarDiff > 20)) {
          statusChange = 'worsened';
          worsenedCount++;
        }

        // Smoking cessation
        if (b.smokingStatus === 'smoking' && t.smokingStatus !== 'smoking') {
          quitSmokingCount++;
        }

        // Exercise increase
        if (t.exerciseDaysPerWeek > b.exerciseDaysPerWeek) {
          exerciseIncreasedCount++;
        }

        list.push({
          monk: m,
          base: b,
          target: t,
          bmiDiff,
          sugarDiff,
          bpDiff,
          statusChange,
        });
      }
    });

    return {
      pairedCount: list.length,
      improvedCount,
      worsenedCount,
      quitSmokingCount,
      exerciseIncreasedCount,
      list,
    };
  }, [filteredMonks, baseChecks, targetChecks]);

  // Aggregated Metric Comparison (Bar Chart)
  const chartComparisonData = useMemo(() => {
    const bCount = baseChecks.length || 1;
    const tCount = targetChecks.length || 1;

    // Normal %
    const bNormal = Math.round((baseChecks.filter((c) => c.healthStatus === 'normal').length / bCount) * 100);
    const tNormal = Math.round((targetChecks.filter((c) => c.healthStatus === 'normal').length / tCount) * 100);

    // Risk & Medical %
    const bRisk = Math.round(
      (baseChecks.filter((c) => c.healthStatus === 'risk' || c.healthStatus === 'medical_attention').length / bCount) * 100
    );
    const tRisk = Math.round(
      (targetChecks.filter((c) => c.healthStatus === 'risk' || c.healthStatus === 'medical_attention').length / tCount) * 100
    );

    // High Blood Sugar %
    const bSugar = Math.round((baseChecks.filter((c) => (c.bloodSugar || 0) >= 126).length / bCount) * 100);
    const tSugar = Math.round((targetChecks.filter((c) => (c.bloodSugar || 0) >= 126).length / tCount) * 100);

    // Smoking %
    const bSmoke = Math.round((baseChecks.filter((c) => c.smokingStatus === 'smoking').length / bCount) * 100);
    const tSmoke = Math.round((targetChecks.filter((c) => c.smokingStatus === 'smoking').length / tCount) * 100);

    // Exercise >= 3 days %
    const bEx = Math.round((baseChecks.filter((c) => c.exerciseDaysPerWeek >= 3).length / bCount) * 100);
    const tEx = Math.round((targetChecks.filter((c) => c.exerciseDaysPerWeek >= 3).length / tCount) * 100);

    return [
      { metric: 'กลุ่มสุขภาพปกติ (%)', [String(baseYear)]: bNormal, [String(targetYear)]: tNormal },
      { metric: 'กลุ่มเสี่ยง/พบแพทย์ (%)', [String(baseYear)]: bRisk, [String(targetYear)]: tRisk },
      { metric: 'น้ำตาลในเลือดสูง (%)', [String(baseYear)]: bSugar, [String(targetYear)]: tSugar },
      { metric: 'ผู้สูบบุหรี่ (%)', [String(baseYear)]: bSmoke, [String(targetYear)]: tSmoke },
      { metric: 'ออกกำลังกาย ≥3 วัน (%)', [String(baseYear)]: bEx, [String(targetYear)]: tEx },
    ];
  }, [baseChecks, targetChecks, baseYear, targetYear]);

  // Average Averages
  const baseAvgBmi = useMemo(() => {
    const v = baseChecks.filter((c) => c.bmi);
    if (!v.length) return 0;
    return parseFloat((v.reduce((s, c) => s + (c.bmi || 0), 0) / v.length).toFixed(1));
  }, [baseChecks]);

  const targetAvgBmi = useMemo(() => {
    const v = targetChecks.filter((c) => c.bmi);
    if (!v.length) return 0;
    return parseFloat((v.reduce((s, c) => s + (c.bmi || 0), 0) / v.length).toFixed(1));
  }, [targetChecks]);

  const baseAvgSugar = useMemo(() => {
    const v = baseChecks.filter((c) => c.bloodSugar);
    if (!v.length) return 0;
    return Math.round(v.reduce((s, c) => s + (c.bloodSugar || 0), 0) / v.length);
  }, [baseChecks]);

  const targetAvgSugar = useMemo(() => {
    const v = targetChecks.filter((c) => c.bloodSugar);
    if (!v.length) return 0;
    return Math.round(v.reduce((s, c) => s + (c.bloodSugar || 0), 0) / v.length);
  }, [targetChecks]);

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-xs border border-stone-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <GitCompare className="w-5 h-5 text-emerald-700" />
            <span className="text-xs font-bold text-stone-500 uppercase tracking-wider font-heading">
              {currentUser?.role === 'region_admin'
                ? (currentUser.assignedRegion ? `การวิเคราะห์เปรียบเทียบภาค ${currentUser.assignedRegion}` : 'การวิเคราะห์เปรียบเทียบภาค')
                : 'การวิเคราะห์เชิงเปรียบเทียบ'}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold font-heading text-stone-900 tracking-tight">
            เปรียบเทียบผลตรวจและพฤติกรรมสุขภาพรายปี
          </h1>
          <p className="text-stone-500 text-xs sm:text-sm">
            {currentUser?.role === 'region_admin'
              ? `วิเคราะห์ความก้าวหน้าและการเปลี่ยนแปลงของสุขภาพพระสงฆ์ ทุกวัดในภาค${currentUser.assignedRegion ? ` ${currentUser.assignedRegion}` : ''} ระหว่างปี พ.ศ. ${baseYear} กับ พ.ศ. ${targetYear}`
              : `วิเคราะห์ความก้าวหน้าและการเปลี่ยนแปลงของสุขภาพพระสงฆ์ระหว่างปี พ.ศ. ${baseYear} กับ พ.ศ. ${targetYear}`}
          </p>
        </div>
      </div>

      {/* Filter Selection Card */}
      <div className="bg-white rounded-2xl p-4 shadow-xs border border-stone-200">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Base Year */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              ปีหลัก (ปีก่อนหน้า)
            </label>
            <select
              id="base-year-select"
              value={baseYear}
              onChange={(e) => setBaseYear(Number(e.target.value))}
              className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-xs font-bold text-stone-800 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
            >
              {availableYears.map((yr) => (
                <option key={yr} value={yr}>
                  {formatBuddhistYearLabel(yr)}
                </option>
              ))}
            </select>
          </div>

          {/* Target Year */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              ปีเปรียบเทียบ (ปีเป้าหมาย)
            </label>
            <select
              id="target-year-select"
              value={targetYear}
              onChange={(e) => setTargetYear(Number(e.target.value))}
              className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-xs font-bold text-stone-800 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
            >
              {availableYears.map((yr) => (
                <option key={yr} value={yr}>
                  {formatBuddhistYearLabel(yr)}
                </option>
              ))}
            </select>
          </div>

          {/* Temple Filter */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">พื้นที่ / วัด</label>
            <select
              id="compare-temple-select"
              value={selectedTempleId}
              disabled={currentUser?.role === 'temple_admin'}
              onChange={(e) => setSelectedTempleId(e.target.value)}
              className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-xs text-stone-800 focus:ring-2 focus:ring-emerald-600 focus:outline-none disabled:bg-stone-100 font-medium"
            >
              {currentUser?.role === 'super_admin' && <option value="all">ภาพรวมทุกวัดในระบบ</option>}
              {currentUser?.role === 'region_admin' && <option value="all">ทุกวัดในภาค</option>}
              {temples.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.province})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Highlight Change Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        {/* Improved Health */}
        <div className="bg-white rounded-2xl p-4 border border-emerald-200 bg-emerald-50/40 shadow-xs">
          <div className="flex items-center justify-between text-emerald-800 mb-1">
            <span className="text-xs font-bold font-heading">สุขภาพดีขึ้น</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold font-heading text-emerald-900">
            {pairedMonksAnalysis.improvedCount}{' '}
            <span className="text-xs font-normal text-emerald-700">รูป</span>
          </div>
          <div className="text-[11px] text-emerald-700 mt-1">
            จากพระสงฆ์ที่ตรวจต่อเนื่อง {pairedMonksAnalysis.pairedCount} รูป
          </div>
        </div>

        {/* Quit Smoking */}
        <div className="bg-white rounded-2xl p-4 border border-amber-200 bg-amber-50/40 shadow-xs">
          <div className="flex items-center justify-between text-amber-800 mb-1">
            <span className="text-xs font-bold font-heading">เลิกสูบบุหรี่ได้</span>
            <Cigarette className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold font-heading text-amber-900">
            {pairedMonksAnalysis.quitSmokingCount}{' '}
            <span className="text-xs font-normal text-amber-700">รูป</span>
          </div>
          <div className="text-[11px] text-amber-700 mt-1">ลดความเสี่ยงโรคปอดและหัวใจ</div>
        </div>

        {/* Avg BMI Delta */}
        <div className="bg-white rounded-2xl p-4 border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between text-stone-500 mb-1">
            <span className="text-xs font-bold font-heading">BMI เฉลี่ย</span>
            <HeartPulse className="w-4 h-4 text-stone-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl font-bold font-heading text-stone-900">
              {targetAvgBmi}
            </span>
            <span className="text-xs text-stone-500">
              (เดิม {baseAvgBmi})
            </span>
          </div>
          <div className="text-[11px] font-semibold mt-1">
            {targetAvgBmi < baseAvgBmi ? (
              <span className="text-emerald-700 flex items-center gap-0.5">
                <TrendingDown className="w-3.5 h-3.5" /> ลดลง {(baseAvgBmi - targetAvgBmi).toFixed(1)} กก./ม.² (ดีขึ้น)
              </span>
            ) : (
              <span className="text-stone-500 flex items-center gap-0.5">
                <Minus className="w-3.5 h-3.5" /> ทรงตัว
              </span>
            )}
          </div>
        </div>

        {/* Avg Sugar Delta */}
        <div className="bg-white rounded-2xl p-4 border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between text-stone-500 mb-1">
            <span className="text-xs font-bold font-heading">น้ำตาลเฉลี่ย (FBS)</span>
            <Sparkles className="w-4 h-4 text-stone-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl font-bold font-heading text-stone-900">
              {targetAvgSugar}
            </span>
            <span className="text-xs text-stone-500">
              (เดิม {baseAvgSugar} mg/dL)
            </span>
          </div>
          <div className="text-[11px] font-semibold mt-1">
            {targetAvgSugar < baseAvgSugar ? (
              <span className="text-emerald-700 flex items-center gap-0.5">
                <TrendingDown className="w-3.5 h-3.5" /> ลดลง {baseAvgSugar - targetAvgSugar} mg/dL (ดีขึ้น)
              </span>
            ) : (
              <span className="text-stone-500 flex items-center gap-0.5">
                <Minus className="w-3.5 h-3.5" /> ทรงตัว
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Comparison Bar Chart */}
      <div className="bg-white rounded-2xl p-5 shadow-xs border border-stone-200">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h3 className="text-base font-bold font-heading text-stone-900">
              กราฟเปรียบเทียบสัดส่วนตัวชี้วัด (พ.ศ. {baseYear} vs พ.ศ. {targetYear})
            </h3>
            <p className="text-xs text-stone-500">
              เปรียบเทียบสัดส่วนร้อยละ (%) ของสถานะและพฤติกรรมสุขภาพ
            </p>
          </div>
        </div>

        <div className="h-72 w-full mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartComparisonData} margin={{ top: 10, right: 20, left: -10, bottom: 25 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e7e5e4" />
              <XAxis dataKey="metric" tick={{ fontSize: 11, fill: '#44403c' }} />
              <YAxis domain={[0, 100]} unit="%" tick={{ fontSize: 11, fill: '#78716c' }} />
              <Tooltip formatter={(val: number) => [`${val}%`, 'สัดส่วน']} />
              <Legend />
              <Bar dataKey={String(baseYear)} name={`พ.ศ. ${baseYear}`} fill="#94a3b8" radius={[4, 4, 0, 0]} barSize={24} />
              <Bar dataKey={String(targetYear)} name={`พ.ศ. ${targetYear}`} fill="#059669" radius={[4, 4, 0, 0]} barSize={24} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Individual Paired Monks Comparison Table */}
      <div className="bg-white rounded-2xl shadow-xs border border-stone-200 overflow-hidden">
        <div className="p-4 border-b border-stone-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold font-heading text-stone-900">
              ตารางเปรียบเทียบพระสงฆ์ที่ตรวจต่อเนื่อง ({pairedMonksAnalysis.list.length} รูป)
            </h3>
            <p className="text-xs text-stone-500">
              แสดงการเปลี่ยนแปลงค่าสุขภาพรายบุคคลระหว่าง พ.ศ. {baseYear} กับ พ.ศ. {targetYear}
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-stone-100 text-stone-700 border-b border-stone-200 font-heading">
                <th className="p-3 font-bold">รหัส / ชื่อพระสงฆ์</th>
                <th className="p-3 font-bold">วัด</th>
                <th className="p-3 text-center font-bold">BMI ({baseYear} → {targetYear})</th>
                <th className="p-3 text-center font-bold">น้ำตาล ({baseYear} → {targetYear})</th>
                <th className="p-3 text-center font-bold">ความดันตัวบน ({baseYear} → {targetYear})</th>
                <th className="p-3 text-center font-bold">สูบบุหรี่</th>
                <th className="p-3 text-center font-bold">แนวโน้มสุขภาพ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {pairedMonksAnalysis.list.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-stone-400">
                    ไม่พบข้อมูลพระสงฆ์ที่รับการตรวจสุขภาพทั้ง 2 ปีเพื่อนำมาเปรียบเทียบ
                  </td>
                </tr>
              ) : (
                pairedMonksAnalysis.list.map(({ monk, base, target, bmiDiff, sugarDiff, bpDiff, statusChange }) => {
                  return (
                  <tr key={monk.id} className="hover:bg-stone-50">
                    <td className="p-3 font-medium">
                      <div className="font-bold text-stone-900">{monk.name} ({monk.monkName})</div>
                      <div className="text-[10px] text-stone-400 font-mono">{monk.id}</div>
                    </td>

                    <td className="p-3 text-stone-700">
                      {temples.find((t) => t.id === monk.templeId)?.name}
                    </td>

                    {/* BMI */}
                    <td className="p-3 text-center">
                      <div className="font-mono font-medium text-stone-800">
                        {base.bmi || '—'} → {target.bmi || '—'}
                      </div>
                      {bmiDiff !== null && (
                        <div
                          className={`text-[10px] font-bold ${
                            bmiDiff < 0 ? 'text-emerald-700' : bmiDiff > 0 ? 'text-orange-700' : 'text-stone-400'
                          }`}
                        >
                          {bmiDiff < 0 ? `ลดลง ${Math.abs(bmiDiff)}` : bmiDiff > 0 ? `+${bmiDiff}` : 'คงที่'}
                        </div>
                      )}
                    </td>

                    {/* Sugar */}
                    <td className="p-3 text-center">
                      <div className="font-mono font-medium text-stone-800">
                        {base.bloodSugar || '—'} → {target.bloodSugar || '—'}
                      </div>
                      {sugarDiff !== null && (
                        <div
                          className={`text-[10px] font-bold ${
                            sugarDiff < 0 ? 'text-emerald-700' : sugarDiff > 0 ? 'text-rose-700' : 'text-stone-400'
                          }`}
                        >
                          {sugarDiff < 0 ? `ลดลง ${Math.abs(sugarDiff)}` : sugarDiff > 0 ? `+${sugarDiff}` : 'คงที่'}
                        </div>
                      )}
                    </td>

                    {/* Blood pressure */}
                    <td className="p-3 text-center">
                      <div className="font-mono font-medium text-stone-800">
                        {base.systolic || '—'} → {target.systolic || '—'}
                      </div>
                      {bpDiff !== null && (
                        <div
                          className={`text-[10px] font-bold ${
                            bpDiff < 0 ? 'text-emerald-700' : bpDiff > 0 ? 'text-rose-700' : 'text-stone-400'
                          }`}
                        >
                          {bpDiff < 0 ? `ลดลง ${Math.abs(bpDiff)}` : bpDiff > 0 ? `+${bpDiff}` : 'คงที่'}
                        </div>
                      )}
                    </td>

                    {/* Smoking */}
                    <td className="p-3 text-center">
                      {base.smokingStatus === 'smoking' && target.smokingStatus !== 'smoking' ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          เลิกสูบแล้ว ✓
                        </span>
                      ) : target.smokingStatus === 'smoking' ? (
                        <span className="text-[11px] text-rose-700 font-medium">ยังสูบอยู่</span>
                      ) : (
                        <span className="text-[11px] text-stone-400">ไม่สูบ</span>
                      )}
                    </td>

                    {/* Overall indicator */}
                    <td className="p-3 text-center">
                      {statusChange === 'improved' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                          <TrendingDown className="w-3.5 h-3.5" /> ดีขึ้น
                        </span>
                      ) : statusChange === 'worsened' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800">
                          <TrendingUp className="w-3.5 h-3.5" /> ควรเฝ้าระวัง
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-stone-100 text-stone-600">
                          <Minus className="w-3 h-3" /> คงที่
                        </span>
                      )}
                    </td>
                  </tr>
                );
              }))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
