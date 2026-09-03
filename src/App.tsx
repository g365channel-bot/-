/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
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

const MainContent: React.FC = () => {
  const { activeTab, currentUser } = useApp();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-stone-100 flex flex-col text-stone-800 font-sans selection:bg-emerald-200 selection:text-emerald-900">
      {/* Top Navigation */}
      <Navbar
        onOpenLoginModal={() => setIsLoginModalOpen(true)}
        onToggleMobileMenu={() => setIsMobileMenuOpen((prev) => !prev)}
      />

      {/* App Body */}
      <div className="flex-1 flex w-full max-w-7xl mx-auto">
        {/* Sidebar */}
        <Sidebar
          isMobileOpen={isMobileMenuOpen}
          onCloseMobile={() => setIsMobileMenuOpen(false)}
        />

        {/* Dynamic Main Workspace */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto min-w-0">
          {activeTab === 'dashboard' && <DashboardView />}
          {activeTab === 'health_entry' && <HealthEntryView />}
          {activeTab === 'monk_list' && <MonkListView />}
          {activeTab === 'monk_detail' && <MonkDetailView />}
          {activeTab === 'yearly_comparison' && <YearlyComparisonView />}
          {activeTab === 'reports' && <ReportsView />}
          {activeTab === 'guide' && <GuideView />}
          {activeTab === 'temple_management' && currentUser?.role === 'super_admin' && (
            <TempleManagementView />
          )}
        </main>
      </div>

      {/* Login / Auth Modal */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
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
