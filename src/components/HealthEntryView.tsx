import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import {
  currentBuddhistYear,
  getHealthEntryYearOptions,
  formatBuddhistYearLabel,
} from '../utils/buddhistYear';
import {
  ClipboardCheck,
  UserPlus,
  HeartPulse,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Stethoscope,
  Sparkles,
  RotateCcw,
  Eye,
  Info,
  Calendar,
  Loader2,
} from 'lucide-react';
import {
  HealthStatus,
  FrequencyLevel,
  SmokingStatus,
  SleepDuration,
  SleepQuality,
  MeditationDuration,
  FruitVegFrequency,
  CHRONIC_DISEASE_OPTIONS,
  EXERCISE_OPTIONS,
  FREQUENCY_LABELS,
  SMOKING_LABELS,
  SLEEP_HOURS_LABELS,
  SLEEP_QUALITY_LABELS,
  MEDITATION_DURATION_LABELS,
  FRUIT_VEG_LABELS,
  HEALTH_STATUS_LABELS,
  Monk,
} from '../types';
import { AddMonkModal } from './AddMonkModal';

export const HealthEntryView: React.FC = () => {
  const {
    currentUser,
    temples,
    monks,
    healthChecks,
    addHealthCheck,
    refreshHealthChecks,
    prefillHealthEntry,
    setPrefillHealthEntry,
    setActiveTab,
    setSelectedMonkId,
  } = useApp();

  // Header State
  const [templeId, setTempleId] = useState<string>(() => {
    if (currentUser?.role === 'temple_admin') {
      return currentUser.templeId || '';
    }
    return prefillHealthEntry?.templeId || '';
  });

  const [year, setYear] = useState<number>(prefillHealthEntry?.year || currentBuddhistYear);
  const yearOptions = useMemo(() => {
    const existing = healthChecks.map((hc) => hc.year);
    if (prefillHealthEntry?.year) {
      existing.push(prefillHealthEntry.year);
    }
    return getHealthEntryYearOptions(existing);
  }, [healthChecks, prefillHealthEntry?.year]);
  const [checkDate, setCheckDate] = useState<string>(() => {
    if (prefillHealthEntry?.checkDate) return prefillHealthEntry.checkDate;
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  });

  const [healthServiceUnit, setHealthServiceUnit] = useState<string>('');
  const [selectedMonkIdLocal, setSelectedMonkIdLocal] = useState<string>(
    prefillHealthEntry?.monkId || ''
  );
  const [searchMonkQuery, setSearchMonkQuery] = useState('');

  // Add Monk Modal State
  const [isAddMonkOpen, setIsAddMonkOpen] = useState(false);

  // Section 2: Health Measurements (Number or empty)
  const [weight, setWeight] = useState<string>('');
  const [height, setHeight] = useState<string>('');
  const [waist, setWaist] = useState<string>('');
  const [systolic, setSystolic] = useState<string>('');
  const [diastolic, setDiastolic] = useState<string>('');
  const [bloodSugar, setBloodSugar] = useState<string>('');
  const [cholesterol, setCholesterol] = useState<string>('');
  const [triglyceride, setTriglyceride] = useState<string>('');
  const [hdl, setHdl] = useState<string>('');
  const [ldl, setLdl] = useState<string>('');
  const [creatinine, setCreatinine] = useState<string>('');
  const [egfr, setEgfr] = useState<string>('');
  const [uricAcid, setUricAcid] = useState<string>('');

  // Section 3: Chronic Diseases
  const [hasChronicDisease, setHasChronicDisease] = useState<'none' | 'has'>('none');
  const [chronicDiseases, setChronicDiseases] = useState<string[]>([]);
  const [otherChronicDisease, setOtherChronicDisease] = useState<string>('');

  // Section 4: Health Behaviors
  const [sweetFood, setSweetFood] = useState<FrequencyLevel>('sometimes');
  const [fattyFood, setFattyFood] = useState<FrequencyLevel>('sometimes');
  const [saltyFood, setSaltyFood] = useState<FrequencyLevel>('sometimes');
  const [spicyFood, setSpicyFood] = useState<FrequencyLevel>('sometimes');

  const [exerciseTypes, setExerciseTypes] = useState<string[]>(['เดิน']);
  const [exerciseDaysPerWeek, setExerciseDaysPerWeek] = useState<number>(3);
  const [meditationDaysPerWeek, setMeditationDaysPerWeek] = useState<number>(5);
  const [meditationDuration, setMeditationDuration] = useState<MeditationDuration>('15_30');

  const [smokingStatus, setSmokingStatus] = useState<SmokingStatus>('never');
  const [cigarettesPerDay, setCigarettesPerDay] = useState<string>('');

  const [sleepHours, setSleepHours] = useState<SleepDuration>('7_8');
  const [sleepQuality, setSleepQuality] = useState<SleepQuality>('sufficient');
  const [fruitVegetableFrequency, setFruitVegetableFrequency] =
    useState<FruitVegFrequency>('3_4_days');

  // Summary
  const [healthStatus, setHealthStatus] = useState<HealthStatus>('normal');
  const [followUpRequired, setFollowUpRequired] = useState<'no' | 'yes'>('no');
  const [recommendation, setRecommendation] = useState<string>('');

  // UI state
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [savedMonkInfo, setSavedMonkInfo] = useState<{ id: string; name: string; monkName: string } | null>(null);

  // Synchronize health service unit with selected temple
  useEffect(() => {
    const t = temples.find((item) => item.id === templeId);
    if (t) {
      setHealthServiceUnit(t.healthServiceUnit);
    }
  }, [templeId, temples]);

  // If user role is temple_admin, lock templeId
  useEffect(() => {
    if (currentUser?.role === 'temple_admin') {
      setTempleId(currentUser.templeId || '');
    }
  }, [currentUser?.role, currentUser?.templeId]);

  // Monks in selected temple
  const templeMonks = useMemo(() => {
    const activeTempleId = currentUser?.role === 'temple_admin' ? (currentUser.templeId || '') : templeId;
    return monks.filter((m) => m.templeId === activeTempleId);
  }, [monks, templeId, currentUser?.role, currentUser?.templeId]);

  const filteredTempleMonks = useMemo(() => {
    if (!searchMonkQuery.trim()) return templeMonks;
    const q = searchMonkQuery.toLowerCase();
    return templeMonks.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        m.monkName.toLowerCase().includes(q) ||
        m.id.toLowerCase().includes(q)
    );
  }, [templeMonks, searchMonkQuery]);

  // Selected Monk Object
  const currentMonk = useMemo(() => {
    return monks.find((m) => m.id === selectedMonkIdLocal);
  }, [monks, selectedMonkIdLocal]);

  // Existing check for this monk in this year (exact match monkId and year)
  const existingCheck = useMemo(() => {
    if (!selectedMonkIdLocal || !year) return null;
    return (
      healthChecks.find(
        (hc) =>
          hc.monkId === selectedMonkIdLocal &&
          Number(hc.year) === Number(year)
      ) || null
    );
  }, [healthChecks, selectedMonkIdLocal, year]);

  // When selecting a monk or changing year, populate if existing check exists, else fully reset
  useEffect(() => {
    setSaveSuccess(false);

    if (existingCheck) {
      setWeight(existingCheck.weight !== null && existingCheck.weight !== undefined ? String(existingCheck.weight) : '');
      setHeight(existingCheck.height !== null && existingCheck.height !== undefined ? String(existingCheck.height) : '');
      setWaist(existingCheck.waist !== null && existingCheck.waist !== undefined ? String(existingCheck.waist) : '');
      setSystolic(existingCheck.systolic !== null && existingCheck.systolic !== undefined ? String(existingCheck.systolic) : '');
      setDiastolic(existingCheck.diastolic !== null && existingCheck.diastolic !== undefined ? String(existingCheck.diastolic) : '');
      setBloodSugar(existingCheck.bloodSugar !== null && existingCheck.bloodSugar !== undefined ? String(existingCheck.bloodSugar) : '');
      setCholesterol(existingCheck.cholesterol !== null && existingCheck.cholesterol !== undefined ? String(existingCheck.cholesterol) : '');
      setTriglyceride(existingCheck.triglyceride !== null && existingCheck.triglyceride !== undefined ? String(existingCheck.triglyceride) : '');
      setHdl(existingCheck.hdl !== null && existingCheck.hdl !== undefined ? String(existingCheck.hdl) : '');
      setLdl(existingCheck.ldl !== null && existingCheck.ldl !== undefined ? String(existingCheck.ldl) : '');
      setCreatinine(existingCheck.creatinine !== null && existingCheck.creatinine !== undefined ? String(existingCheck.creatinine) : '');
      setEgfr(existingCheck.egfr !== null && existingCheck.egfr !== undefined ? String(existingCheck.egfr) : '');
      setUricAcid(existingCheck.uricAcid !== null && existingCheck.uricAcid !== undefined ? String(existingCheck.uricAcid) : '');

      setHasChronicDisease(existingCheck.hasChronicDisease || 'none');
      setChronicDiseases(existingCheck.chronicDiseases || []);
      setOtherChronicDisease(existingCheck.otherChronicDisease || '');

      setSweetFood(existingCheck.sweetFood || 'sometimes');
      setFattyFood(existingCheck.fattyFood || 'sometimes');
      setSaltyFood(existingCheck.saltyFood || 'sometimes');
      setSpicyFood(existingCheck.spicyFood || 'sometimes');

      setExerciseTypes(existingCheck.exerciseTypes || ['เดิน']);
      setExerciseDaysPerWeek(existingCheck.exerciseDaysPerWeek ?? 3);
      setMeditationDaysPerWeek(existingCheck.meditationDaysPerWeek ?? 5);
      setMeditationDuration(existingCheck.meditationDuration || '15_30');

      setSmokingStatus(existingCheck.smokingStatus || 'never');
      setCigarettesPerDay(
        existingCheck.cigarettesPerDay !== null && existingCheck.cigarettesPerDay !== undefined
          ? String(existingCheck.cigarettesPerDay)
          : ''
      );

      setSleepHours(existingCheck.sleepHours || '7_8');
      setSleepQuality(existingCheck.sleepQuality || 'sufficient');
      setFruitVegetableFrequency(existingCheck.fruitVegetableFrequency || '3_4_days');

      setHealthStatus(existingCheck.healthStatus || 'normal');
      setFollowUpRequired(existingCheck.followUpRequired || 'no');
      setRecommendation(existingCheck.recommendation || '');

      if (existingCheck.checkDate) {
        setCheckDate(existingCheck.checkDate);
      }
      if (existingCheck.healthServiceUnit) {
        setHealthServiceUnit(existingCheck.healthServiceUnit);
      }
    } else {
      // Clear measurements for new entry - do not carry values from the previously selected year
      setWeight('');
      setHeight('');
      setWaist('');
      setSystolic('');
      setDiastolic('');
      setBloodSugar('');
      setCholesterol('');
      setTriglyceride('');
      setHdl('');
      setLdl('');
      setCreatinine('');
      setEgfr('');
      setUricAcid('');
      setHasChronicDisease('none');
      setChronicDiseases([]);
      setOtherChronicDisease('');
      setSweetFood('sometimes');
      setFattyFood('sometimes');
      setSaltyFood('sometimes');
      setSpicyFood('sometimes');
      setExerciseTypes(['เดิน', 'กวาดลานวัด / ทำงานภายในวัด']);
      setExerciseDaysPerWeek(3);
      setMeditationDaysPerWeek(5);
      setMeditationDuration('15_30');
      setSmokingStatus('never');
      setCigarettesPerDay('');
      setSleepHours('7_8');
      setSleepQuality('sufficient');
      setFruitVegetableFrequency('3_4_days');
      setHealthStatus('normal');
      setFollowUpRequired('no');
      setRecommendation('');
    }
  }, [selectedMonkIdLocal, year, existingCheck]);

  // Auto-calculated BMI
  const computedBmi = useMemo(() => {
    const w = parseFloat(weight);
    const h = parseFloat(height);
    if (w > 0 && h > 0) {
      const hm = h / 100;
      return parseFloat((w / (hm * hm)).toFixed(1));
    }
    return null;
  }, [weight, height]);

  // Smart suggestion for health status
  const suggestedStatus = useMemo((): HealthStatus => {
    const sys = parseFloat(systolic);
    const dia = parseFloat(diastolic);
    const bs = parseFloat(bloodSugar);
    const chol = parseFloat(cholesterol);
    const bmiVal = computedBmi;

    if (
      (sys >= 160 || dia >= 100 || bs >= 180 || chol >= 260) ||
      (hasChronicDisease === 'has' && (bs >= 150 || sys >= 150))
    ) {
      return 'medical_attention';
    }
    if (
      (sys >= 140 || dia >= 90 || bs >= 126 || chol >= 220 || (bmiVal && bmiVal >= 28)) ||
      hasChronicDisease === 'has'
    ) {
      return 'risk';
    }
    if (
      (sys >= 130 || dia >= 85 || bs >= 100 || chol >= 200 || (bmiVal && bmiVal >= 25)) ||
      sweetFood === 'often' ||
      sweetFood === 'regularly' ||
      smokingStatus === 'smoking'
    ) {
      return 'monitor';
    }
    return 'normal';
  }, [systolic, diastolic, bloodSugar, cholesterol, computedBmi, hasChronicDisease, sweetFood, smokingStatus]);

  const handleToggleChronicDisease = (disease: string) => {
    setChronicDiseases((prev) =>
      prev.includes(disease) ? prev.filter((d) => d !== disease) : [...prev, disease]
    );
  };

  const handleToggleExerciseType = (type: string) => {
    setExerciseTypes((prev) => {
      if (type === 'ไม่ได้ออกกำลังกายเป็นประจำ') {
        return ['ไม่ได้ออกกำลังกายเป็นประจำ'];
      }
      const filtered = prev.filter((t) => t !== 'ไม่ได้ออกกำลังกายเป็นประจำ');
      return filtered.includes(type) ? filtered.filter((t) => t !== type) : [...filtered, type];
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedMonkIdLocal) {
      alert('กรุณาเลือกพระสงฆ์ที่เข้ารับการตรวจ');
      return;
    }

    try {
      setIsSaving(true);
      setSaveError(null);

      // 4. temple_admin must force:
      // payload.templeId = currentUser.templeId
      // Never use temples[0], fallback IDs, or a stale selected temple.
      let effectiveTempleId = currentMonk?.templeId || templeId || '';
      if (currentUser?.role === 'temple_admin') {
        if (!currentUser.templeId) {
          throw new Error('ไม่พบรหัสวัดของผู้ดูแลวัด (currentUser.templeId is missing)');
        }
        effectiveTempleId = currentUser.templeId;
      }

      // 3. Before saving, verify and log temporarily:
      console.log("currentUser.templeId", currentUser?.templeId);
      console.log("monk.templeId", currentMonk?.templeId);
      console.log("payload.templeId", effectiveTempleId);
      console.log("monkId", selectedMonkIdLocal);
      console.log("year", Number(year));

      const currentTemple = temples.find((t) => t.id === effectiveTempleId);

      const payload = {
        monkId: selectedMonkIdLocal,
        templeId: effectiveTempleId,
        year: Number(year),
        checkDate,
        healthServiceUnit: healthServiceUnit || currentTemple?.healthServiceUnit || 'หน่วยบริการสุขภาพ',

        // Results (null if not entered - never 0 for empty, never undefined)
        weight: weight.trim() !== '' ? parseFloat(weight) : null,
        height: height.trim() !== '' ? parseFloat(height) : null,
        bmi: computedBmi,
        waist: waist.trim() !== '' ? parseFloat(waist) : null,
        systolic: systolic.trim() !== '' ? parseFloat(systolic) : null,
        diastolic: diastolic.trim() !== '' ? parseFloat(diastolic) : null,
        bloodSugar: bloodSugar.trim() !== '' ? parseFloat(bloodSugar) : null,
        cholesterol: cholesterol.trim() !== '' ? parseFloat(cholesterol) : null,
        triglyceride: triglyceride.trim() !== '' ? parseFloat(triglyceride) : null,
        hdl: hdl.trim() !== '' ? parseFloat(hdl) : null,
        ldl: ldl.trim() !== '' ? parseFloat(ldl) : null,
        creatinine: creatinine.trim() !== '' ? parseFloat(creatinine) : null,
        egfr: egfr.trim() !== '' ? parseFloat(egfr) : null,
        uricAcid: uricAcid.trim() !== '' ? parseFloat(uricAcid) : null,

        hasChronicDisease,
        chronicDiseases,
        otherChronicDisease: hasChronicDisease === 'has' && otherChronicDisease.trim() ? otherChronicDisease.trim() : null,

        sweetFood,
        fattyFood,
        saltyFood,
        spicyFood,
        exerciseTypes,
        exerciseDaysPerWeek: Number(exerciseDaysPerWeek) || 0,
        meditationDaysPerWeek: Number(meditationDaysPerWeek) || 0,
        meditationDuration,
        smokingStatus,
        cigarettesPerDay: smokingStatus === 'smoking' && cigarettesPerDay.trim() !== '' ? Number(cigarettesPerDay) : null,
        sleepHours,
        sleepQuality,
        fruitVegetableFrequency,

        healthStatus,
        followUpRequired,
        recommendation: recommendation.trim() || null,

        templeName: currentTemple?.name || '',
        province: currentTemple?.province || currentMonk?.province || '',
        region: currentTemple?.region || 'กลาง',
      };

      await addHealthCheck(payload);
      await refreshHealthChecks();

      if (currentMonk) {
        setSavedMonkInfo({
          id: currentMonk.id,
          name: currentMonk.name,
          monkName: currentMonk.monkName,
        });
      }

      setSaveSuccess(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      if (err?.code === 'permission-denied' || String(err?.message || '').includes('permission')) {
        console.error('[PermissionDenied] setDoc create/update operation failed in HealthEntryView:', {
          monkId: selectedMonkIdLocal,
          year: Number(year),
          currentUserRole: currentUser?.role,
          currentUserTempleId: currentUser?.templeId,
          error: err,
        });
      } else {
        console.error('Error saving health check:', err);
      }
      setSaveError(err?.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูลสุขภาพ');
    } finally {
      setIsSaving(false);
    }
  };

  const handleNextMonk = () => {
    setSaveSuccess(false);
    setSelectedMonkIdLocal('');
    setSearchMonkQuery('');
    // Keep templeId, year, checkDate, healthServiceUnit intact!
  };

  const handleViewMonkDetail = (monkId: string) => {
    setSelectedMonkId(monkId);
    setActiveTab('monk_detail');
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      {/* Top Banner */}
      <div className="bg-emerald-800 text-white rounded-2xl p-5 sm:p-6 shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-amber-400 text-stone-900 text-[11px] font-bold px-2.5 py-0.5 rounded-full uppercase font-heading">
              บันทึกผลตรวจประจำปี
            </span>
            <span className="text-emerald-200 text-xs font-mono">
              เชื่อมโยงข้อมูลด้วย monkId เดิมตลอด
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold font-heading text-white tracking-tight">
            กรอกข้อมูลผลตรวจสุขภาพพระสงฆ์
          </h1>
          <p className="text-emerald-100 text-xs sm:text-sm max-w-xl">
            ออกแบบให้กรอกได้รวดเร็ว กดเลือกเป็นหลัก ช่องที่ไม่มีผลสามารถเว้นว่างได้
          </p>
        </div>
      </div>

      {/* Success Banner */}
      {saveSuccess && (
        <div className="bg-emerald-50 border-2 border-emerald-500 text-emerald-900 p-6 rounded-2xl shadow-lg animate-in fade-in slide-in-from-top-4 duration-200">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center space-x-3 text-center sm:text-left">
              <div className="w-12 h-12 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-lg font-bold font-heading text-emerald-950">
                  บันทึกข้อมูลเรียบร้อยแล้ว!
                </h3>
                <p className="text-sm text-emerald-800">
                  บันทึกผลตรวจสุขภาพปี พ.ศ. {year} ของ {savedMonkInfo?.name} ({savedMonkInfo?.monkName}) เรียบร้อยแล้ว
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 justify-center sm:justify-end">
              <button
                id="next-monk-btn"
                onClick={handleNextMonk}
                className="px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-bold rounded-xl shadow-xs transition-colors cursor-pointer font-heading flex items-center gap-1.5"
              >
                <RotateCcw className="w-4 h-4" />
                <span>บันทึกพระรูปต่อไป</span>
              </button>
              {savedMonkInfo && (
                <button
                  id="view-saved-monk-btn"
                  onClick={() => handleViewMonkDetail(savedMonkInfo.id)}
                  className="px-4 py-2.5 bg-white border border-emerald-300 hover:bg-emerald-100 text-emerald-900 text-sm font-semibold rounded-xl transition-colors flex items-center gap-1.5"
                >
                  <Eye className="w-4 h-4 text-emerald-700" />
                  <span>ดูประวัติสุขภาพรูปนี้</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Form */}
      <form onSubmit={handleSave} className="space-y-6">
        {/* Header Selection Card: วัด, ปี, วันที่, หน่วยงาน, พระสงฆ์ */}
        <div className="bg-white rounded-2xl p-5 shadow-xs border border-stone-200 space-y-4">
          <div className="flex items-center gap-2 text-stone-800 font-bold font-heading text-sm pb-2 border-b border-stone-100">
            <ClipboardCheck className="w-4 h-4 text-emerald-700" />
            <span>ข้อมูลการตรวจสุขภาพ</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* วัด */}
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                วัดต้นสังกัด <span className="text-rose-500">*</span>
              </label>
              <select
                id="entry-temple-select"
                value={templeId}
                onChange={(e) => {
                  setTempleId(e.target.value);
                  setSelectedMonkIdLocal('');
                }}
                disabled={currentUser?.role === 'temple_admin'}
                className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-sm text-stone-800 font-medium focus:ring-2 focus:ring-emerald-600 focus:outline-none disabled:bg-stone-100"
                required
              >
                {currentUser?.role !== 'temple_admin' && (
                  <option value="">-- กรุณาเลือกวัด --</option>
                )}
                {temples.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.province})
                  </option>
                ))}
              </select>
            </div>

            {/* ปีที่ตรวจ */}
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                ปีที่ตรวจสุขภาพ <span className="text-rose-500">*</span>
              </label>
              <select
                id="entry-year-select"
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-sm font-bold text-stone-800 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                required
              >
                {yearOptions.map((yr) => (
                  <option key={yr} value={yr}>
                    {formatBuddhistYearLabel(yr)}
                  </option>
                ))}
              </select>
            </div>

            {/* วันที่ตรวจ */}
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                วันที่ตรวจสุขภาพ <span className="text-rose-500">*</span>
              </label>
              <input
                id="entry-date-input"
                type="date"
                value={checkDate}
                onChange={(e) => setCheckDate(e.target.value)}
                className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-sm text-stone-800 focus:ring-2 focus:ring-emerald-600 focus:outline-none font-sans"
                required
              />
            </div>

            {/* หน่วยงานที่ตรวจ */}
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                หน่วยงาน/รพ. ที่ตรวจ
              </label>
              <input
                id="entry-service-unit-input"
                type="text"
                value={healthServiceUnit}
                onChange={(e) => setHealthServiceUnit(e.target.value)}
                placeholder="เช่น โรงพยาบาลสงฆ์"
                className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-sm text-stone-800 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
              />
            </div>
          </div>

          {/* เลือกพระสงฆ์ */}
          <div className="pt-2 border-t border-stone-100">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
                <span>เลือกพระสงฆ์ที่เข้ารับการตรวจ</span>
                <span className="text-rose-500">*</span>
              </label>

              <button
                type="button"
                id="add-new-monk-btn"
                onClick={() => setIsAddMonkOpen(true)}
                className="text-xs text-emerald-700 hover:text-emerald-900 font-semibold flex items-center gap-1 hover:underline cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>+ เพิ่มพระสงฆ์ใหม่</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <select
                  id="entry-monk-select"
                  value={selectedMonkIdLocal}
                  onChange={(e) => setSelectedMonkIdLocal(e.target.value)}
                  className="w-full bg-stone-50 border-2 border-emerald-600/60 rounded-xl px-3 py-2.5 text-sm font-semibold text-stone-900 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                  required
                >
                  <option value="">-- กรุณาเลือกพระสงฆ์ ({templeMonks.length} รูปในวัดนี้) --</option>
                  {filteredTempleMonks.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.monkName}) — อายุ {m.age} ปี / {m.monasticYears} พรรษา [{m.id}]
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <input
                  type="text"
                  placeholder="🔍 ค้นหารายชื่อ/ฉายาในวัด..."
                  value={searchMonkQuery}
                  onChange={(e) => setSearchMonkQuery(e.target.value)}
                  className="w-full bg-white border border-stone-300 rounded-xl px-3 py-2 text-xs text-stone-700 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                />
              </div>
            </div>

            {existingCheck && (
              <div className="mt-2 bg-amber-50 border border-amber-200 rounded-xl p-2.5 text-xs text-amber-900 flex items-center gap-2">
                <Info className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  พระรูปนี้มีผลตรวจปี พ.ศ. {year} บันทึกไว้อยู่แล้ว การกดบันทึกจะเป็นการอัปเดตผลตรวจของปีนี้
                </span>
              </div>
            )}
          </div>
        </div>

        {/* ส่วนที่ 1: ข้อมูลทั่วไป (Auto-filled) */}
        <div className="bg-stone-100/80 rounded-2xl p-4 border border-stone-200">
          <div className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-2 font-heading">
            ส่วนที่ 1: ข้อมูลทั่วไป (ดึงจากทะเบียนอัตโนมัติ ไม่ต้องกรอกซ้ำ)
          </div>

          {currentMonk ? (
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 bg-white p-3.5 rounded-xl border border-stone-200 text-xs">
              <div>
                <span className="text-stone-400 block text-[11px]">รหัสพระสงฆ์</span>
                <span className="font-bold text-stone-800 font-mono text-sm">{currentMonk.id}</span>
              </div>
              <div>
                <span className="text-stone-400 block text-[11px]">ชื่อ</span>
                <span className="font-semibold text-stone-900">{currentMonk.name}</span>
              </div>
              <div>
                <span className="text-stone-400 block text-[11px]">ฉายา</span>
                <span className="font-semibold text-stone-900">{currentMonk.monkName}</span>
              </div>
              <div>
                <span className="text-stone-400 block text-[11px]">อายุ / พรรษา</span>
                <span className="font-semibold text-stone-900">
                  {currentMonk.age} ปี / {currentMonk.monasticYears} พรรษา
                </span>
              </div>
              <div className="col-span-2 sm:col-span-1">
                <span className="text-stone-400 block text-[11px]">วัดต้นสังกัด</span>
                <span className="font-semibold text-stone-900">
                  {temples.find((t) => t.id === currentMonk.templeId)?.name}
                </span>
              </div>
            </div>
          ) : (
            <div className="text-xs text-stone-500 italic bg-white p-3 rounded-xl text-center">
              กรุณาเลือกพระสงฆ์ด้านบนเพื่อแสดงข้อมูลทั่วไป
            </div>
          )}
        </div>

        {/* ส่วนที่ 2: ผลตรวจสุขภาพ (Measurements) */}
        <div className="bg-white rounded-2xl p-5 shadow-xs border border-stone-200 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-stone-100">
            <div className="flex items-center gap-2 text-stone-900 font-bold font-heading text-sm">
              <Activity className="w-4 h-4 text-emerald-700" />
              <span>ส่วนที่ 2: ผลตรวจสุขภาพ</span>
            </div>
            <span className="text-[11px] text-stone-500 bg-stone-100 px-2 py-0.5 rounded">
              ช่องที่ไม่มีผลให้เว้นว่างไว้ (ห้ามใส่ 0)
            </span>
          </div>

          {/* Primary physical & vitals */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {/* Weight */}
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                น้ำหนัก (กก.)
              </label>
              <input
                id="input-weight"
                type="number"
                step="0.1"
                min="30"
                max="200"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder="เช่น 75.5"
                className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-sm text-stone-900 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
              />
            </div>

            {/* Height */}
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                ส่วนสูง (ซม.)
              </label>
              <input
                id="input-height"
                type="number"
                step="0.5"
                min="120"
                max="220"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                placeholder="เช่น 170"
                className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-sm text-stone-900 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
              />
            </div>

            {/* Auto BMI */}
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                BMI (คำนวณอัตโนมัติ)
              </label>
              <div
                className={`w-full border rounded-xl px-3 py-2 text-sm font-bold flex items-center justify-between ${
                  computedBmi
                    ? computedBmi >= 25
                      ? 'bg-orange-50 border-orange-300 text-orange-900'
                      : 'bg-emerald-50 border-emerald-300 text-emerald-900'
                    : 'bg-stone-100 border-stone-200 text-stone-400'
                }`}
              >
                <span>{computedBmi ? computedBmi : '—'}</span>
                {computedBmi && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded font-normal">
                    {computedBmi >= 25 ? 'น้ำหนักเกิน' : 'ปกติ'}
                  </span>
                )}
              </div>
            </div>

            {/* Waist */}
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                รอบเอว (ซม.)
              </label>
              <input
                id="input-waist"
                type="number"
                step="0.5"
                min="50"
                max="180"
                value={waist}
                onChange={(e) => setWaist(e.target.value)}
                placeholder="เช่น 88"
                className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-sm text-stone-900 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
              />
            </div>

            {/* Blood Pressure Systolic */}
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                ความดันตัวบน (มม.ปรอท)
              </label>
              <input
                id="input-systolic"
                type="number"
                min="70"
                max="250"
                value={systolic}
                onChange={(e) => setSystolic(e.target.value)}
                placeholder="เช่น 120"
                className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-sm text-stone-900 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
              />
            </div>

            {/* Blood Pressure Diastolic */}
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                ความดันตัวล่าง (มม.ปรอท)
              </label>
              <input
                id="input-diastolic"
                type="number"
                min="40"
                max="150"
                value={diastolic}
                onChange={(e) => setDiastolic(e.target.value)}
                placeholder="เช่น 80"
                className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-sm text-stone-900 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
              />
            </div>

            {/* Blood Sugar */}
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                น้ำตาลในเลือด (มก./ดล.)
              </label>
              <input
                id="input-blood-sugar"
                type="number"
                min="40"
                max="500"
                value={bloodSugar}
                onChange={(e) => setBloodSugar(e.target.value)}
                placeholder="เช่น 98"
                className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-sm text-stone-900 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
              />
            </div>

            {/* Cholesterol */}
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Cholesterol (มก./ดล.)
              </label>
              <input
                id="input-cholesterol"
                type="number"
                min="50"
                max="500"
                value={cholesterol}
                onChange={(e) => setCholesterol(e.target.value)}
                placeholder="เช่น 195"
                className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-sm text-stone-900 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
              />
            </div>
          </div>

          {/* Secondary Lab results */}
          <div className="pt-3 border-t border-stone-100">
            <div className="text-xs font-semibold text-stone-500 mb-2">
              ผลตรวจทางห้องปฏิบัติการเพิ่มเติม (ถ้ามี)
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-stone-600 mb-1">Triglyceride</label>
                <input
                  type="number"
                  value={triglyceride}
                  onChange={(e) => setTriglyceride(e.target.value)}
                  placeholder="เช่น 140"
                  className="w-full bg-stone-50 border border-stone-300 rounded-lg px-2.5 py-1.5 text-xs text-stone-900 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-stone-600 mb-1">HDL (ไขมันดี)</label>
                <input
                  type="number"
                  value={hdl}
                  onChange={(e) => setHdl(e.target.value)}
                  placeholder="เช่น 50"
                  className="w-full bg-stone-50 border border-stone-300 rounded-lg px-2.5 py-1.5 text-xs text-stone-900 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-stone-600 mb-1">LDL (ไขมันร้าย)</label>
                <input
                  type="number"
                  value={ldl}
                  onChange={(e) => setLdl(e.target.value)}
                  placeholder="เช่น 120"
                  className="w-full bg-stone-50 border border-stone-300 rounded-lg px-2.5 py-1.5 text-xs text-stone-900 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-stone-600 mb-1">Creatinine (ไต)</label>
                <input
                  type="number"
                  step="0.01"
                  value={creatinine}
                  onChange={(e) => setCreatinine(e.target.value)}
                  placeholder="เช่น 0.95"
                  className="w-full bg-stone-50 border border-stone-300 rounded-lg px-2.5 py-1.5 text-xs text-stone-900 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-stone-600 mb-1">eGFR (การกรองไต)</label>
                <input
                  type="number"
                  step="0.1"
                  value={egfr}
                  onChange={(e) => setEgfr(e.target.value)}
                  placeholder="เช่น 88"
                  className="w-full bg-stone-50 border border-stone-300 rounded-lg px-2.5 py-1.5 text-xs text-stone-900 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-stone-600 mb-1">Uric Acid (เกาต์)</label>
                <input
                  type="number"
                  step="0.1"
                  value={uricAcid}
                  onChange={(e) => setUricAcid(e.target.value)}
                  placeholder="เช่น 5.8"
                  className="w-full bg-stone-50 border border-stone-300 rounded-lg px-2.5 py-1.5 text-xs text-stone-900 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                />
              </div>
            </div>
          </div>
        </div>

        {/* ส่วนที่ 3: โรคประจำตัว */}
        <div className="bg-white rounded-2xl p-5 shadow-xs border border-stone-200 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-stone-100">
            <div className="flex items-center gap-2 text-stone-900 font-bold font-heading text-sm">
              <Stethoscope className="w-4 h-4 text-emerald-700" />
              <span>ส่วนที่ 3: โรคประจำตัว</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-800 mb-2">
              ปัจจุบันท่านมีโรคประจำตัวหรือไม่?
            </label>
            <div className="flex items-center space-x-3">
              <button
                type="button"
                id="chronic-none-btn"
                onClick={() => {
                  setHasChronicDisease('none');
                  setChronicDiseases([]);
                }}
                className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${
                  hasChronicDisease === 'none'
                    ? 'bg-emerald-700 text-white border-emerald-800 shadow-xs'
                    : 'bg-stone-50 text-stone-700 border-stone-300 hover:bg-stone-100'
                }`}
              >
                ✓ ไม่มีโรคประจำตัว
              </button>

              <button
                type="button"
                id="chronic-has-btn"
                onClick={() => setHasChronicDisease('has')}
                className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${
                  hasChronicDisease === 'has'
                    ? 'bg-amber-600 text-white border-amber-700 shadow-xs'
                    : 'bg-stone-50 text-stone-700 border-stone-300 hover:bg-stone-100'
                }`}
              >
                + มีโรคประจำตัว
              </button>
            </div>
          </div>

          {hasChronicDisease === 'has' && (
            <div className="bg-amber-50/60 p-4 rounded-xl border border-amber-200 space-y-3 animate-in fade-in duration-150">
              <div className="text-xs font-bold text-amber-900">
                เลือกโรคประจำตัว (เลือกได้มากกว่า 1 ข้อ):
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {CHRONIC_DISEASE_OPTIONS.map((disease) => {
                  const isChecked = chronicDiseases.includes(disease);
                  return (
                    <label
                      key={disease}
                      className={`flex items-center space-x-2 p-2.5 rounded-lg border text-xs font-medium cursor-pointer transition-colors ${
                        isChecked
                          ? 'bg-amber-200/80 border-amber-400 text-amber-950 font-bold'
                          : 'bg-white border-stone-200 text-stone-700 hover:bg-stone-50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleToggleChronicDisease(disease)}
                        className="rounded text-amber-600 focus:ring-amber-500"
                      />
                      <span>{disease}</span>
                    </label>
                  );
                })}
              </div>

              {chronicDiseases.includes('อื่น ๆ') && (
                <div className="pt-2">
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    ระบุโรคประจำตัวอื่น ๆ เพิ่มเติม
                  </label>
                  <input
                    type="text"
                    value={otherChronicDisease}
                    onChange={(e) => setOtherChronicDisease(e.target.value)}
                    placeholder="เช่น ภูมิแพ้, เกาต์, ต้อกระจก"
                    className="w-full bg-white border border-stone-300 rounded-lg px-3 py-2 text-xs text-stone-800 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {/* ส่วนที่ 4: พฤติกรรมสุขภาพ */}
        <div className="bg-white rounded-2xl p-5 shadow-xs border border-stone-200 space-y-6">
          <div className="flex items-center justify-between pb-2 border-b border-stone-100">
            <div className="flex items-center gap-2 text-stone-900 font-bold font-heading text-sm">
              <HeartPulse className="w-4 h-4 text-emerald-700" />
              <span>ส่วนที่ 4: พฤติกรรมสุขภาพ (เน้นกดเลือก)</span>
            </div>
          </div>

          {/* 4.1 การฉันอาหาร */}
          <div>
            <h4 className="text-xs font-bold text-stone-800 mb-2 font-heading">
              4.1 การฉันอาหาร: โดยปกติ ท่านฉันอาหารลักษณะต่อไปนี้บ่อยเพียงใด?
            </h4>

            {/* Desktop Table View / Mobile Cards */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-stone-100 text-stone-700 border-b border-stone-200">
                    <th className="p-2.5 font-bold">พฤติกรรม</th>
                    <th className="p-2.5 text-center font-bold text-emerald-800">น้อย/ไม่ค่อย</th>
                    <th className="p-2.5 text-center font-bold text-stone-700">บางครั้ง</th>
                    <th className="p-2.5 text-center font-bold text-amber-800">บ่อย</th>
                    <th className="p-2.5 text-center font-bold text-rose-800">เป็นประจำ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {/* Sweet */}
                  <tr className="hover:bg-stone-50">
                    <td className="p-2.5 font-medium text-stone-900">อาหารหวาน / ขนมหวาน / น้ำหวาน</td>
                    {(['rarely', 'sometimes', 'often', 'regularly'] as FrequencyLevel[]).map((lvl) => (
                      <td key={lvl} className="p-2.5 text-center">
                        <input
                          type="radio"
                          name="sweetFood"
                          checked={sweetFood === lvl}
                          onChange={() => setSweetFood(lvl)}
                          className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                        />
                      </td>
                    ))}
                  </tr>

                  {/* Fatty */}
                  <tr className="hover:bg-stone-50">
                    <td className="p-2.5 font-medium text-stone-900">อาหารมัน / ของทอด / กะทิ</td>
                    {(['rarely', 'sometimes', 'often', 'regularly'] as FrequencyLevel[]).map((lvl) => (
                      <td key={lvl} className="p-2.5 text-center">
                        <input
                          type="radio"
                          name="fattyFood"
                          checked={fattyFood === lvl}
                          onChange={() => setFattyFood(lvl)}
                          className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                        />
                      </td>
                    ))}
                  </tr>

                  {/* Salty */}
                  <tr className="hover:bg-stone-50">
                    <td className="p-2.5 font-medium text-stone-900">อาหารเค็ม / น้ำปลา / ของหมักดอง</td>
                    {(['rarely', 'sometimes', 'often', 'regularly'] as FrequencyLevel[]).map((lvl) => (
                      <td key={lvl} className="p-2.5 text-center">
                        <input
                          type="radio"
                          name="saltyFood"
                          checked={saltyFood === lvl}
                          onChange={() => setSaltyFood(lvl)}
                          className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                        />
                      </td>
                    ))}
                  </tr>

                  {/* Spicy */}
                  <tr className="hover:bg-stone-50">
                    <td className="p-2.5 font-medium text-stone-900">อาหารเผ็ด / รสจัด</td>
                    {(['rarely', 'sometimes', 'often', 'regularly'] as FrequencyLevel[]).map((lvl) => (
                      <td key={lvl} className="p-2.5 text-center">
                        <input
                          type="radio"
                          name="spicyFood"
                          checked={spicyFood === lvl}
                          onChange={() => setSpicyFood(lvl)}
                          className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                        />
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* 4.2 การออกกำลังกาย */}
          <div className="pt-3 border-t border-stone-100 space-y-3">
            <h4 className="text-xs font-bold text-stone-800 font-heading">
              4.2 การออกกำลังกายหรือกิจกรรมทางกาย
            </h4>

            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1.5">
                ท่านมีกิจกรรมทางกายเป็นประจำด้วยวิธีใด? (เลือกได้หลายข้อ)
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {EXERCISE_OPTIONS.map((opt) => {
                  const isChecked = exerciseTypes.includes(opt);
                  return (
                    <label
                      key={opt}
                      className={`flex items-center space-x-2 p-2 rounded-lg border text-xs cursor-pointer transition-colors ${
                        isChecked
                          ? 'bg-emerald-50 border-emerald-400 text-emerald-950 font-bold'
                          : 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleToggleExerciseType(opt)}
                        className="rounded text-emerald-600 focus:ring-emerald-500"
                      />
                      <span>{opt}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1.5">
                โดยเฉลี่ยสัปดาห์ละกี่วัน?
              </label>
              <div className="flex items-center space-x-1 sm:space-x-2">
                {[0, 1, 2, 3, 4, 5, 6, 7].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setExerciseDaysPerWeek(num)}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg border transition-all ${
                      exerciseDaysPerWeek === num
                        ? 'bg-emerald-700 text-white border-emerald-800 shadow-xs'
                        : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                    }`}
                  >
                    {num} วัน
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 4.3 การเจริญสติ สมาธิ */}
          <div className="pt-3 border-t border-stone-100 space-y-3">
            <h4 className="text-xs font-bold text-stone-800 font-heading">
              4.3 การเจริญสติ สมาธิ หรือวิปัสสนา
            </h4>

            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1.5">
                ปฏิบัติธรรม/ทำสมาธิ สัปดาห์ละกี่วัน?
              </label>
              <div className="flex items-center space-x-1 sm:space-x-2">
                {[0, 1, 2, 3, 4, 5, 6, 7].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setMeditationDaysPerWeek(num)}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg border transition-all ${
                      meditationDaysPerWeek === num
                        ? 'bg-emerald-700 text-white border-emerald-800 shadow-xs'
                        : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                    }`}
                  >
                    {num} วัน
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1.5">
                โดยเฉลี่ยครั้งละประมาณเท่าใด?
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {(['less_15', '15_30', '31_60', 'more_60'] as MeditationDuration[]).map((dur) => (
                  <button
                    key={dur}
                    type="button"
                    onClick={() => setMeditationDuration(dur)}
                    className={`p-2.5 text-xs font-medium rounded-lg border text-center transition-all ${
                      meditationDuration === dur
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-950 font-bold'
                        : 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100'
                    }`}
                  >
                    {MEDITATION_DURATION_LABELS[dur]}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 4.4 การสูบบุหรี่ */}
          <div className="pt-3 border-t border-stone-100 space-y-3">
            <h4 className="text-xs font-bold text-stone-800 font-heading">
              4.4 การสูบบุหรี่
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {(['never', 'quit', 'smoking'] as SmokingStatus[]).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setSmokingStatus(st)}
                  className={`p-2.5 text-xs font-semibold rounded-lg border text-center transition-all ${
                    smokingStatus === st
                      ? st === 'smoking'
                        ? 'bg-rose-50 border-rose-400 text-rose-950 font-bold'
                        : 'bg-emerald-50 border-emerald-500 text-emerald-950 font-bold'
                      : 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100'
                  }`}
                >
                  {SMOKING_LABELS[st]}
                </button>
              ))}
            </div>

            {smokingStatus === 'smoking' && (
              <div className="bg-rose-50/60 p-3 rounded-xl border border-rose-200 flex items-center gap-3">
                <span className="text-xs font-semibold text-rose-900">
                  เฉลี่ยวันละกี่มวน?
                </span>
                <input
                  type="number"
                  min="1"
                  max="60"
                  value={cigarettesPerDay}
                  onChange={(e) => setCigarettesPerDay(e.target.value)}
                  placeholder="เช่น 5"
                  className="w-24 bg-white border border-rose-300 rounded-lg px-2.5 py-1.5 text-xs text-stone-900 focus:outline-none focus:ring-1 focus:ring-rose-500"
                />
                <span className="text-xs text-stone-600">มวนต่อวัน</span>
              </div>
            )}
          </div>

          {/* 4.5 การพักผ่อน */}
          <div className="pt-3 border-t border-stone-100 space-y-3">
            <h4 className="text-xs font-bold text-stone-800 font-heading">
              4.5 การพักผ่อนและการนอนหลับ
            </h4>

            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1.5">
                โดยปกติท่านนอนหลับประมาณคืนละกี่ชั่วโมง?
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {(['less_5', '5_6', '7_8', 'more_8'] as SleepDuration[]).map((sh) => (
                  <button
                    key={sh}
                    type="button"
                    onClick={() => setSleepHours(sh)}
                    className={`p-2.5 text-xs font-medium rounded-lg border text-center transition-all ${
                      sleepHours === sh
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-950 font-bold'
                        : 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100'
                    }`}
                  >
                    {SLEEP_HOURS_LABELS[sh]}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1.5">
                โดยทั่วไปรู้สึกว่าพักผ่อนเพียงพอหรือไม่?
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['sufficient', 'barely', 'insufficient'] as SleepQuality[]).map((sq) => (
                  <button
                    key={sq}
                    type="button"
                    onClick={() => setSleepQuality(sq)}
                    className={`p-2.5 text-xs font-medium rounded-lg border text-center transition-all ${
                      sleepQuality === sq
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-950 font-bold'
                        : 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100'
                    }`}
                  >
                    {SLEEP_QUALITY_LABELS[sq]}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 4.6 การฉันผักผลไม้ */}
          <div className="pt-3 border-t border-stone-100 space-y-2">
            <h4 className="text-xs font-bold text-stone-800 font-heading">
              4.6 การฉันผักและผลไม้: โดยปกติท่านฉันผักหรือผลไม้บ่อยเพียงใด?
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {(['almost_never', '1_2_days', '3_4_days', '5_6_days', 'daily'] as FruitVegFrequency[]).map(
                (fv) => (
                  <button
                    key={fv}
                    type="button"
                    onClick={() => setFruitVegetableFrequency(fv)}
                    className={`p-2.5 text-xs font-medium rounded-lg border text-center transition-all ${
                      fruitVegetableFrequency === fv
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-950 font-bold'
                        : 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100'
                    }`}
                  >
                    {FRUIT_VEG_LABELS[fv]}
                  </button>
                )
              )}
            </div>
          </div>
        </div>

        {/* ส่วนสรุปผลตรวจ */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-stone-200 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-stone-100">
            <div className="flex items-center gap-2 text-stone-900 font-bold font-heading text-sm">
              <Sparkles className="w-4 h-4 text-amber-600" />
              <span>สรุปสถานะผลตรวจและการติดตาม</span>
            </div>

            {/* Smart Suggestion Pill */}
            <button
              type="button"
              onClick={() => setHealthStatus(suggestedStatus)}
              className="text-[11px] text-emerald-800 bg-emerald-50 border border-emerald-300 px-2.5 py-1 rounded-lg font-medium hover:bg-emerald-100 transition-colors flex items-center gap-1"
            >
              <span>แนะนำสถานะตามผล:</span>
              <strong className="underline">{HEALTH_STATUS_LABELS[suggestedStatus].label}</strong>
            </button>
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-800 mb-2">
              สถานะสุขภาพ <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {(['normal', 'monitor', 'risk', 'medical_attention'] as HealthStatus[]).map((st) => {
                const conf = HEALTH_STATUS_LABELS[st];
                const isSelected = healthStatus === st;
                return (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setHealthStatus(st)}
                    className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                      isSelected
                        ? `${conf.bg} ${conf.border} border-2 shadow-xs ring-2 ring-emerald-600/30`
                        : 'bg-stone-50 border-stone-200 hover:bg-stone-100'
                    }`}
                  >
                    <div className={`text-sm font-bold font-heading ${conf.color}`}>
                      {conf.label}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-bold text-stone-800 mb-1.5">
                ควรติดตามต่อหรือไม่?
              </label>
              <div className="flex items-center space-x-3">
                <button
                  type="button"
                  onClick={() => setFollowUpRequired('no')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
                    followUpRequired === 'no'
                      ? 'bg-stone-700 text-white border-stone-800'
                      : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                  }`}
                >
                  ไม่ต้องติดตามเป็นพิเศษ
                </button>
                <button
                  type="button"
                  onClick={() => setFollowUpRequired('yes')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
                    followUpRequired === 'yes'
                      ? 'bg-amber-600 text-white border-amber-700'
                      : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                  }`}
                >
                  ⚠️ ควรติดตามผล
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-800 mb-1.5">
                หมายเหตุ / คำแนะนำการดูแลสุขภาพ
              </label>
              <textarea
                value={recommendation}
                onChange={(e) => setRecommendation(e.target.value)}
                placeholder="เช่น แนะนำลดฉันของหวาน ของทอด, เดินจงกรมหรือออกกำลังกายสม่ำเสมอ"
                rows={2}
                className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-xs text-stone-900 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
              />
            </div>
          </div>

          {/* Big Submit Button */}
          <div className="pt-4 border-t border-stone-100 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-xs text-stone-500">
              * ข้อมูลจะถูกจัดเก็บเข้าสู่ฐานข้อมูลและอัปเดต Dashboard ทันที
              {saveError && (
                <div className="text-rose-600 font-medium mt-1">
                  {saveError}
                </div>
              )}
            </div>

            <button
              id="save-health-check-btn"
              type="submit"
              disabled={isSaving}
              className="w-full sm:w-auto px-8 py-3.5 bg-emerald-800 hover:bg-emerald-900 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl text-base shadow-md hover:shadow-lg transition-all hover:scale-[1.01] cursor-pointer font-heading flex items-center justify-center gap-2"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin text-amber-300" />
                  <span>กำลังบันทึกข้อมูล...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5 text-amber-300" />
                  <span>บันทึกข้อมูลสุขภาพ</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>

      {/* Add Monk Modal */}
      <AddMonkModal
        isOpen={isAddMonkOpen}
        onClose={() => setIsAddMonkOpen(false)}
        initialTempleId={templeId}
        onSuccess={(newMonk: Monk) => {
          setSelectedMonkIdLocal(newMonk.id);
          setIsAddMonkOpen(false);
        }}
      />
    </div>
  );
};
