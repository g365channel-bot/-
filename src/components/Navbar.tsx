import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  ShieldCheck,
  Building2,
  LogOut,
  RotateCcw,
  Menu,
  X,
  UserCheck,
  HeartPulse,
} from 'lucide-react';
import { UserRole } from '../types';

interface NavbarProps {
  onToggleMobileMenu: () => void;
  isMobileMenuOpen?: boolean;
  onOpenLoginModal?: () => void;
  onOpenLogin?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onToggleMobileMenu,
  isMobileMenuOpen = false,
  onOpenLoginModal,
  onOpenLogin,
}) => {
  const { currentUser, logout, resetToDefaultData, setActiveTab } = useApp();
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const handleOpenLogin = () => {
    if (onOpenLoginModal) {
      onOpenLoginModal();
    } else if (onOpenLogin) {
      onOpenLogin();
    }
  };

  const handleLogout = async () => {
    await logout();
  };

  const handleReset = () => {
    resetToDefaultData();
    setShowResetConfirm(false);
  };

  return (
    <header className="bg-emerald-800 text-white shadow-md sticky top-0 z-30 no-print border-b border-emerald-900/40">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        {/* Main Header Container */}
        <div className="py-2.5 sm:py-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 sm:gap-4 min-h-[64px] sm:min-h-[72px]">
          {/* Top/Left: Hamburger, Brand Logo, and System Title */}
          <div className="flex items-center justify-between sm:justify-start gap-2.5 sm:gap-3.5 min-w-0 flex-1">
            <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
              {/* Hamburger Button (Mobile / Tablet) */}
              <button
                id="mobile-menu-toggle-btn"
                onClick={onToggleMobileMenu}
                className="lg:hidden p-2 -ml-1 rounded-xl text-emerald-100 hover:text-white hover:bg-emerald-700/60 focus:outline-none focus:ring-2 focus:ring-amber-400/40 shrink-0 transition-colors cursor-pointer"
                aria-label="เปิดเมนู"
              >
                {isMobileMenuOpen ? <X className="w-5 h-5 sm:w-6 sm:h-6" /> : <Menu className="w-5 h-5 sm:w-6 sm:h-6" />}
              </button>

              {/* Brand Logo & System Name */}
              <div
                id="logo-brand-btn"
                onClick={() => setActiveTab('dashboard')}
                className="flex items-center gap-2.5 sm:gap-3.5 cursor-pointer group min-w-0"
              >
                <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-300 shadow-inner group-hover:bg-amber-500/30 group-hover:scale-105 transition-all shrink-0">
                  <HeartPulse className="w-5 h-5 sm:w-6 sm:h-6 text-amber-300" />
                </div>
                <div className="min-w-0">
                  <div className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold tracking-tight text-white font-heading leading-tight break-words">
                    ระบบฐานข้อมูลสุขภาพพระสงฆ์
                  </div>
                  <div className="text-[11px] sm:text-xs text-emerald-200/90 hidden xl:block mt-0.5 leading-normal">
                    บันทึกผลตรวจสุขภาพประจำปี • แดชบอร์ดสถิติ • เปรียบเทียบผลย้อนหลัง
                  </div>
                </div>
              </div>
            </div>

            {/* Mobile-only quick role pill on top row for compactness */}
            <div className="sm:hidden shrink-0">
              <span className="text-[10px] font-semibold bg-emerald-900/60 border border-emerald-700/60 text-emerald-200 px-2 py-0.5 rounded-full">
                {currentUser?.role === 'super_admin' ? 'Super Admin' : (currentUser?.templeName?.slice(0, 10) || 'วัด')}
              </span>
            </div>
          </div>

          {/* Bottom on Mobile / Right on Tablet & Desktop: Actions */}
          <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-2.5 pt-1.5 sm:pt-0 border-t border-emerald-700/40 sm:border-t-0 shrink-0">
            {/* Current Role Badge (read-only) */}
            {currentUser && (
              <div
                id="user-role-badge"
                className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-medium border shadow-xs ${
                  currentUser.role === 'super_admin'
                    ? 'bg-amber-500/20 border-amber-400/50 text-amber-200'
                    : 'bg-emerald-700/70 border-emerald-500/50 text-emerald-100'
                }`}
                title={currentUser.role === 'super_admin' ? 'ผู้ดูแลระบบ (Super Admin)' : currentUser.templeName || 'ผู้ใช้งานประจำวัด'}
              >
                {currentUser.role === 'super_admin' ? (
                  <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-300 shrink-0" />
                ) : (
                  <Building2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-300 shrink-0" />
                )}
                <span className="hidden md:inline font-semibold max-w-[140px] lg:max-w-[200px] truncate">
                  {currentUser.role === 'super_admin' ? 'ผู้ดูแลระบบ (ส่วนกลาง)' : currentUser.templeName || 'ผู้ใช้งานประจำวัด'}
                </span>
                <span className="md:hidden font-semibold">
                  {currentUser.role === 'super_admin' ? 'แอดมินกลาง' : 'ประจำวัด'}
                </span>
              </div>
            )}

            {/* Refresh data button */}
            <button
              id="reset-data-btn"
              onClick={() => setShowResetConfirm(true)}
              className="p-1.5 sm:p-2 text-emerald-200 hover:text-white hover:bg-emerald-700/60 rounded-xl transition-colors text-xs flex items-center gap-1 cursor-pointer"
              title="รีเฟรชข้อมูลล่าสุดจากระบบ"
            >
              <RotateCcw className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
              <span className="hidden xl:inline text-xs">รีเฟรชข้อมูล</span>
            </button>

            {/* Auth button */}
            {currentUser ? (
              <button
                id="logout-btn"
                onClick={handleLogout}
                className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-medium bg-emerald-900/60 hover:bg-emerald-900 border border-emerald-700/70 text-emerald-100 transition-colors cursor-pointer"
                title="ออกจากระบบ"
              >
                <LogOut className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                <span className="hidden sm:inline">ออกจากระบบ</span>
                <span className="sm:hidden">ออก</span>
              </button>
            ) : (
              <button
                id="login-nav-btn"
                onClick={handleOpenLogin}
                className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs bg-amber-500 hover:bg-amber-600 text-stone-900 font-semibold transition-colors shadow-xs cursor-pointer"
              >
                <UserCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                <span>เข้าสู่ระบบ</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Refresh Confirmation Dialog */}
      {showResetConfirm && (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl text-stone-800 border border-stone-200">
            <h3 className="text-lg font-bold font-heading text-stone-900 mb-2 flex items-center gap-2">
              <RotateCcw className="w-5 h-5 text-amber-600" />
              ยืนยันการรีเฟรชข้อมูลจากระบบ
            </h3>
            <p className="text-sm text-stone-600 mb-6 leading-relaxed">
              ระบบจะทำการดึงข้อมูลล่าสุดของวัด รายชื่อพระสงฆ์ และผลการตรวจสุขภาพทั้งหมดจากฐานข้อมูล Firestore อีกครั้ง
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="px-4 py-2 text-sm font-medium rounded-lg text-stone-700 hover:bg-stone-100 transition-colors"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleReset}
                className="px-4 py-2 text-sm font-semibold rounded-lg bg-emerald-700 text-white hover:bg-emerald-800 transition-colors shadow-xs"
              >
                รีเฟรชข้อมูลทันที
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
