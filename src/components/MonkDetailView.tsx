import React, { useMemo } from 'react';
import { useApp } from '../context/AppContext';
import {
  ArrowLeft,
  Calendar,
  HeartPulse,
  Activity,
  Stethoscope,
  TrendingDown,
  TrendingUp,
  Minus,
  Printer,
  ClipboardPenLine,
  Building,
  User,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import {
  HEALTH_STATUS_LABELS,
  FREQUENCY_LABELS,
  SMOKING_LABELS,
  SLEEP_HOURS_LABELS,
  MEDITATION_DURATION_LABELS,
  FRUIT_VEG_LABELS,
  HealthCheck,
} from '../types';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';

export const MonkDetailView: React.FC = () => {
  const {
    selectedMonkId,
    monks,
    temples,
    healthChecks,
    setActiveTab,
    setPrefillHealthEntry,
  } = useApp();

  const monk = useMemo(() => {
    return monks.find((m) => m.id === selectedMonkId);
  }, [monks, selectedMonkId]);

  const temple = useMemo(() => {
    if (!monk) return null;
    return temples.find((t) => t.id === monk.templeId);
  }, [monk, temples]);

  // All health checks for this monk sorted chronologically
  const monkChecks = useMemo(() => {
    if (!selectedMonkId) return [];
    return healthChecks
      .filter((hc) => hc.monkId === selectedMonkId)
      .sort((a, b) => a.year - b.year);
  }, [healthChecks, selectedMonkId]);

  // Latest check
  const latestCheck = monkChecks.length > 0 ? monkChecks[monkChecks.length - 1] : null;
  const previousCheck = monkChecks.length > 1 ? monkChecks[monkChecks.length - 2] : null;

  // Personal Trend Chart Data
  const personalTrendData = useMemo(() => {
    return monkChecks.map((c) => ({
      year: `พ.ศ. ${c.year}`,
      bmi: c.bmi,
      systolic: c.systolic,
      diastolic: c.diastolic,
      bloodSugar: c.bloodSugar,
      cholesterol: c.cholesterol,
    }));
  }, [monkChecks]);

  // Delta Comparisons between Latest and Previous
  const deltas = useMemo(() => {
    if (!latestCheck || !previousCheck) return null;

    const diffWeight =
      latestCheck.weight && previousCheck.weight
        ? parseFloat((latestCheck.weight - previousCheck.weight).toFixed(1))
        : null;

    const diffBmi =
      latestCheck.bmi && previousCheck.bmi
        ? parseFloat((latestCheck.bmi - previousCheck.bmi).toFixed(1))
        : null;

    const diffSugar =
      latestCheck.bloodSugar && previousCheck.bloodSugar
        ? latestCheck.bloodSugar - previousCheck.bloodSugar
        : null;

    const diffSystolic =
      latestCheck.systolic && previousCheck.systolic
        ? latestCheck.systolic - previousCheck.systolic
        : null;

    const diffChol =
      latestCheck.cholesterol && previousCheck.cholesterol
        ? latestCheck.cholesterol - previousCheck.cholesterol
        : null;

    return {
      diffWeight,
      diffBmi,
      diffSugar,
      diffSystolic,
      diffChol,
    };
  }, [latestCheck, previousCheck]);

  if (!monk) {
    return (
      <div className="bg-white rounded-2xl p-8 text-center space-y-3 border border-stone-200">
        <p className="text-stone-500 text-sm">ไม่พบข้อมูลพระสงฆ์ที่เลือก</p>
        <button
          onClick={() => setActiveTab('monk_list')}
          className="px-4 py-2 bg-emerald-800 text-white text-xs font-semibold rounded-xl"
        >
          กลับไปหน้ารายชื่อ
        </button>
      </div>
    );
  }

  const handlePrint = () => {
    window.print();
  };

  const handleAddYearCheck = () => {
    setPrefillHealthEntry({
      monkId: monk.id,
      templeId: monk.templeId,
      year: 2569,
    });
    setActiveTab('health_entry');
  };

  return (
    <div className="space-y-6 pb-16 max-w-5xl mx-auto">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 no-print">
        <button
          id="back-to-monk-list-btn"
          onClick={() => setActiveTab('monk_list')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-600 hover:text-emerald-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>กลับไปหน้ารายชื่อพระสงฆ์</span>
        </button>

        <div className="flex items-center space-x-2">
          <button
            id="print-monk-report-btn"
            onClick={handlePrint}
            className="px-3.5 py-2 bg-white border border-stone-300 hover:bg-stone-50 text-stone-700 text-xs font-semibold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Printer className="w-4 h-4 text-stone-500" />
            <span>พิมพ์รายงานสรุป (Print / PDF)</span>
          </button>

          <button
            id="monk-detail-record-btn"
            onClick={handleAddYearCheck}
            className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer font-heading"
          >
            <ClipboardPenLine className="w-4 h-4 text-amber-300" />
            <span>+ บันทึกผลตรวจปีนี้</span>
          </button>
        </div>
      </div>

      {/* Main Profile Header Card */}
      <div className="bg-white rounded-2xl p-6 shadow-xs border border-stone-200">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-6 border-b border-stone-100">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-900 border border-amber-300 flex items-center justify-center font-bold text-2xl font-heading shadow-inner shrink-0">
              {monk.name.charAt(monk.name.startsWith('พระ') ? 3 : 0) || 'พ'}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded">
                  {monk.id}
                </span>
                <span className="text-xs text-stone-400 font-medium">รหัสประจำตัวพระสงฆ์</span>
              </div>
              <h1 className="text-2xl font-bold font-heading text-stone-900 mt-1">
                {monk.name} ({monk.monkName})
              </h1>
              <p className="text-xs text-stone-500 mt-0.5 flex items-center gap-2">
                <span>อายุ {monk.age} ปี</span> • <span>พรรษา {monk.monasticYears}</span> •{' '}
                <span>{temple?.name || monk.templeId}</span> ({monk.province})
              </p>
            </div>
          </div>

          {/* Latest Status Pill */}
          {latestCheck && (
            <div className="text-right bg-stone-50 p-3.5 rounded-xl border border-stone-200/80 shrink-0">
              <div className="text-[11px] text-stone-500">
                สถานะผลตรวจล่าสุด (พ.ศ. {latestCheck.year})
              </div>
              <div
                className={`text-base font-bold font-heading mt-1 inline-flex items-center px-3 py-1 rounded-full ${
                  HEALTH_STATUS_LABELS[latestCheck.healthStatus]?.bg
                } ${HEALTH_STATUS_LABELS[latestCheck.healthStatus]?.color}`}
              >
                {HEALTH_STATUS_LABELS[latestCheck.healthStatus]?.label}
              </div>
              {latestCheck.followUpRequired === 'yes' && (
                <div className="text-[11px] text-amber-700 font-medium mt-1">
                  ⚠️ มีข้อบ่งชี้ควรติดตามผล
                </div>
              )}
            </div>
          )}
        </div>

        {/* Latest Key Vitals Grid */}
        {latestCheck ? (
          <div className="pt-6">
            <div className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-3 font-heading">
              ผลตรวจสุขภาพล่าสุด (ประจำปี พ.ศ. {latestCheck.year}) — ตรวจวันที่ {latestCheck.checkDate}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {/* BMI */}
              <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200">
                <span className="text-[11px] text-stone-500 block">BMI (ดัชนีมวลกาย)</span>
                <span className="text-xl font-bold font-heading text-stone-900">
                  {latestCheck.bmi ? latestCheck.bmi : '—'}
                </span>
                <span className="text-[10px] text-stone-400 block mt-0.5">กก./ม.²</span>
              </div>

              {/* Blood Pressure */}
              <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200">
                <span className="text-[11px] text-stone-500 block">ความดันโลหิต (BP)</span>
                <span className="text-xl font-bold font-heading text-stone-900">
                  {latestCheck.systolic && latestCheck.diastolic
                    ? `${latestCheck.systolic}/${latestCheck.diastolic}`
                    : '—'}
                </span>
                <span className="text-[10px] text-stone-400 block mt-0.5">มม.ปรอท</span>
              </div>

              {/* Blood Sugar */}
              <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200">
                <span className="text-[11px] text-stone-500 block">น้ำตาลในเลือด</span>
                <span className="text-xl font-bold font-heading text-stone-900">
                  {latestCheck.bloodSugar ? latestCheck.bloodSugar : '—'}
                </span>
                <span className="text-[10px] text-stone-400 block mt-0.5">มก./ดล.</span>
              </div>

              {/* Cholesterol */}
              <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200">
                <span className="text-[11px] text-stone-500 block">Cholesterol</span>
                <span className="text-xl font-bold font-heading text-stone-900">
                  {latestCheck.cholesterol ? latestCheck.cholesterol : '—'}
                </span>
                <span className="text-[10px] text-stone-400 block mt-0.5">มก./ดล.</span>
              </div>

              {/* Waist */}
              <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200">
                <span className="text-[11px] text-stone-500 block">รอบเอว</span>
                <span className="text-xl font-bold font-heading text-stone-900">
                  {latestCheck.waist ? `${latestCheck.waist}` : '—'}
                </span>
                <span className="text-[10px] text-stone-400 block mt-0.5">ซม.</span>
              </div>

              {/* Renal / eGFR */}
              <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200">
                <span className="text-[11px] text-stone-500 block">การทำงานของไต (eGFR)</span>
                <span className="text-xl font-bold font-heading text-stone-900">
                  {latestCheck.egfr ? latestCheck.egfr : '—'}
                </span>
                <span className="text-[10px] text-stone-400 block mt-0.5">mL/min</span>
              </div>
            </div>

            {/* Chronic diseases & Behaviors quick summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 text-xs">
              <div className="p-3.5 rounded-xl bg-amber-50/60 border border-amber-200">
                <div className="font-bold text-amber-900 mb-1">โรคประจำตัว:</div>
                <div className="text-stone-700">
                  {latestCheck.hasChronicDisease === 'has' && latestCheck.chronicDiseases?.length
                    ? latestCheck.chronicDiseases.join(', ') +
                      (latestCheck.otherChronicDisease ? ` (${latestCheck.otherChronicDisease})` : '')
                    : 'ไม่มีโรคประจำตัว'}
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-200">
                <div className="font-bold text-emerald-950 mb-1">พฤติกรรมเด่น:</div>
                <div className="text-stone-700 space-y-0.5">
                  <div>
                    • ออกกำลังกาย/กิจกรรมทางกาย: {latestCheck.exerciseDaysPerWeek} วัน/สัปดาห์ (
                    {latestCheck.exerciseTypes?.join(', ') || 'ไม่มี'})
                  </div>
                  <div>
                    • สมาธิ/เจริญสติ: {latestCheck.meditationDaysPerWeek} วัน/สัปดาห์ | สูบบุหรี่:{' '}
                    {SMOKING_LABELS[latestCheck.smokingStatus]}
                  </div>
                </div>
              </div>
            </div>

            {latestCheck.recommendation && (
              <div className="mt-3 p-3 rounded-xl bg-stone-100 text-stone-800 text-xs border border-stone-200">
                <strong>คำแนะนำการดูแลสุขภาพ:</strong> {latestCheck.recommendation}
              </div>
            )}
          </div>
        ) : (
          <div className="pt-6 text-center text-stone-400 text-sm py-4">
            ยังไม่มีบันทึกประวัติผลตรวจสุขภาพของพระสงฆ์รูปนี้
          </div>
        )}
      </div>

      {/* Deltas & Yearly Comparison Card */}
      {deltas && latestCheck && previousCheck && (
        <div className="bg-white rounded-2xl p-5 shadow-xs border border-stone-200">
          <div className="flex items-center gap-2 text-stone-800 font-bold font-heading text-sm mb-3">
            <Sparkles className="w-4 h-4 text-emerald-700" />
            <span>เปรียบเทียบการเปลี่ยนแปลง (พ.ศ. {previousCheck.year} → พ.ศ. {latestCheck.year})</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            {/* Delta Weight */}
            <div className="p-3 rounded-xl bg-stone-50 border border-stone-200">
              <div className="text-stone-500 text-[11px]">น้ำหนักตัว</div>
              <div className="flex items-center gap-1.5 mt-1">
                {deltas.diffWeight !== null && (
                  <>
                    {deltas.diffWeight < 0 ? (
                      <span className="text-emerald-700 font-bold flex items-center text-sm">
                        <TrendingDown className="w-4 h-4 mr-0.5" />
                        {Math.abs(deltas.diffWeight)} กก. (ลดลง ดีขึ้น)
                      </span>
                    ) : deltas.diffWeight > 0 ? (
                      <span className="text-orange-700 font-bold flex items-center text-sm">
                        <TrendingUp className="w-4 h-4 mr-0.5" />
                        +{deltas.diffWeight} กก. (เพิ่มขึ้น)
                      </span>
                    ) : (
                      <span className="text-stone-700 font-bold flex items-center text-sm">
                        <Minus className="w-4 h-4 mr-0.5" /> คงที่
                      </span>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Delta Blood Sugar */}
            <div className="p-3 rounded-xl bg-stone-50 border border-stone-200">
              <div className="text-stone-500 text-[11px]">น้ำตาลในเลือด</div>
              <div className="flex items-center gap-1.5 mt-1">
                {deltas.diffSugar !== null && (
                  <>
                    {deltas.diffSugar < 0 ? (
                      <span className="text-emerald-700 font-bold flex items-center text-sm">
                        <TrendingDown className="w-4 h-4 mr-0.5" />
                        {Math.abs(deltas.diffSugar)} mg/dL (ลดลง)
                      </span>
                    ) : deltas.diffSugar > 0 ? (
                      <span className="text-rose-700 font-bold flex items-center text-sm">
                        <TrendingUp className="w-4 h-4 mr-0.5" />
                        +{deltas.diffSugar} mg/dL (เพิ่มขึ้น)
                      </span>
                    ) : (
                      <span className="text-stone-700 font-bold flex items-center text-sm">
                        <Minus className="w-4 h-4 mr-0.5" /> คงที่
                      </span>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Delta BP Systolic */}
            <div className="p-3 rounded-xl bg-stone-50 border border-stone-200">
              <div className="text-stone-500 text-[11px]">ความดันตัวบน (Systolic)</div>
              <div className="flex items-center gap-1.5 mt-1">
                {deltas.diffSystolic !== null && (
                  <>
                    {deltas.diffSystolic < 0 ? (
                      <span className="text-emerald-700 font-bold flex items-center text-sm">
                        <TrendingDown className="w-4 h-4 mr-0.5" />
                        {Math.abs(deltas.diffSystolic)} mmHg (ลดลง)
                      </span>
                    ) : deltas.diffSystolic > 0 ? (
                      <span className="text-rose-700 font-bold flex items-center text-sm">
                        <TrendingUp className="w-4 h-4 mr-0.5" />
                        +{deltas.diffSystolic} mmHg
                      </span>
                    ) : (
                      <span className="text-stone-700 font-bold flex items-center text-sm">
                        <Minus className="w-4 h-4 mr-0.5" /> คงที่
                      </span>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Delta Cholesterol */}
            <div className="p-3 rounded-xl bg-stone-50 border border-stone-200">
              <div className="text-stone-500 text-[11px]">Cholesterol</div>
              <div className="flex items-center gap-1.5 mt-1">
                {deltas.diffChol !== null && (
                  <>
                    {deltas.diffChol < 0 ? (
                      <span className="text-emerald-700 font-bold flex items-center text-sm">
                        <TrendingDown className="w-4 h-4 mr-0.5" />
                        {Math.abs(deltas.diffChol)} mg/dL (ลดลง)
                      </span>
                    ) : deltas.diffChol > 0 ? (
                      <span className="text-rose-700 font-bold flex items-center text-sm">
                        <TrendingUp className="w-4 h-4 mr-0.5" />
                        +{deltas.diffChol} mg/dL
                      </span>
                    ) : (
                      <span className="text-stone-700 font-bold flex items-center text-sm">
                        <Minus className="w-4 h-4 mr-0.5" /> คงที่
                      </span>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Individual Trend Graph */}
      {personalTrendData.length > 1 && (
        <div className="bg-white rounded-2xl p-5 shadow-xs border border-stone-200">
          <h3 className="text-sm font-bold font-heading text-stone-900 mb-1">
            กราฟแนวโน้มสุขภาพรายบุคคล (ย้อนหลัง 3 ปี)
          </h3>
          <p className="text-xs text-stone-500 mb-4">
            ติดตามความต่อเนื่องของค่าผลตรวจทางกายภาพและระดับน้ำตาล/ไขมัน
          </p>

          <div className="h-64 sm:h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={personalTrendData} margin={{ top: 10, right: 30, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
                <XAxis dataKey="year" tick={{ fontSize: 11, fill: '#44403c' }} />
                <YAxis tick={{ fontSize: 11, fill: '#78716c' }} />
                <Tooltip />
                <Legend
                  formatter={(value) => (
                    <span className="text-xs text-stone-700 font-medium">{value}</span>
                  )}
                />
                <Line
                  type="monotone"
                  dataKey="bmi"
                  name="BMI (กก./ม.²)"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  dot={{ r: 5 }}
                />
                <Line
                  type="monotone"
                  dataKey="systolic"
                  name="ความดันตัวบน (mmHg)"
                  stroke="#f97316"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="bloodSugar"
                  name="น้ำตาลในเลือด (mg/dL)"
                  stroke="#e11d48"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="cholesterol"
                  name="Cholesterol (mg/dL)"
                  stroke="#8b5cf6"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Yearly History Timeline Cards */}
      <div className="space-y-4">
        <h3 className="text-base font-bold font-heading text-stone-900">
          ประวัติการตรวจสุขภาพย้อนหลังทั้งหมด ({monkChecks.length} ครั้ง)
        </h3>

        <div className="space-y-4">
          {monkChecks
            .slice()
            .reverse()
            .map((check) => {
              const statusCfg = HEALTH_STATUS_LABELS[check.healthStatus];
              return (
                <div
                  key={check.id}
                  className="bg-white rounded-2xl p-5 shadow-xs border border-stone-200 space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-stone-100 gap-2">
                    <div className="flex items-center space-x-2">
                      <div className="p-2 bg-emerald-100 text-emerald-800 rounded-xl font-bold text-sm font-heading">
                        พ.ศ. {check.year}
                      </div>
                      <div>
                        <div className="text-xs text-stone-500">
                          วันที่ตรวจ: <strong className="text-stone-800">{check.checkDate}</strong>
                        </div>
                        <div className="text-[11px] text-stone-400">
                          หน่วยงาน: {check.healthServiceUnit}
                        </div>
                      </div>
                    </div>

                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${statusCfg.bg} ${statusCfg.color} self-start sm:self-auto`}
                    >
                      {statusCfg.label}
                    </span>
                  </div>

                  {/* Vitals Summary Row */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 text-xs">
                    <div className="bg-stone-50 p-2 rounded-lg">
                      <span className="text-[10px] text-stone-400 block">น้ำหนัก/ส่วนสูง</span>
                      <span className="font-semibold text-stone-800">
                        {check.weight || '—'} กก. / {check.height || '—'} ซม.
                      </span>
                    </div>

                    <div className="bg-stone-50 p-2 rounded-lg">
                      <span className="text-[10px] text-stone-400 block">BMI / รอบเอว</span>
                      <span className="font-semibold text-stone-800">
                        {check.bmi || '—'} / {check.waist || '—'} ซม.
                      </span>
                    </div>

                    <div className="bg-stone-50 p-2 rounded-lg">
                      <span className="text-[10px] text-stone-400 block">ความดันโลหิต</span>
                      <span className="font-semibold text-stone-800">
                        {check.systolic && check.diastolic ? `${check.systolic}/${check.diastolic}` : '—'}
                      </span>
                    </div>

                    <div className="bg-stone-50 p-2 rounded-lg">
                      <span className="text-[10px] text-stone-400 block">น้ำตาล (FBS)</span>
                      <span className="font-semibold text-stone-800">
                        {check.bloodSugar || '—'} mg/dL
                      </span>
                    </div>

                    <div className="bg-stone-50 p-2 rounded-lg">
                      <span className="text-[10px] text-stone-400 block">Cholesterol</span>
                      <span className="font-semibold text-stone-800">
                        {check.cholesterol || '—'} mg/dL
                      </span>
                    </div>

                    <div className="bg-stone-50 p-2 rounded-lg">
                      <span className="text-[10px] text-stone-400 block">Creatinine / eGFR</span>
                      <span className="font-semibold text-stone-800">
                        {check.creatinine || '—'} / {check.egfr || '—'}
                      </span>
                    </div>

                    <div className="bg-stone-50 p-2 rounded-lg">
                      <span className="text-[10px] text-stone-400 block">สูบบุหรี่</span>
                      <span className="font-semibold text-stone-800">
                        {SMOKING_LABELS[check.smokingStatus]}
                      </span>
                    </div>
                  </div>

                  {/* Behaviors row */}
                  <div className="text-xs text-stone-600 bg-stone-50/70 p-3 rounded-xl border border-stone-100 space-y-1">
                    <div>
                      <strong>พฤติกรรมอาหาร:</strong> หวาน ({FREQUENCY_LABELS[check.sweetFood]}), มัน (
                      {FREQUENCY_LABELS[check.fattyFood]}), เค็ม ({FREQUENCY_LABELS[check.saltyFood]}), เผ็ด (
                      {FREQUENCY_LABELS[check.spicyFood]})
                    </div>
                    <div>
                      <strong>กิจกรรม & สมาธิ:</strong> ออกกำลังกาย {check.exerciseDaysPerWeek} วัน/สัปดาห์ | เจริญสติ{' '}
                      {check.meditationDaysPerWeek} วัน/สัปดาห์ ({MEDITATION_DURATION_LABELS[check.meditationDuration]})
                    </div>
                    {check.recommendation && (
                      <div className="text-emerald-900 pt-1">
                        <strong>คำแนะนำ:</strong> {check.recommendation}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
};
