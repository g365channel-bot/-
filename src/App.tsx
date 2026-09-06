/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { LoginModal } from './components/LoginModal';
import { DashboardView } from './components/DashboardView';
import { HealthEntryView } from './components/HealthEntryView';
import { MonkListView } from './components/MonkListView';
import { MonkDetailView } from './components/MonkDetailView';
import { YearlyComparisonView } from './components/YearlyComparisonView';
import { ReportsView } from './components/ReportsView';
import { GuideView } from './components/GuideView';
import { TempleManagementView } from './components/TempleManagementView';
import { HeartPulse, Loader2, Lock, Building2 } from 'lucide-react';

const MainContent: React.FC = () => {
  const { activeTab, setActiveTab, currentUser, isAuthLoading } = useApp();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [loginModalMode, setLoginModalMode] = useState<'login' | 'register'>('login');

  // Automatically prompt login modal when session check completes and user is not authenticated
  useEffect(() => {
    if (!isAuthLoading && !currentUser) {
      setLoginModalMode('login');
      setIsLoginModalOpen(true);
    }
  }, [isAuthLoading, currentUser]);

  // Route / Render guard: If region_admin reaches a disallowed tab (health_entry, temple_management),
  // immediately redirect active tab to dashboard
  useEffect(() => {
    if (currentUser?.role === 'region_admin') {
      if (activeTab === 'health_entry' || activeTab === 'temple_management') {
        setActiveTab('dashboard');
      }
    }
  }, [currentUser?.role, activeTab, setActiveTab]);

  // Requirement 9: Auth loading state to prevent flickering protected content
  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-stone-100 flex flex-col items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-emerald-800 flex items-center justify-center text-amber-300 shadow-md">
            <HeartPulse className="w-8 h-8 text-amber-300 animate-pulse" />
          </div>
          <div className="flex items-center gap-2.5 text-stone-700 text-sm font-medium">
            <Loader2 className="w-4 h-4 animate-spin text-emerald-800" />
            <span>กำลังตรวจสอบสิทธิ์การใช้งาน...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-100 flex flex-col text-stone-800 font-sans selection:bg-emerald-200 selection:text-emerald-900">
      {/* Top Navigation */}
      <Navbar
        onOpenLoginModal={() => setIsLoginModalOpen(true)}
        onToggleMobileMenu={() => setIsMobileMenuOpen((prev) => !prev)}
      />

      {/* App Body - Only allow access if currentUser is authenticated */}
      {currentUser ? (
        <div className="flex-1 flex w-full max-w-7xl mx-auto">
          {/* Sidebar */}
          <Sidebar
            isMobileOpen={isMobileMenuOpen}
            onCloseMobile={() => setIsMobileMenuOpen(false)}
          />

          {/* Dynamic Main Workspace */}
          <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto min-w-0">
            {activeTab === 'dashboard' && <DashboardView />}
            {activeTab === 'health_entry' && currentUser.role !== 'region_admin' && <HealthEntryView />}
            {activeTab === 'monk_list' && <MonkListView />}
            {activeTab === 'monk_detail' && <MonkDetailView />}
            {activeTab === 'yearly_comparison' && <YearlyComparisonView />}
            {activeTab === 'reports' && <ReportsView />}
            {activeTab === 'guide' && <GuideView />}
            {activeTab === 'temple_management' && currentUser.role === 'super_admin' && (
              <TempleManagementView />
            )}
          </main>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center p-4 sm:p-6">
          <div className="max-w-md w-full bg-white rounded-2xl p-8 border border-stone-200 shadow-xl text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-emerald-800/10 border border-emerald-800/20 mx-auto flex items-center justify-center text-emerald-800">
              <Lock className="w-8 h-8 text-emerald-800" />
            </div>
            <div>
              <h2 className="text-xl font-bold font-heading text-stone-900">
                กรุณาเข้าสู่ระบบ
              </h2>
              <p className="text-sm text-stone-600 mt-1 leading-relaxed">
                ระบบฐานข้อมูลสุขภาพพระสงฆ์ สำหรับบันทึกและติดตามข้อมูลสุขภาพประจำปี
              </p>
            </div>
            <div className="pt-2 flex flex-col gap-2">
              <button
                id="main-login-btn"
                onClick={() => {
                  setLoginModalMode('login');
                  setIsLoginModalOpen(true);
                }}
                className="w-full py-3 px-4 bg-emerald-800 hover:bg-emerald-900 text-white font-semibold rounded-xl text-sm transition-colors shadow-sm cursor-pointer"
              >
                เข้าสู่ระบบ (Sign In)
              </button>
              <button
                id="main-register-btn"
                onClick={() => {
                  setLoginModalMode('register');
                  setIsLoginModalOpen(true);
                }}
                className="w-full py-2.5 px-4 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-semibold rounded-xl text-sm transition-colors shadow-sm cursor-pointer flex items-center justify-center gap-2"
              >
                <Building2 className="w-4 h-4 text-amber-700" />
                <span>สมัครใช้งานสำหรับวัด</span>
              </button>
            </div>
            <div className="text-xs text-stone-400">
              เฉพาะผู้ใช้งานที่มีบัญชีและได้รับการอนุมัติสิทธิ์จากผู้ดูแลระบบ
            </div>
          </div>
        </div>
      )}

      {/* Login / Auth Modal */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        initialMode={loginModalMode}
      />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainContent />
    </AppProvider>
  );
}
