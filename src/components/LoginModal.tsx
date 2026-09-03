import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { HeartPulse, Eye, EyeOff, Lock, Mail, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { INITIAL_USERS } from '../mockData';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose }) => {
  const { setCurrentUser, temples } = useApp();
  const [email, setEmail] = useState('wat.bowon@monkhealth.go.th');
  const [password, setPassword] = useState('password123');
  const [showPassword, setShowPassword] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError('กรุณากรอกอีเมลและรหัสผ่าน');
      return;
    }

    // Match or create user
    const matched = INITIAL_USERS.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (matched) {
      setCurrentUser(matched);
      onClose();
      return;
    }

    // If typing custom email
    const isSuper = email.includes('admin');
    const defaultTemple = temples[0];
    setCurrentUser({
      id: `U-${Date.now()}`,
      email,
      name: isSuper ? 'ผู้ดูแลระบบกลาง' : `ผู้ประสานงานวัด ${defaultTemple?.name || ''}`,
      role: isSuper ? 'super_admin' : 'temple_admin',
      templeId: isSuper ? undefined : defaultTemple?.id,
      templeName: isSuper ? undefined : defaultTemple?.name,
    });
    onClose();
  };

  const handleQuickLogin = (index: number) => {
    const user = INITIAL_USERS[index];
    if (user) {
      setCurrentUser(user);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-stone-200">
        {/* Header */}
        <div className="bg-gradient-to-br from-emerald-800 to-emerald-900 text-white p-6 text-center relative">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-400/20 border border-amber-300/40 flex items-center justify-center text-amber-300 shadow-inner mb-3">
            <HeartPulse className="w-8 h-8 text-amber-300" />
          </div>
          <h2 className="text-2xl font-bold font-heading text-white tracking-tight">
            ระบบฐานข้อมูลสุขภาพพระสงฆ์
          </h2>
          <p className="text-emerald-200 text-xs mt-1">
            เข้าสู่ระบบบันทึกและติดตามข้อมูลสุขภาพ
          </p>
        </div>

        {/* Body */}
        <div className="p-6">
          {forgotSent ? (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl text-center space-y-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
              <div className="font-semibold">ส่งลิงก์ตั้งค่ารหัสผ่านใหม่เรียบร้อยแล้ว</div>
              <p className="text-xs text-stone-600">กรุณาตรวจสอบข้อความในอีเมลของท่าน</p>
              <button
                onClick={() => setForgotSent(false)}
                className="mt-3 text-xs text-emerald-700 font-semibold underline hover:text-emerald-900"
              >
                กลับไปหน้าเข้าสู่ระบบ
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs p-3 rounded-lg flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  อีเมล (Email)
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                  <input
                    id="login-email-input"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="example@monkhealth.go.th"
                    className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent text-sm"
                    required
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-stone-700">
                    รหัสผ่าน (Password)
                  </label>
                  <button
                    type="button"
                    onClick={() => setForgotSent(true)}
                    className="text-xs text-amber-700 hover:text-amber-800 hover:underline font-medium"
                  >
                    ลืมรหัสผ่าน?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                  <input
                    id="login-password-input"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-10 py-2.5 rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent text-sm font-sans"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-stone-400 hover:text-stone-600 p-0.5"
                    aria-label={showPassword ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                id="login-submit-btn"
                type="submit"
                className="w-full py-3 px-4 bg-emerald-800 hover:bg-emerald-900 text-white font-semibold rounded-xl text-base transition-colors shadow-sm cursor-pointer mt-2"
              >
                เข้าสู่ระบบ
              </button>

              {/* Privacy Notice */}
              <div className="bg-amber-50/70 border border-amber-200/70 rounded-lg p-2.5 text-center text-xs text-amber-900 leading-tight">
                🔒 ข้อมูลสุขภาพเป็นข้อมูลส่วนบุคคล กรุณาใช้งานอย่างเหมาะสม
              </div>
            </form>
          )}

          {/* Quick Demo Logins */}
          <div className="mt-5 pt-4 border-t border-stone-100">
            <div className="text-[11px] font-semibold text-stone-500 mb-2 text-center uppercase tracking-wide">
              เข้าใช้งานด่วนสำหรับทดสอบระบบ
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                id="quick-login-temple-btn"
                type="button"
                onClick={() => handleQuickLogin(1)}
                className="p-2 rounded-lg border border-emerald-200 bg-emerald-50/60 hover:bg-emerald-100 text-emerald-900 text-xs font-semibold text-center transition-colors"
              >
                ผู้ใช้งานประจำวัด
                <div className="text-[10px] font-normal text-emerald-700 truncate">วัดบวรนิเวศวิหาร</div>
              </button>
              <button
                id="quick-login-admin-btn"
                type="button"
                onClick={() => handleQuickLogin(0)}
                className="p-2 rounded-lg border border-amber-200 bg-amber-50/60 hover:bg-amber-100 text-amber-900 text-xs font-semibold text-center transition-colors"
              >
                ผู้ดูแลระบบกลาง
                <div className="text-[10px] font-normal text-amber-700 truncate">ดูได้ทุกพื้นที่</div>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-stone-50 px-6 py-3 border-t border-stone-100 flex justify-end">
          <button
            onClick={onClose}
            className="text-xs text-stone-600 hover:text-stone-800 font-medium px-3 py-1.5 rounded-lg hover:bg-stone-200/60 transition-colors"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
};
