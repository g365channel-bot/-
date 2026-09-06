import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
  currentBuddhistYear,
  getFilterYearOptions,
  formatBuddhistYearLabel,
} from '../utils/buddhistYear';
import {
  Users,
  Search,
  Filter,
  UserPlus,
  Edit2,
  FileText,
  ClipboardPenLine,
  Trash2,
  ArrowUpDown,
  Loader2,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { HEALTH_STATUS_LABELS, Monk } from '../types';
import { AddMonkModal } from './AddMonkModal';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { getRegionFromProvince } from '../utils/regionMapping';

export const MonkListView: React.FC = () => {
  const {
    currentUser,
    temples,
    monks,
    isMonksLoading,
    monksError,
    refreshMonks,
    healthChecks,
    deleteMonk,
    setSelectedMonkId,
    setActiveTab,
    setPrefillHealthEntry,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTempleFilter, setSelectedTempleFilter] = useState<string>(() => {
    if (currentUser?.role === 'temple_admin' && currentUser.templeId) {
      return currentUser.templeId;
    }
    return 'all';
  });
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all');
  const [selectedYearFilter, setSelectedYearFilter] = useState<number>(currentBuddhistYear);
  const availableYears = useMemo(
    () => getFilterYearOptions(healthChecks.map((hc) => hc.year)),
    [healthChecks]
  );
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    if (currentUser?.role === 'temple_admin' && currentUser.templeId) {
      setSelectedTempleFilter(currentUser.templeId);
    }
  }, [currentUser?.role, currentUser?.templeId]);

  // Add / Edit Monk Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMonk, setEditingMonk] = useState<Monk | null>(null);

  // Temporary Super Admin Monk Region9 Audit State (Read-Only)
  interface MonkAuditItem {
    id: string;
    name: string;
    monkName: string;
    templeId: string;
    templeName: string;
    templeProvince: string;
    currentRegion9?: string;
    expectedRegion9?: string | null;
    status: 'correct' | 'missing' | 'incorrect' | 'temple_not_found' | 'unmappable_temple_province';
  }

  interface MonkAuditSummary {
    total: number;
    validCount: number;
    missingCount: number;
    incorrectCount: number;
    templeNotFoundCount: number;
    unmappableProvinceCount: number;
    problemItems: MonkAuditItem[];
  }

  const [isAuditing, setIsAuditing] = useState(false);
  const [auditSummary, setAuditSummary] = useState<MonkAuditSummary | null>(null);
  const [auditError, setAuditError] = useState<string | null>(null);

  const runMonkRegion9Audit = async () => {
    setIsAuditing(true);
    setAuditError(null);
    try {
      let allMonks: Array<{
        id: string;
        name: string;
        monkName: string;
        templeId: string;
        region9?: string;
      }> = [];

      const allTemplesMap = new Map<string, { id: string; name: string; province?: string }>();

      // Read directly from Firestore with authenticated Super Admin session
      try {
        const [monksSnap, templesSnap] = await Promise.all([
          getDocs(collection(db, 'monks')),
          getDocs(collection(db, 'temples')),
        ]);

        monksSnap.forEach((docSnap) => {
          const d = docSnap.data();
          allMonks.push({
            id: docSnap.id,
            name: d.name || '(ไม่มีชื่อ)',
            monkName: d.monkName || '',
            templeId: d.templeId || '',
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
        allMonks = monks.map((m) => ({
          id: m.id,
          name: m.name,
          monkName: m.monkName,
          templeId: m.templeId,
          region9: m.region9,
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

      // If allMonks is still empty but context has monks, sync from context
      if (allMonks.length === 0 && monks.length > 0) {
        allMonks = monks.map((m) => ({
          id: m.id,
          name: m.name,
          monkName: m.monkName,
          templeId: m.templeId,
          region9: m.region9,
        }));
      }

      let validCount = 0;
      let missingCount = 0;
      let incorrectCount = 0;
      let templeNotFoundCount = 0;
      let unmappableProvinceCount = 0;
      const problemItems: MonkAuditItem[] = [];

      allMonks.forEach((m) => {
        const temple = allTemplesMap.get(m.templeId);
        const templeName = temple?.name || '(ไม่พบวัด)';
        const templeProvince = temple?.province || '';

        if (!temple) {
          templeNotFoundCount++;
          problemItems.push({
            id: m.id,
            name: m.name,
            monkName: m.monkName,
            templeId: m.templeId,
            templeName: '(ไม่พบวัดในระบบ)',
            templeProvince: '-',
            currentRegion9: m.region9,
            expectedRegion9: null,
            status: 'temple_not_found',
          });
          return;
        }

        // Temple is the Source of Truth: derive from temple.province
        const expectedRegion9 = getRegionFromProvince(templeProvince);

        if (!expectedRegion9) {
          unmappableProvinceCount++;
          problemItems.push({
            id: m.id,
            name: m.name,
            monkName: m.monkName,
            templeId: m.templeId,
            templeName,
            templeProvince: templeProvince || '(ไม่มีจังหวัด)',
            currentRegion9: m.region9,
            expectedRegion9: null,
            status: 'unmappable_temple_province',
          });
          return;
        }

        if (!m.region9) {
          missingCount++;
          problemItems.push({
            id: m.id,
            name: m.name,
            monkName: m.monkName,
            templeId: m.templeId,
            templeName,
            templeProvince,
            currentRegion9: undefined,
            expectedRegion9,
            status: 'missing',
          });
        } else if (m.region9 === expectedRegion9) {
          validCount++;
        } else {
          incorrectCount++;
          problemItems.push({
            id: m.id,
            name: m.name,
            monkName: m.monkName,
            templeId: m.templeId,
            templeName,
            templeProvince,
            currentRegion9: m.region9,
            expectedRegion9,
            status: 'incorrect',
          });
        }
      });

      setAuditSummary({
        total: allMonks.length,
        validCount,
        missingCount,
        incorrectCount,
        templeNotFoundCount,
        unmappableProvinceCount,
        problemItems,
      });
    } catch (err: any) {
      console.error('Monk audit error:', err);
      setAuditError(err?.message || 'เกิดข้อผิดพลาดในการตรวจสอบข้อมูลพระสงฆ์');
    } finally {
      setIsAuditing(false);
    }
  };

  // Find latest health check status for each monk
  const monkStatusMap = useMemo(() => {
    const map = new Map<string, { status: string; year: number }>();
    healthChecks
      .filter((hc) => hc.year === selectedYearFilter)
      .forEach((hc) => {
        map.set(hc.monkId, { status: hc.healthStatus, year: hc.year });
      });
    return map;
  }, [healthChecks, selectedYearFilter]);

  // Filtered Monks List
  const filteredMonks = useMemo(() => {
    return monks.filter((m) => {
      // Temple Admin check
      if (currentUser?.role === 'temple_admin' && currentUser.templeId) {
        if (m.templeId !== currentUser.templeId) return false;
      } else if (selectedTempleFilter !== 'all' && m.templeId !== selectedTempleFilter) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = m.name.toLowerCase().includes(q);
        const matchChaya = m.monkName.toLowerCase().includes(q);
        const matchId = m.id.toLowerCase().includes(q);
        if (!matchName && !matchChaya && !matchId) return false;
      }

      // Status filter
      if (selectedStatusFilter !== 'all') {
        const monkStatus = monkStatusMap.get(m.id)?.status || 'unchecked';
        if (selectedStatusFilter === 'unchecked') {
          if (monkStatus !== 'unchecked') return false;
        } else if (monkStatus !== selectedStatusFilter) {
          return false;
        }
      }

      return true;
    });
  }, [
    monks,
    currentUser,
    selectedTempleFilter,
    searchQuery,
    selectedStatusFilter,
    monkStatusMap,
  ]);

  const handleOpenAdd = () => {
    setEditingMonk(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (m: Monk) => {
    setEditingMonk(m);
    setIsModalOpen(true);
  };

  const handleViewDetail = (monkId: string) => {
    setSelectedMonkId(monkId);
    setActiveTab('monk_detail');
  };

  const handleEntryHealth = (monk: Monk) => {
    setPrefillHealthEntry({
      monkId: monk.id,
      templeId: monk.templeId,
      year: selectedYearFilter,
    });
    setActiveTab('health_entry');
  };

  const handleDeleteMonk = async (m: Monk) => {
    if (
      confirm(
        `คุณต้องการลบข้อมูลพระสงฆ์ ${m.name} (${m.monkName}) หรือไม่? การลบจะลบข้อมูลออกจากระบบจริง`
      )
    ) {
      try {
        setActionError(null);
        await deleteMonk(m.id);
      } catch (err: any) {
        console.error('Error deleting monk:', err);
        setActionError(err?.message || 'เกิดข้อผิดพลาดในการลบข้อมูลพระสงฆ์');
      }
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-xs border border-stone-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Users className="w-5 h-5 text-emerald-700" />
            <span className="text-xs font-bold text-stone-500 uppercase tracking-wider font-heading">
              ทะเบียนพระสงฆ์
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold font-heading text-stone-900 tracking-tight">
            รายชื่อพระสงฆ์และประวัติสุขภาพ
          </h1>
          <p className="text-stone-500 text-xs sm:text-sm">
            จัดการทะเบียน รหัสประจำตัวพระสงฆ์ (monkId) และติดตามสถานะการตรวจสุขภาพ
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => refreshMonks()}
            disabled={isMonksLoading}
            className="p-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
            title="รีเฟรชข้อมูลพระสงฆ์"
          >
            <RefreshCw className={`w-4 h-4 ${isMonksLoading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">รีเฟรช</span>
          </button>

          <button
            id="add-monk-list-btn"
            onClick={handleOpenAdd}
            className="px-4 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white font-bold rounded-xl text-sm flex items-center gap-2 shadow-xs transition-colors cursor-pointer font-heading shrink-0"
          >
            <UserPlus className="w-4 h-4 text-amber-300" />
            <span>+ เพิ่มพระสงฆ์ใหม่</span>
          </button>
        </div>
      </div>

      {/* Temporary Super Admin Read-Only Monk Region9 Audit Section */}
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
                    ตรวจสอบ Region9 ของพระสงฆ์ (เครื่องมือวินิจฉัยข้อมูลชั่วคราว)
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
              id="btn-audit-monk-region9"
              onClick={runMonkRegion9Audit}
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
                  <span>ตรวจสอบ Region9 ของพระสงฆ์</span>
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
                  <span className="block text-[11px] font-medium text-stone-500">จำนวนพระทั้งหมด</span>
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
                      รายการพระสงฆ์ที่ต้องตรวจสอบ ({auditSummary.problemItems.length} รูป):
                    </span>
                  </div>
                  <div className="overflow-x-auto rounded-xl border border-stone-200 max-h-72 overflow-y-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-stone-50 border-b border-stone-200 text-stone-600 sticky top-0">
                        <tr>
                          <th className="py-2.5 px-3 font-semibold">ชื่อพระสงฆ์</th>
                          <th className="py-2.5 px-3 font-semibold">ฉายา</th>
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
                            <td className="py-2 px-3 font-medium text-stone-900">{item.name}</td>
                            <td className="py-2 px-3 text-stone-700">{item.monkName || '-'}</td>
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
                  <span>พระสงฆ์ทุกรูปในระบบมี Region9 ครบถ้วนและถูกต้องตรงตามจังหวัดของวัด</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Action / Load Error Alerts */}
      {(monksError || actionError) && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 text-xs text-rose-800 flex items-start justify-between gap-3">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">เกิดข้อผิดพลาด</p>
              <p>{monksError || actionError}</p>
            </div>
          </div>
          {monksError && (
            <button
              onClick={() => refreshMonks()}
              className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-semibold shrink-0"
            >
              ลองใหม่
            </button>
          )}
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-2xl p-4 shadow-xs border border-stone-200 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
            <input
              id="search-monk-input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ค้นหาชื่อ, ฉายา, รหัส..."
              className="w-full pl-9 pr-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs text-stone-800 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
            />
          </div>

          {/* Temple Filter */}
          <div>
            <select
              id="list-temple-filter"
              value={selectedTempleFilter}
              disabled={currentUser?.role === 'temple_admin'}
              onChange={(e) => setSelectedTempleFilter(e.target.value)}
              className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-xs text-stone-800 focus:ring-2 focus:ring-emerald-600 focus:outline-none disabled:bg-stone-100 font-medium"
            >
              {currentUser?.role === 'super_admin' && <option value="all">ทุกวัดในระบบ</option>}
              {currentUser?.role === 'region_admin' && <option value="all">ทุกวัดในภาค</option>}
              {temples.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.province})
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              id="list-status-filter"
              value={selectedStatusFilter}
              onChange={(e) => setSelectedStatusFilter(e.target.value)}
              className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-xs text-stone-800 focus:ring-2 focus:ring-emerald-600 focus:outline-none font-medium"
            >
              <option value="all">ทุกสถานะสุขภาพ ({selectedYearFilter})</option>
              <option value="normal">กลุ่มปกติ</option>
              <option value="monitor">กลุ่มเฝ้าระวัง</option>
              <option value="risk">กลุ่มเสี่ยง</option>
              <option value="medical_attention">ควรพบแพทย์</option>
              <option value="unchecked">ยังไม่ได้รับการตรวจในปีนี้</option>
            </select>
          </div>

          {/* Year Filter */}
          <div>
            <select
              id="list-year-filter"
              value={selectedYearFilter}
              onChange={(e) => setSelectedYearFilter(Number(e.target.value))}
              className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-xs font-bold text-stone-800 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
            >
              {availableYears.map((yr) => (
                <option key={yr} value={yr}>
                  ผลตรวจ {formatBuddhistYearLabel(yr)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Results Counter */}
        <div className="flex items-center justify-between text-xs text-stone-500 pt-2 border-t border-stone-100">
          <span>
            พบพระสงฆ์ตามเงื่อนไข <strong>{filteredMonks.length}</strong> รูป (จากทั้งหมด {monks.length} รูป)
          </span>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="text-emerald-700 hover:underline text-xs"
            >
              ล้างคำค้นหา
            </button>
          )}
        </div>
      </div>

      {/* Monk Table */}
      <div className="bg-white rounded-2xl shadow-xs border border-stone-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-stone-100 text-stone-700 border-b border-stone-200 font-heading">
                <th className="p-3.5 text-center w-12 font-bold">ลำดับ</th>
                <th className="p-3.5 font-bold">รหัสพระสงฆ์</th>
                <th className="p-3.5 font-bold">ชื่อ - ฉายา</th>
                <th className="p-3.5 text-center font-bold">อายุ (ปี)</th>
                <th className="p-3.5 text-center font-bold">พรรษา</th>
                <th className="p-3.5 font-bold">วัดต้นสังกัด</th>
                <th className="p-3.5 font-bold">จังหวัด</th>
                <th className="p-3.5 text-center font-bold">สถานะสุขภาพ ({selectedYearFilter})</th>
                <th className="p-3.5 text-right font-bold">การจัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {isMonksLoading ? (
                <tr>
                  <td colSpan={9} className="p-12 text-center text-stone-500">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <Loader2 className="w-6 h-6 animate-spin text-emerald-700" />
                      <span className="text-sm font-medium">กำลังโหลดข้อมูลพระสงฆ์จากระบบ Firestore...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredMonks.length > 0 ? (
                filteredMonks.map((monk, index) => {
                  const statusInfo = monkStatusMap.get(monk.id);
                  const temple = temples.find((t) => t.id === monk.templeId);

                  return (
                    <tr
                      key={monk.id}
                      className="hover:bg-stone-50/80 transition-colors group"
                    >
                      <td className="p-3.5 text-center text-stone-400 font-mono">
                        {index + 1}
                      </td>

                      <td className="p-3.5 font-mono font-bold text-emerald-800">
                        {monk.id}
                      </td>

                      <td className="p-3.5 font-medium text-stone-900">
                        <div className="font-bold text-stone-900">{monk.name}</div>
                        <div className="text-[11px] text-stone-500">{monk.monkName}</div>
                      </td>

                      <td className="p-3.5 text-center font-semibold text-stone-800">
                        {monk.age}
                      </td>

                      <td className="p-3.5 text-center text-stone-700">
                        {monk.monasticYears}
                      </td>

                      <td className="p-3.5 text-stone-800 font-medium">
                        {temple?.name || monk.templeId}
                      </td>

                      <td className="p-3.5 text-stone-600">
                        {monk.province}
                      </td>

                      <td className="p-3.5 text-center">
                        {statusInfo ? (
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold ${
                              HEALTH_STATUS_LABELS[statusInfo.status as any]?.bg || 'bg-stone-100'
                            } ${
                              HEALTH_STATUS_LABELS[statusInfo.status as any]?.color || 'text-stone-700'
                            }`}
                          >
                            {HEALTH_STATUS_LABELS[statusInfo.status as any]?.label || statusInfo.status}
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] bg-stone-100 text-stone-400">
                            ยังไม่ตรวจปีนี้
                          </span>
                        )}
                      </td>

                      <td className="p-3.5 text-right space-x-1.5 whitespace-nowrap">
                        {/* View Profile */}
                        <button
                          id={`view-monk-${monk.id}`}
                          onClick={() => handleViewDetail(monk.id)}
                          className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg text-xs font-semibold transition-colors inline-flex items-center gap-1 cursor-pointer"
                          title="ดูประวัติสุขภาพรายบุคคล"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>ดูประวัติ</span>
                        </button>

                        {/* Health Entry for this monk */}
                        {(currentUser?.role !== 'region_admin' || monk.templeId === currentUser.templeId) && (
                          <button
                            id={`entry-monk-${monk.id}`}
                            onClick={() => handleEntryHealth(monk)}
                            className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 rounded-lg text-xs font-semibold transition-colors inline-flex items-center gap-1 cursor-pointer"
                            title="กรอกผลตรวจสุขภาพปีนี้"
                          >
                            <ClipboardPenLine className="w-3.5 h-3.5 text-amber-700" />
                            <span>กรอกผล</span>
                          </button>
                        )}

                        {/* Edit Monk Info */}
                        <button
                          onClick={() => handleOpenEdit(monk)}
                          className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-lg transition-colors inline-flex"
                          title="แก้ไขข้อมูลพระสงฆ์"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        {/* Delete (Super admin only) */}
                        {currentUser?.role === 'super_admin' && (
                          <button
                            onClick={() => handleDeleteMonk(monk)}
                            className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors inline-flex"
                            title="ลบข้อมูลพระสงฆ์"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : monks.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-12 text-center text-stone-500">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <Users className="w-8 h-8 text-stone-300" />
                      <p className="text-sm font-semibold text-stone-700">
                        {currentUser?.role === 'temple_admin'
                          ? 'ยังไม่มีรายชื่อพระสงฆ์ในวัดนี้'
                          : currentUser?.role === 'region_admin'
                          ? 'ยังไม่มีรายชื่อพระสงฆ์ในภาคนี้'
                          : 'ยังไม่มีข้อมูลพระสงฆ์ในระบบ'}
                      </p>
                      <p className="text-xs text-stone-400">
                        สามารถกดปุ่ม "+ เพิ่มพระสงฆ์ใหม่" เพื่อเริ่มต้นบันทึกข้อมูลพระสงฆ์ลงระบบ
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-stone-400">
                    ไม่พบข้อมูลพระสงฆ์ตามเงื่อนไขการค้นหา
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Modal */}
      <AddMonkModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        editMonk={editingMonk}
      />
    </div>
  );
};
