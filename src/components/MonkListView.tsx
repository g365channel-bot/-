import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
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
} from 'lucide-react';
import { HEALTH_STATUS_LABELS, Monk } from '../types';
import { AddMonkModal } from './AddMonkModal';

export const MonkListView: React.FC = () => {
  const {
    currentUser,
    temples,
    monks,
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
  const [selectedYearFilter, setSelectedYearFilter] = useState<number>(2569);

  // Add / Edit Monk Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMonk, setEditingMonk] = useState<Monk | null>(null);

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

  const handleDeleteMonk = (m: Monk) => {
    if (
      confirm(
        `คุณต้องการลบข้อมูลพระสงฆ์ ${m.name} (${m.monkName}) หรือไม่? การลบจะรวมถึงประวัติผลตรวจทั้งหมด`
      )
    ) {
      deleteMonk(m.id);
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

        <button
          id="add-monk-list-btn"
          onClick={handleOpenAdd}
          className="px-4 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white font-bold rounded-xl text-sm flex items-center gap-2 shadow-xs transition-colors cursor-pointer font-heading shrink-0"
        >
          <UserPlus className="w-4 h-4 text-amber-300" />
          <span>+ เพิ่มพระสงฆ์ใหม่</span>
        </button>
      </div>

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
              placeholder="ค้นหาชื่อ, ฉายา, รหัส (M001)..."
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
              <option value={2569}>ผลตรวจ พ.ศ. 2569</option>
              <option value={2568}>ผลตรวจ พ.ศ. 2568</option>
              <option value={2567}>ผลตรวจ พ.ศ. 2567</option>
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
              {filteredMonks.length > 0 ? (
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
                        <button
                          id={`entry-monk-${monk.id}`}
                          onClick={() => handleEntryHealth(monk)}
                          className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 rounded-lg text-xs font-semibold transition-colors inline-flex items-center gap-1 cursor-pointer"
                          title="กรอกผลตรวจสุขภาพปีนี้"
                        >
                          <ClipboardPenLine className="w-3.5 h-3.5 text-amber-700" />
                          <span>กรอกผล</span>
                        </button>

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
