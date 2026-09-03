import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { UserPlus, X, AlertCircle } from 'lucide-react';
import { Monk } from '../types';

interface AddMonkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (newMonk: Monk) => void;
  initialTempleId?: string;
  editMonk?: Monk | null;
}

export const AddMonkModal: React.FC<AddMonkModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialTempleId,
  editMonk,
}) => {
  const { temples, addMonk, updateMonk, currentUser } = useApp();

  const [name, setName] = useState('');
  const [monkName, setMonkName] = useState('');
  const [age, setAge] = useState<number | ''>('');
  const [monasticYears, setMonasticYears] = useState<number | ''>('');
  const [templeId, setTempleId] = useState('');
  const [province, setProvince] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (editMonk) {
      setName(editMonk.name);
      setMonkName(editMonk.monkName);
      setAge(editMonk.age);
      setMonasticYears(editMonk.monasticYears);
      setTempleId(editMonk.templeId);
      setProvince(editMonk.province);
    } else {
      setName('');
      setMonkName('');
      setAge('');
      setMonasticYears('');
      const defaultTid =
        initialTempleId ||
        (currentUser?.role === 'temple_admin' && currentUser.templeId) ||
        temples[0]?.id ||
        '';
      setTempleId(defaultTid);
      const t = temples.find((item) => item.id === defaultTid);
      setProvince(t?.province || 'กรุงเทพมหานคร');
    }
    setError(null);
  }, [isOpen, editMonk, initialTempleId, currentUser, temples]);

  const handleTempleChange = (tid: string) => {
    setTempleId(tid);
    const t = temples.find((item) => item.id === tid);
    if (t) {
      setProvince(t.province);
    }
  };

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('กรุณากรอกชื่อ-นามสกุล หรือชื่อพระสงฆ์');
      return;
    }
    if (!monkName.trim()) {
      setError('กรุณากรอกฉายา เช่น ฐิตธมฺโม');
      return;
    }
    if (!age || Number(age) <= 0) {
      setError('กรุณากรอกอายุให้ถูกต้อง');
      return;
    }
    if (monasticYears === '' || Number(monasticYears) < 0) {
      setError('กรุณากรอกพรรษาให้ถูกต้อง');
      return;
    }
    if (!templeId) {
      setError('กรุณาเลือกวัด');
      return;
    }

    if (editMonk) {
      const updated: Monk = {
        ...editMonk,
        name: name.trim(),
        monkName: monkName.trim(),
        age: Number(age),
        monasticYears: Number(monasticYears),
        templeId,
        province,
      };
      updateMonk(updated);
      if (onSuccess) onSuccess(updated);
      onClose();
    } else {
      const created = addMonk({
        name: name.trim(),
        monkName: monkName.trim(),
        age: Number(age),
        monasticYears: Number(monasticYears),
        templeId,
        province,
      });
      if (onSuccess) onSuccess(created);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-stone-200">
        {/* Header */}
        <div className="bg-emerald-800 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-emerald-700/80 rounded-xl">
              <UserPlus className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h3 className="font-bold text-lg font-heading text-white">
                {editMonk ? 'แก้ไขข้อมูลพระสงฆ์' : '+ เพิ่มรายชื่อพระสงฆ์ใหม่'}
              </h3>
              <p className="text-xs text-emerald-200">
                {editMonk
                  ? `รหัส ${editMonk.id}`
                  : 'ระบบจะสร้างรหัสประจำตัว (monkId) เดิมให้อัตโนมัติ'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-emerald-200 hover:text-white hover:bg-emerald-700/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs p-3 rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Warning Banner */}
          {!editMonk && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-900 flex items-start gap-2">
              <span className="text-base leading-none">⚠️</span>
              <span className="leading-relaxed">
                <strong>ข้อควรระวัง:</strong> หากพระสงฆ์รูปนี้เคยมีรายชื่อในระบบอยู่แล้ว ไม่ต้องเพิ่มใหม่ ให้ค้นหาจากรายชื่อเดิม เพื่อให้ผลตรวจแต่ละปีเชื่อมโยงกัน
              </span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                ชื่อพระสงฆ์ <span className="text-rose-500">*</span>
              </label>
              <input
                id="monk-name-input"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="เช่น พระสมชาย, พระมหาไพโรจน์"
                className="w-full px-3 py-2.5 rounded-xl border border-stone-300 text-sm focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                ฉายา <span className="text-rose-500">*</span>
              </label>
              <input
                id="monk-chaya-input"
                type="text"
                value={monkName}
                onChange={(e) => setMonkName(e.target.value)}
                placeholder="เช่น ฐิตธมฺโม, กิตฺติญาโณ"
                className="w-full px-3 py-2.5 rounded-xl border border-stone-300 text-sm focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                อายุ (ปี) <span className="text-rose-500">*</span>
              </label>
              <input
                id="monk-age-input"
                type="number"
                min="15"
                max="120"
                value={age}
                onChange={(e) => setAge(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="เช่น 45"
                className="w-full px-3 py-2.5 rounded-xl border border-stone-300 text-sm focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                พรรษา <span className="text-rose-500">*</span>
              </label>
              <input
                id="monk-vassa-input"
                type="number"
                min="0"
                max="100"
                value={monasticYears}
                onChange={(e) =>
                  setMonasticYears(e.target.value === '' ? '' : Number(e.target.value))
                }
                placeholder="เช่น 20"
                className="w-full px-3 py-2.5 rounded-xl border border-stone-300 text-sm focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                วัดต้นสังกัด <span className="text-rose-500">*</span>
              </label>
              <select
                id="monk-temple-select"
                value={templeId}
                onChange={(e) => handleTempleChange(e.target.value)}
                disabled={currentUser?.role === 'temple_admin'}
                className="w-full px-3 py-2.5 rounded-xl border border-stone-300 text-sm focus:ring-2 focus:ring-emerald-600 focus:outline-none disabled:bg-stone-100 disabled:text-stone-500 font-medium"
                required
              >
                {temples.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.province})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">จังหวัด</label>
              <input
                type="text"
                value={province}
                readOnly
                className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-stone-100 text-stone-600 text-sm focus:outline-none cursor-not-allowed"
              />
            </div>
          </div>

          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-stone-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-sm font-medium rounded-xl text-stone-600 hover:bg-stone-100 transition-colors"
            >
              ยกเลิก
            </button>
            <button
              id="monk-save-btn"
              type="submit"
              className="px-5 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white font-semibold rounded-xl text-sm transition-colors shadow-sm font-heading"
            >
              {editMonk ? 'บันทึกการแก้ไข' : 'บันทึกเพิ่มพระสงฆ์'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
