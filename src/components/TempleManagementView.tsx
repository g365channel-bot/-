import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
  Building,
  Search,
  MapPin,
  Phone,
  User,
  Stethoscope,
  Edit2,
  Clock,
  RefreshCw,
  Loader2,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  X,
  ShieldAlert,
  Check,
} from 'lucide-react';
import { Temple, Region } from '../types';
import { collection, query, where, getDocs, writeBatch, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { getRegionFromProvince } from '../utils/regionMapping';

interface PendingTemple {
  id: string;
  name: string;
  subdistrict?: string;
  district?: string;
  province?: string;
  region?: string;
  abbotName?: string;
  coordinatorName?: string;
  phone?: string;
  healthServiceUnit?: string;
  status?: string;
  createdAt?: any;
}

export const TempleManagementView: React.FC = () => {
  const {
    temples,
    isTemplesLoading,
    templesError,
    refreshTemples,
    monks,
    updateTemple,
    currentUser,
  } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('all');

  // Pending Temples State (For Super Admin)
  const [pendingTemples, setPendingTemples] = useState<PendingTemple[]>([]);
  const [isLoadingPending, setIsLoadingPending] = useState(false);
  const [pendingError, setPendingError] = useState<string | null>(null);
  const [approvalSuccessMsg, setApprovalSuccessMsg] = useState<string | null>(null);
  const [confirmingTemple, setConfirmingTemple] = useState<PendingTemple | null>(null);
  const [isApproving, setIsApproving] = useState(false);

  // Temporary Super Admin Region9 Audit State (Read-Only)
  interface AuditItem {
    id: string;
    name: string;
    province: string;
    currentRegion9?: string;
    expectedRegion9?: string | null;
    status: 'correct' | 'missing' | 'incorrect' | 'unmappable' | 'missing_province';
  }

  interface AuditSummary {
    total: number;
    validCount: number;
    missingCount: number;
    incorrectCount: number;
    unmappableProvinceCount: number;
    missingProvinceCount: number;
    items: AuditItem[];
  }

  const [isAuditing, setIsAuditing] = useState(false);
  const [auditSummary, setAuditSummary] = useState<AuditSummary | null>(null);
  const [auditError, setAuditError] = useState<string | null>(null);

  const runRegion9Audit = async () => {
    setIsAuditing(true);
    setAuditError(null);
    try {
      const templesRef = collection(db, 'temples');
      const snapshot = await getDocs(templesRef);

      let validCount = 0;
      let missingCount = 0;
      let incorrectCount = 0;
      let unmappableProvinceCount = 0;
      let missingProvinceCount = 0;
      const items: AuditItem[] = [];

      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        const id = docSnap.id;
        const name = data.name || '(ไม่มีชื่อวัด)';
        const rawProvince = data.province;
        const province = typeof rawProvince === 'string' ? rawProvince.trim() : '';
        const currentRegion9 = data.region9 || undefined;

        if (!province) {
          missingProvinceCount++;
          items.push({
            id,
            name,
            province: '-',
            currentRegion9,
            expectedRegion9: null,
            status: 'missing_province',
          });
          return;
        }

        const expectedRegion9 = getRegionFromProvince(province);

        if (!expectedRegion9) {
          unmappableProvinceCount++;
          items.push({
            id,
            name,
            province,
            currentRegion9,
            expectedRegion9: null,
            status: 'unmappable',
          });
          return;
        }

        if (!currentRegion9) {
          missingCount++;
          items.push({
            id,
            name,
            province,
            currentRegion9: undefined,
            expectedRegion9,
            status: 'missing',
          });
        } else if (currentRegion9 === expectedRegion9) {
          validCount++;
        } else {
          incorrectCount++;
          items.push({
            id,
            name,
            province,
            currentRegion9,
            expectedRegion9,
            status: 'incorrect',
          });
        }
      });

      setAuditSummary({
        total: snapshot.size,
        validCount,
        missingCount,
        incorrectCount,
        unmappableProvinceCount,
        missingProvinceCount,
        items,
      });
    } catch (err: any) {
      console.error('Audit failed:', err);
      setAuditError(err?.message || 'เกิดข้อผิดพลาดในการตรวจสอบข้อมูล');
    } finally {
      setIsAuditing(false);
    }
  };

  // Fetch pending temples from Firestore
  const fetchPendingTemples = async () => {
    if (currentUser?.role !== 'super_admin') return;
    setIsLoadingPending(true);
    setPendingError(null);
    try {
      const q = query(collection(db, 'temples'), where('status', '==', 'pending'));
      const snapshot = await getDocs(q);
      const list: PendingTemple[] = [];
      snapshot.forEach((docSnap) => {
        list.push({
          id: docSnap.id,
          ...(docSnap.data() as Omit<PendingTemple, 'id'>),
        });
      });
      setPendingTemples(list);
    } catch (err: any) {
      console.error('Error fetching pending temples:', err);
      setPendingError(err?.message || 'ไม่สามารถโหลดข้อมูลคำขอสมัครได้');
    } finally {
      setIsLoadingPending(false);
    }
  };

  useEffect(() => {
    if (currentUser?.role === 'super_admin') {
      fetchPendingTemples();
    }
  }, [currentUser?.role]);

  // Handle batch approval
  const handleConfirmApprove = async () => {
    if (!confirmingTemple) return;
    setIsApproving(true);
    try {
      const batch = writeBatch(db);
      const templeRef = doc(db, 'temples', confirmingTemple.id);
      const userRef = doc(db, 'users', confirmingTemple.id);

      batch.update(templeRef, {
        status: 'approved',
        updatedAt: serverTimestamp(),
      });

      batch.set(
        userRef,
        {
          status: 'approved',
          active: true,
          templeName: confirmingTemple.name,
        },
        { merge: true }
      );

      await batch.commit();

      // Remove from pending list immediately
      setPendingTemples((prev) => prev.filter((item) => item.id !== confirmingTemple.id));

      // Show success message
      setApprovalSuccessMsg('อนุมัติการสมัครเรียบร้อยแล้ว');

      // Refresh approved temples from Firestore
      await refreshTemples();

      setConfirmingTemple(null);
    } catch (err: any) {
      console.error('Error approving temple:', err);
      setPendingError(err?.message || 'เกิดข้อผิดพลาดในการอนุมัติ');
    } finally {
      setIsApproving(false);
    }
  };

  // Modal State for Editing Approved Temple
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTemple, setEditingTemple] = useState<Temple | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [abbotName, setAbbotName] = useState('');
  const [subdistrict, setSubdistrict] = useState('');
  const [district, setDistrict] = useState('');
  const [province, setProvince] = useState('กรุงเทพมหานคร');
  const [region, setRegion] = useState<Region>('กลาง');
  const [healthServiceUnit, setHealthServiceUnit] = useState('');
  const [coordinatorName, setCoordinatorName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [phone, setPhone] = useState('');

  const regions = useMemo(() => Array.from(new Set(temples.map((t) => t.region))), [temples]);

  const filteredTemples = useMemo(() => {
    return temples.filter((t) => {
      if (selectedRegion !== 'all' && t.region !== selectedRegion) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          t.name.toLowerCase().includes(q) ||
          t.province.toLowerCase().includes(q) ||
          t.healthServiceUnit.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [temples, selectedRegion, searchQuery]);

  const handleOpenEdit = (t: Temple) => {
    setEditingTemple(t);
    setName(t.name);
    setAbbotName(t.abbotName || '');
    setSubdistrict(t.subdistrict || '');
    setDistrict(t.district);
    setProvince(t.province);
    setRegion(t.region || 'กลาง');
    setHealthServiceUnit(t.healthServiceUnit);
    setCoordinatorName(t.coordinatorName || t.contactPerson || '');
    setContactPerson(t.contactPerson || t.coordinatorName || '');
    setPhone(t.phone || '');
    setEditError(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !editingTemple) return;

    setIsSubmitting(true);
    setEditError(null);

    try {
      await updateTemple({
        ...editingTemple,
        name: name.trim(),
        abbotName: abbotName.trim(),
        subdistrict: subdistrict.trim(),
        district: district.trim(),
        province: province.trim(),
        region: region,
        healthServiceUnit: healthServiceUnit.trim(),
        coordinatorName: coordinatorName.trim() || contactPerson.trim(),
        contactPerson: (contactPerson || coordinatorName).trim() || undefined,
        phone: phone.trim() || undefined,
      });
      setIsModalOpen(false);
    } catch (err: any) {
      console.error('Error updating temple in Firestore:', err);
      setEditError(err?.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-xs border border-stone-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Building className="w-5 h-5 text-emerald-700" />
            <span className="text-xs font-bold text-stone-500 uppercase tracking-wider font-heading">
              {currentUser?.role === 'super_admin' ? 'ผู้ดูแลระบบกลาง (Super Admin)' : 'ผู้ดูแลประจำวัด (Temple Admin)'}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold font-heading text-stone-900 tracking-tight">
            จัดการข้อมูลวัดและหน่วยบริการสุขภาพพี่เลี้ยง
          </h1>
          <p className="text-stone-500 text-xs sm:text-sm">
            {currentUser?.role === 'super_admin'
              ? 'รายชื่อวัดที่ได้รับการอนุมัติ และตรวจสอบคำขอลงทะเบียนวัดใหม่'
              : 'ข้อมูลวัดและหน่วยบริการสุขภาพพี่เลี้ยงของท่าน'}
          </p>
        </div>

        <button
          onClick={() => {
            fetchPendingTemples();
            refreshTemples();
          }}
          disabled={isTemplesLoading || isLoadingPending}
          className="px-3.5 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          title="รีเฟรชข้อมูล"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${(isTemplesLoading || isLoadingPending) ? 'animate-spin' : ''}`} />
          <span>รีเฟรชข้อมูล</span>
        </button>
      </div>

      {/* Temporary Super Admin Read-Only Region9 Audit Section */}
      {currentUser?.role === 'super_admin' && (
        <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-xs border border-indigo-200 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-100">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-700">
                <Search className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold font-heading text-stone-900">
                    ตรวจสอบ Region9 ของวัด (เครื่องมือวินิจฉัยข้อมูลชั่วคราว)
                  </h2>
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-100 text-indigo-800">
                    Read-Only
                  </span>
                </div>
                <p className="text-xs text-stone-500">
                  ตรวจสอบความถูกต้องของฟิลด์ Region9 กับฐานข้อมูล 77 จังหวัด โดยอิงจังหวัดของวัดเป็นหลัก
                </p>
              </div>
            </div>

            <button
              id="btn-audit-region9"
              onClick={runRegion9Audit}
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
                  <span>ตรวจสอบ Region9 ของวัด</span>
                </>
              )}
            </button>
          </div>

          {/* Actual Firestore Error Display */}
          {auditError && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">เกิดข้อผิดพลาดในการอ่านข้อมูลจาก Firestore:</p>
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
                  <span className="block text-[11px] font-medium text-stone-500">จำนวนวัดทั้งหมด</span>
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
                <div className="p-3 bg-orange-50 border border-orange-200 rounded-xl text-center">
                  <span className="block text-[11px] font-medium text-orange-700">จังหวัดไม่สามารถจับคู่ได้</span>
                  <span className="block text-xl font-bold text-orange-800 mt-0.5">{auditSummary.unmappableProvinceCount}</span>
                </div>
                <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl text-center">
                  <span className="block text-[11px] font-medium text-purple-700">ไม่มีจังหวัด</span>
                  <span className="block text-xl font-bold text-purple-800 mt-0.5">{auditSummary.missingProvinceCount}</span>
                </div>
              </div>

              {/* Detail Table for missing, incorrect, unmappable, or missing-province records */}
              {auditSummary.items.length > 0 ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-stone-700">
                      รายการวัดที่ต้องตรวจสอบ ({auditSummary.items.length} แห่ง):
                    </span>
                  </div>
                  <div className="overflow-x-auto rounded-xl border border-stone-200 max-h-72 overflow-y-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-stone-50 border-b border-stone-200 text-stone-600 sticky top-0">
                        <tr>
                          <th className="py-2.5 px-3 font-semibold">ชื่อวัด</th>
                          <th className="py-2.5 px-3 font-semibold">จังหวัด</th>
                          <th className="py-2.5 px-3 font-semibold">Region9 ปัจจุบัน</th>
                          <th className="py-2.5 px-3 font-semibold">Region9 ที่ควรเป็น</th>
                          <th className="py-2.5 px-3 font-semibold">สถานะ</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-100">
                        {auditSummary.items.map((item) => (
                          <tr key={item.id} className="hover:bg-stone-50/60">
                            <td className="py-2 px-3 font-medium text-stone-900">{item.name}</td>
                            <td className="py-2 px-3 text-stone-700">{item.province}</td>
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
                              {item.status === 'unmappable' && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-orange-100 text-orange-800">
                                  จังหวัดไม่สามารถจับคู่ได้
                                </span>
                              )}
                              {item.status === 'missing_province' && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-100 text-purple-800">
                                  ไม่มีจังหวัด
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
                  <span>วัดทุกแห่งในระบบมี Region9 ครบถ้วนและถูกต้องตรงตามเกณฑ์มาตรฐาน</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Pending Temples Approval Section (Super Admin Only) */}
      {currentUser?.role === 'super_admin' && (
        <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-xs border border-amber-200 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-stone-100">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-600" />
              <h2 className="text-base sm:text-lg font-bold font-heading text-stone-900">
                คำขอสมัครใช้งานสำหรับวัดที่รอการอนุมัติ
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                {pendingTemples.length} คำขอ
              </span>
            </div>

            <button
              onClick={fetchPendingTemples}
              disabled={isLoadingPending}
              className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-lg transition-colors cursor-pointer"
              title="รีเฟรชคำขอสมัคร"
            >
              <RefreshCw className={`w-4 h-4 ${isLoadingPending ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* Success Message */}
          {approvalSuccessMsg && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm p-3.5 rounded-xl flex items-center justify-between animate-in fade-in">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="font-semibold">{approvalSuccessMsg}</span>
              </div>
              <button
                onClick={() => setApprovalSuccessMsg(null)}
                className="text-stone-400 hover:text-stone-700 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Loading State */}
          {isLoadingPending && (
            <div className="py-8 text-center text-stone-500 flex items-center justify-center gap-2 text-xs sm:text-sm">
              <Loader2 className="w-4 h-4 animate-spin text-amber-600" />
              <span>กำลังโหลดข้อมูลคำขอสมัคร...</span>
            </div>
          )}

          {/* Error State */}
          {!isLoadingPending && pendingError && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs p-3.5 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>{pendingError}</span>
              </div>
              <button
                onClick={fetchPendingTemples}
                className="underline font-bold hover:text-rose-900 cursor-pointer"
              >
                ลองใหม่อีกครั้ง
              </button>
            </div>
          )}

          {/* Empty State */}
          {!isLoadingPending && !pendingError && pendingTemples.length === 0 && (
            <div className="py-8 text-center text-stone-500 text-xs sm:text-sm bg-stone-50/80 rounded-xl border border-dashed border-stone-200">
              ไม่มีคำขอสมัครที่รออนุมัติ
            </div>
          )}

          {/* Pending Temples List */}
          {!isLoadingPending && pendingTemples.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-1">
              {pendingTemples.map((temple) => (
                <div
                  key={temple.id}
                  className="bg-stone-50/60 border border-amber-200/90 rounded-2xl p-4 sm:p-5 flex flex-col justify-between hover:border-amber-400 hover:shadow-xs transition-all"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-heading">
                          รออนุมัติ (Pending)
                        </span>
                        <h3 className="text-base font-bold font-heading text-stone-900 mt-1">
                          {temple.name}
                        </h3>
                      </div>
                    </div>

                    <div className="space-y-1.5 text-xs text-stone-600">
                      <div className="flex items-start gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-stone-400 shrink-0 mt-0.5" />
                        <span>
                          ตำบล: <span className="text-stone-800 font-medium">{temple.subdistrict || '-'}</span> อำเภอ: <span className="text-stone-800 font-medium">{temple.district || '-'}</span> จังหวัด: <span className="text-stone-800 font-medium">{temple.province || '-'}</span> (ภาค{temple.region || '-'})
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                        <span>
                          เจ้าอาวาส: <span className="text-stone-800 font-medium">{temple.abbotName || '-'}</span>
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                        <span>
                          ผู้ประสานงาน: <span className="text-stone-800 font-medium">{temple.coordinatorName || '-'}</span>
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                        <span>
                          เบอร์โทร: <span className="text-stone-800 font-medium">{temple.phone || '-'}</span>
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Stethoscope className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>
                          หน่วยบริการสุขภาพ: <span className="text-emerald-950 font-medium">{temple.healthServiceUnit || '-'}</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-stone-200/80 flex items-center justify-end">
                    <button
                      id={`approve-btn-${temple.id}`}
                      onClick={() => setConfirmingTemple(temple)}
                      className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer font-heading"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>อนุมัติ</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Filter Bar */}
      <div className="bg-white rounded-2xl p-4 shadow-xs border border-stone-200">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ค้นหาชื่อวัด, จังหวัด, โรงพยาบาลพี่เลี้ยง..."
              className="w-full pl-9 pr-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs text-stone-800 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
            />
          </div>

          <div>
            <select
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
              className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-xs text-stone-800 focus:ring-2 focus:ring-emerald-600 focus:outline-none font-medium"
            >
              <option value="all">ทุกภาคทั่วประเทศ</option>
              {regions.map((r) => (
                <option key={r} value={r}>
                  ภาค{r}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Loading state */}
      {isTemplesLoading && (
        <div className="bg-white rounded-2xl p-10 border border-stone-200 text-center space-y-3">
          <Loader2 className="w-8 h-8 text-emerald-800 animate-spin mx-auto" />
          <p className="text-sm font-medium text-stone-600">กำลังโหลดข้อมูลวัดจากระบบ...</p>
        </div>
      )}

      {/* Error state */}
      {!isTemplesLoading && templesError && (
        <div className="bg-rose-50 rounded-2xl p-6 border border-rose-200 text-center space-y-2">
          <AlertCircle className="w-6 h-6 text-rose-600 mx-auto" />
          <p className="text-sm font-semibold text-rose-800">{templesError}</p>
          <button
            onClick={() => refreshTemples()}
            className="px-3 py-1.5 bg-rose-600 text-white rounded-lg text-xs font-semibold hover:bg-rose-700 transition-colors cursor-pointer"
          >
            ลองใหม่อีกครั้ง
          </button>
        </div>
      )}

      {/* Empty State */}
      {!isTemplesLoading && !templesError && filteredTemples.length === 0 && (
        <div className="bg-white rounded-2xl p-10 border border-stone-200 text-center space-y-3">
          <Building className="w-10 h-10 text-stone-400 mx-auto" />
          <h3 className="text-base font-bold font-heading text-stone-800">
            {temples.length === 0
              ? currentUser?.role === 'temple_admin'
                ? 'ไม่พบข้อมูลวัดที่ได้รับอนุมัติ'
                : 'ยังไม่มีวัดที่ได้รับการอนุมัติ'
              : 'ไม่พบวัดที่ตรงกับเงื่อนไขการค้นหา'}
          </h3>
          <p className="text-xs text-stone-500 max-w-sm mx-auto">
            {temples.length === 0
              ? currentUser?.role === 'temple_admin'
                ? 'กรุณาติดต่อผู้ดูแลระบบเพื่อตรวจสอบสถานะการอนุมัติวัดของท่าน'
                : 'เมื่อมีวัดสมัครใช้งานและได้รับการอนุมัติ รายชื่อวัดจะปรากฏที่นี่'
              : 'ลองปรับเปลี่ยนคำค้นหาหรือตัวกรองภูมิภาค'}
          </p>
        </div>
      )}

      {/* Temple Cards Grid */}
      {!isTemplesLoading && !templesError && filteredTemples.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTemples.map((temple) => {
            const monkCount = monks.filter((m) => m.templeId === temple.id).length;
            return (
              <div
                key={temple.id}
                className="bg-white rounded-2xl p-5 shadow-xs border border-stone-200 flex flex-col justify-between hover:shadow-md transition-shadow"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-mono font-bold bg-stone-100 text-stone-600 px-2 py-0.5 rounded">
                        {temple.id.length > 12 ? temple.id.slice(0, 8) + '...' : temple.id}
                      </span>
                      <h3 className="text-base font-bold font-heading text-stone-900 mt-1">
                        {temple.name}
                      </h3>
                    </div>
                    {currentUser?.role === 'super_admin' && (
                      <button
                        onClick={() => handleOpenEdit(temple)}
                        className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-lg transition-colors cursor-pointer"
                        title="แก้ไขข้อมูลวัด"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div className="space-y-1.5 text-xs text-stone-600">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                      <span>
                        {temple.subdistrict ? `ต.${temple.subdistrict} ` : ''}
                        อ.{temple.district} จ.{temple.province} (ภาค{temple.region})
                      </span>
                    </div>
                    {temple.abbotName && (
                      <div className="flex items-center gap-1.5 text-[11px] text-stone-500">
                        <User className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                        <span>เจ้าอาวาส: {temple.abbotName}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1.5">
                      <Stethoscope className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span className="font-medium text-emerald-950 truncate">
                        {temple.healthServiceUnit}
                      </span>
                    </div>
                    {(temple.coordinatorName || temple.contactPerson) && (
                      <div className="flex items-center gap-1.5 text-[11px] text-stone-500">
                        <User className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                        <span>ผู้ประสานงาน: {temple.coordinatorName || temple.contactPerson} ({temple.phone || '-'})</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-xs">
                  <span className="text-stone-500">พระสงฆ์ในสังกัด:</span>
                  <span className="font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full">
                    {monkCount} รูป
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Edit Modal (Super Admin only) */}
      {isModalOpen && editingTemple && (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-stone-200">
            <div className="bg-emerald-800 text-white px-6 py-4 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base font-heading text-white">
                  แก้ไขข้อมูลวัด ({editingTemple.name})
                </h3>
                <p className="text-xs text-emerald-100">
                  อัปเดตข้อมูลวัดใน Cloud Firestore
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-emerald-200 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-3.5 text-xs">
              {editError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{editError}</span>
                </div>
              )}

              <div>
                <label className="block font-semibold text-stone-700 mb-1">
                  ชื่อวัด <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="เช่น วัดบวรนิเวศวิหาร"
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">
                  ชื่อเจ้าอาวาส
                </label>
                <input
                  type="text"
                  value={abbotName}
                  onChange={(e) => setAbbotName(e.target.value)}
                  placeholder="เช่น พระธรรมวชิราจารย์"
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">ตำบล/แขวง</label>
                  <input
                    type="text"
                    value={subdistrict}
                    onChange={(e) => setSubdistrict(e.target.value)}
                    placeholder="เช่น บวรนิเวศ"
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">อำเภอ/เขต <span className="text-rose-500">*</span></label>
                  <input
                    type="text"
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    placeholder="เช่น พระนคร"
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">จังหวัด <span className="text-rose-500">*</span></label>
                  <input
                    type="text"
                    value={province}
                    onChange={(e) => setProvince(e.target.value)}
                    placeholder="เช่น กรุงเทพมหานคร"
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">ภาค <span className="text-rose-500">*</span></label>
                  <select
                    value={region}
                    onChange={(e) => setRegion(e.target.value as Region)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                  >
                    <option value="กลาง">กลาง</option>
                    <option value="เหนือ">เหนือ</option>
                    <option value="ตะวันออกเฉียงเหนือ">ตะวันออกเฉียงเหนือ</option>
                    <option value="ใต้">ใต้</option>
                    <option value="ตะวันออก">ตะวันออก</option>
                    <option value="ตะวันตก">ตะวันตก</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">
                  หน่วยบริการสุขภาพ / รพ. พี่เลี้ยง
                </label>
                <input
                  type="text"
                  value={healthServiceUnit}
                  onChange={(e) => setHealthServiceUnit(e.target.value)}
                  placeholder="เช่น โรงพยาบาลสงฆ์"
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">ผู้ประสานงานวัด</label>
                  <input
                    type="text"
                    value={coordinatorName}
                    onChange={(e) => {
                      setCoordinatorName(e.target.value);
                      setContactPerson(e.target.value);
                    }}
                    placeholder="เช่น พระครูปลัด..."
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">เบอร์ติดต่อ</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="เช่น 02-281-2831"
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-stone-600 hover:bg-stone-100 rounded-xl cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-emerald-800 hover:bg-emerald-900 text-white font-bold rounded-xl font-heading flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>กำลังบันทึก...</span>
                    </>
                  ) : (
                    <span>บันทึกการแก้ไข</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Approving Temple */}
      {confirmingTemple && (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-stone-200 p-6 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto border border-amber-200">
              <ShieldCheck className="w-6 h-6" />
            </div>

            <div className="text-center space-y-2">
              <h3 className="text-base font-bold text-stone-900 font-heading">
                ยืนยันอนุมัติวัดนี้เข้าสู่ระบบหรือไม่?
              </h3>
              <div className="bg-stone-50 rounded-xl p-3 text-xs text-stone-600 leading-relaxed text-left space-y-1 border border-stone-200">
                <div>
                  <span className="text-stone-400">ชื่อวัด:</span>{' '}
                  <span className="font-semibold text-stone-900">{confirmingTemple.name}</span>
                </div>
                <div>
                  <span className="text-stone-400">ที่ตั้ง:</span> ต.{confirmingTemple.subdistrict || '-'} อ.{confirmingTemple.district || '-'} จ.{confirmingTemple.province || '-'}
                </div>
                <div>
                  <span className="text-stone-400">ผู้ประสานงาน:</span>{' '}
                  <span className="font-medium text-stone-800">{confirmingTemple.coordinatorName || '-'}</span> ({confirmingTemple.phone || '-'})
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-100">
              <button
                type="button"
                disabled={isApproving}
                onClick={() => setConfirmingTemple(null)}
                className="px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-100 rounded-xl transition-colors cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                id="confirm-approve-btn"
                disabled={isApproving}
                onClick={handleConfirmApprove}
                className="px-4 py-2 text-xs font-bold bg-emerald-800 hover:bg-emerald-900 disabled:bg-emerald-600 text-white rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5 font-heading"
              >
                {isApproving ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>กำลังอนุมัติ...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>ยืนยันอนุมัติ</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
