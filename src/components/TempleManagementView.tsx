import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Building, Plus, Search, MapPin, Phone, User, Stethoscope, Edit2, ShieldAlert } from 'lucide-react';
import { Temple } from '../types';

export const TempleManagementView: React.FC = () => {
  const { temples, monks, addTemple, updateTemple } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTemple, setEditingTemple] = useState<Temple | null>(null);

  const [name, setName] = useState('');
  const [district, setDistrict] = useState('');
  const [province, setProvince] = useState('กรุงเทพมหานคร');
  const [region, setRegion] = useState('กลาง');
  const [healthServiceUnit, setHealthServiceUnit] = useState('');
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

  const handleOpenAdd = () => {
    setEditingTemple(null);
    setName('');
    setDistrict('');
    setProvince('กรุงเทพมหานคร');
    setRegion('กลาง');
    setHealthServiceUnit('โรงพยาบาลส่งเสริมสุขภาพตำบล');
    setContactPerson('');
    setPhone('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (t: Temple) => {
    setEditingTemple(t);
    setName(t.name);
    setDistrict(t.district);
    setProvince(t.province);
    setRegion(t.region);
    setHealthServiceUnit(t.healthServiceUnit);
    setContactPerson(t.contactPerson || '');
    setPhone(t.phone || '');
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (editingTemple) {
      updateTemple({
        ...editingTemple,
        name: name.trim(),
        district: district.trim(),
        province: province.trim(),
        region: region.trim(),
        healthServiceUnit: healthServiceUnit.trim(),
        contactPerson: contactPerson.trim() || undefined,
        phone: phone.trim() || undefined,
      });
    } else {
      addTemple({
        name: name.trim(),
        district: district.trim(),
        province: province.trim(),
        region: region.trim(),
        healthServiceUnit: healthServiceUnit.trim() || 'หน่วยบริการสุขภาพในพื้นที่',
        contactPerson: contactPerson.trim() || undefined,
        phone: phone.trim() || undefined,
      });
    }
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-xs border border-stone-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Building className="w-5 h-5 text-emerald-700" />
            <span className="text-xs font-bold text-stone-500 uppercase tracking-wider font-heading">
              ผู้ดูแลระบบกลาง (Super Admin)
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold font-heading text-stone-900 tracking-tight">
            จัดการข้อมูลวัดและหน่วยบริการสุขภาพพี่เลี้ยง
          </h1>
          <p className="text-stone-500 text-xs sm:text-sm">
            เพิ่ม แก้ไข และเชื่อมโยงวัดเข้ากับโรงพยาบาล/รพ.สต. พี่เลี้ยง
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-4 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white font-bold rounded-xl text-sm flex items-center gap-2 shadow-xs transition-colors cursor-pointer font-heading"
        >
          <Plus className="w-4 h-4 text-amber-300" />
          <span>+ เพิ่มวัดใหม่</span>
        </button>
      </div>

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

      {/* Temple Cards Grid */}
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
                      {temple.id}
                    </span>
                    <h3 className="text-base font-bold font-heading text-stone-900 mt-1">
                      {temple.name}
                    </h3>
                  </div>
                  <button
                    onClick={() => handleOpenEdit(temple)}
                    className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-lg transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-1.5 text-xs text-stone-600">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                    <span>
                      {temple.district} จ.{temple.province} (ภาค{temple.region})
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Stethoscope className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span className="font-medium text-emerald-950 truncate">
                      {temple.healthServiceUnit}
                    </span>
                  </div>
                  {temple.contactPerson && (
                    <div className="flex items-center gap-1.5 text-[11px] text-stone-500">
                      <User className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                      <span>{temple.contactPerson} ({temple.phone || '-'})</span>
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

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-stone-200">
            <div className="bg-emerald-800 text-white px-6 py-4 flex items-center justify-between">
              <h3 className="font-bold text-lg font-heading text-white">
                {editingTemple ? 'แก้ไขข้อมูลวัด' : '+ เพิ่มวัดใหม่เข้าระบบ'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-emerald-200 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-3 text-xs">
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

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">อำเภอ/เขต</label>
                  <input
                    type="text"
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    placeholder="เช่น พระนคร"
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">จังหวัด</label>
                  <input
                    type="text"
                    value={province}
                    onChange={(e) => setProvince(e.target.value)}
                    placeholder="เช่น กรุงเทพมหานคร"
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">ภาค</label>
                <select
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
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
                  <label className="block font-semibold text-stone-700 mb-1">ผู้ประสานงาน</label>
                  <input
                    type="text"
                    value={contactPerson}
                    onChange={(e) => setContactPerson(e.target.value)}
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
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-stone-600 hover:bg-stone-100 rounded-xl"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-800 hover:bg-emerald-900 text-white font-bold rounded-xl font-heading"
                >
                  บันทึก
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
