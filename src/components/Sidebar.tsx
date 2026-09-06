import React from 'react';
import { useApp } from '../context/AppContext';
import { currentBuddhistYear } from '../utils/buddhistYear';
import {
  LayoutDashboard,
  ClipboardPenLine,
  Users,
  GitCompare,
  FileSpreadsheet,
  HelpCircle,
  Building,
  Sparkles,
} from 'lucide-react';
import { ActiveTab } from '../types';

interface SidebarProps {
  isMobileOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isMobileOpen, onCloseMobile }) => {
  const { activeTab, setActiveTab, currentUser, setSelectedMonkId } = useApp();

  const handleNavClick = (tab: ActiveTab) => {
    setActiveTab(tab);
    if (tab !== 'monk_detail') {
      setSelectedMonkId(null);
    }
    onCloseMobile();
  };

  const navItems = [
    {
      id: 'dashboard' as ActiveTab,
      label: 'แดชบอร์ด',
      sublabel: 'ภาพรวมสถานะและสถิติสุขภาพ',
      icon: LayoutDashboard,
    },
    // Hide health_entry for region_admin (read-only for health in V1)
    ...(currentUser?.role !== 'region_admin'
      ? [
          {
            id: 'health_entry' as ActiveTab,
            label: 'กรอกข้อมูลสุขภาพ',
            sublabel: 'บันทึกผลตรวจประจำปี',
            icon: ClipboardPenLine,
            highlight: true,
          },
        ]
      : []),
    {
      id: 'monk_list' as ActiveTab,
      label: 'รายชื่อพระสงฆ์',
      sublabel: 'ทะเบียนและประวัติรายบุคคล',
      icon: Users,
    },
    {
      id: 'yearly_comparison' as ActiveTab,
      label: 'เปรียบเทียบรายปี',
      sublabel: 'วิเคราะห์แนวโน้มและการเปลี่ยนแปลง',
      icon: GitCompare,
    },
    {
      id: 'reports' as ActiveTab,
      label: 'รายงาน',
      sublabel: 'สรุปข้อมูลและดาวน์โหลด',
      icon: FileSpreadsheet,
    },
    {
      id: 'guide' as ActiveTab,
      label: 'คู่มือการใช้งาน',
      sublabel: 'ขั้นตอนและคำถามพบบ่อย',
      icon: HelpCircle,
    },
  ];

  // Super Admin only menu item
  if (currentUser?.role === 'super_admin') {
    navItems.push({
      id: 'temple_management' as ActiveTab,
      label: 'จัดการวัด',
      sublabel: 'ข้อมูลวัดและโรงพยาบาลพี่เลี้ยง',
      icon: Building,
    });
  }

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-stone-900/50 backdrop-blur-xs z-30 lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      <aside
        id="main-sidebar"
        className={`fixed lg:static top-18 bottom-0 left-0 z-40 w-72 bg-white border-r border-stone-200 flex flex-col justify-between transition-transform duration-200 ease-in-out lg:translate-x-0 no-print ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Navigation List */}
        <div className="p-4 space-y-1.5 overflow-y-auto flex-1">
          <div className="px-3 pt-1 pb-2 text-[11px] font-bold text-stone-400 uppercase tracking-wider font-heading">
            เมนูหลักของระบบ
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              activeTab === item.id || (item.id === 'monk_list' && activeTab === 'monk_detail');

            return (
              <button
                key={item.id}
                id={`nav-item-${item.id}`}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center space-x-3.5 px-3.5 py-3 rounded-xl text-left text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-emerald-800 text-white shadow-sm font-semibold'
                    : item.highlight
                    ? 'bg-amber-50 text-amber-900 hover:bg-amber-100/80 border border-amber-200/80'
                    : 'text-stone-700 hover:bg-stone-100 hover:text-stone-900'
                }`}
              >
                <div
                  className={`p-2 rounded-lg shrink-0 ${
                    isActive
                      ? 'bg-emerald-700/80 text-emerald-100'
                      : item.highlight
                      ? 'bg-amber-200/60 text-amber-800'
                      : 'bg-stone-100 text-stone-600'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="truncate text-base leading-tight font-heading">{item.label}</div>
                  <div
                    className={`text-xs truncate mt-0.5 ${
                      isActive ? 'text-emerald-200' : 'text-stone-500'
                    }`}
                  >
                    {item.sublabel}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Bottom Helper / Quick Flow reminder card */}
        <div className="p-4 border-t border-stone-100 bg-stone-50/70">
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 text-stone-800">
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900 font-heading mb-1">
              <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
              <span>ลำดับขั้นตอนการทำงาน</span>
            </div>
            <div className="text-[11px] text-stone-600 leading-relaxed space-y-0.5">
              <span className="font-semibold text-stone-800">เลือกวัด</span> → <span className="font-semibold text-stone-800">เลือกปี</span> → <span className="font-semibold text-stone-800">เลือกพระ</span> → <span className="font-semibold text-stone-800">กรอกข้อมูล</span> → <span className="font-semibold text-stone-800">บันทึก</span> → <span className="font-semibold text-stone-800">ดูผล</span>
            </div>
          </div>
          <div className="mt-2 text-[11px] text-stone-400 text-center">
            ระบบฐานข้อมูลสุขภาพพระสงฆ์ © {currentBuddhistYear}
          </div>
        </div>
      </aside>
    </>
  );
};
