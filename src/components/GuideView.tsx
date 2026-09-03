import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  HelpCircle,
  ChevronDown,
  UserPlus,
  ClipboardPenLine,
  LayoutDashboard,
  GitCompare,
  CheckCircle2,
  ShieldCheck,
  HeartHandshake,
  BookOpen,
} from 'lucide-react';

export const GuideView: React.FC = () => {
  const { setActiveTab } = useApp();
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const faqs = [
    {
      q: 'ถ้าผลตรวจเลือดหรือผลตรวจแล็บบางรายการไม่มี ต้องทำอย่างไร?',
      a: 'สามารถเว้นว่างช่องนั้นไว้ได้เลย ไม่จำเป็นต้องกรอกทุกช่อง และข้อสำคัญคือ "ห้ามกรอกเลข 0 แทนค่าที่ไม่มี" เพื่อไม่ให้ระบบนำเลข 0 ไปคำนวณค่าเฉลี่ยทางสถิติที่ผิดพลาด',
    },
    {
      q: 'ผลตรวจสุขภาพแต่ละปีเชื่อมโยงกันอย่างไร?',
      a: 'ระบบเชื่อมโยงข้อมูลสุขภาพของพระสงฆ์แต่ละรูปด้วยรหัสประจำตัวพระสงฆ์ (monkId) เดียวกันตลอดชีพ เช่น เมื่อตรวจปี 2567, 2568, 2569 ระบบจะนำ monkId เดียวกันมาสร้างกราฟเปรียบเทียบและวิเคราะห์แนวโน้มอัตโนมัติ โดยไม่ต้องสร้างรายชื่อพระสงฆ์ใหม่ทุกปี',
    },
    {
      q: 'หากมีพระสงฆ์บวชใหม่ หรือพระสงฆ์ย้ายสังกัดวัด ต้องทำอย่างไร?',
      a: 'สำหรับพระบวชใหม่ ให้กดปุ่ม "+ เพิ่มพระสงฆ์ใหม่" เพื่อสร้างรหัส monkId ใหม่ ส่วนพระสงฆ์เดิมที่ย้ายวัด สามารถเข้าไปที่ "รายชื่อพระสงฆ์" แล้วกดปุ่มแก้ไขเพื่อเปลี่ยนวัดต้นสังกัดได้ โดยประวัติสุขภาพเดิมจะยังคงอยู่ครบถ้วน',
    },
    {
      q: 'ใครสามารถเข้าถึงข้อมูลสุขภาพของพระสงฆ์ได้บ้าง?',
      a: 'ระบบกำหนดสิทธิ์ 2 ระดับ: (1) ผู้ใช้งานประจำวัด (Temple Admin) จะมองเห็นและจัดการได้เฉพาะข้อมูลพระสงฆ์ภายในวัดของตนเอง (2) ผู้ดูแลระบบกลาง (Super Admin) จะมองเห็นภาพรวมและสถิติเปรียบเทียบทุกวัดเพื่อใช้วางแผนนโยบายส่งเสริมสุขภาพ',
    },
    {
      q: 'ข้อมูลที่กรอกจะถูกบันทึกที่ใด และปลอดภัยหรือไม่?',
      a: 'ข้อมูลสุขภาพจัดเป็นข้อมูลส่วนบุคคลที่มีความอ่อนไหวสูง ระบบมีการเข้ารหัสและจำกัดสิทธิ์การเข้าถึงอย่างเคร่งครัด สำหรับการทดสอบใช้งานระบบในเวอร์ชันนี้ ข้อมูลจะถูกจัดเก็บในหน่วยความจำของบราวเซอร์ (Local Storage) และสามารถเชื่อมต่อฐานข้อมูลความปลอดภัยสูงของกระทรวงฯ ได้ทันที',
    },
  ];

  const steps = [
    {
      step: 1,
      title: 'เพิ่มรายชื่อพระสงฆ์',
      desc: 'ลงทะเบียนพระสงฆ์ในวัดครั้งแรก เพื่อรับรหัส monkId ประจำตัว',
      icon: UserPlus,
      actionText: 'ไปหน้ารายชื่อพระสงฆ์',
      tab: 'monk_list' as const,
    },
    {
      step: 2,
      title: 'กรอกผลตรวจประจำปี',
      desc: 'เลือกพระสงฆ์และกรอกผลตรวจสุขภาพ 4 ส่วนสั้น ๆ เน้นกดเลือก',
      icon: ClipboardPenLine,
      actionText: 'ไปหน้ากรอกข้อมูล',
      tab: 'health_entry' as const,
    },
    {
      step: 3,
      title: 'ดูผลสรุป Dashboard',
      desc: 'ติดตามสถานะสุขภาพกลุ่มปกติ เฝ้าระวัง เสี่ยง และพฤติกรรม',
      icon: LayoutDashboard,
      actionText: 'ไปหน้าแดชบอร์ด',
      tab: 'dashboard' as const,
    },
    {
      step: 4,
      title: 'วิเคราะห์เปรียบเทียบรายปี',
      desc: 'ดูพัฒนาการแนวโน้มสุขภาพ การลดน้ำตาล ความดัน และการเลิกบุหรี่',
      icon: GitCompare,
      actionText: 'ไปหน้าเปรียบเทียบรายปี',
      tab: 'yearly_comparison' as const,
    },
  ];

  return (
    <div className="space-y-6 pb-16 max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-emerald-800 text-white rounded-2xl p-6 shadow-md flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <BookOpen className="w-5 h-5 text-amber-300" />
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-200 font-heading">
              คู่มือและช่วยเหลือ
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold font-heading text-white">
            คู่มือการใช้งานระบบฐานข้อมูลสุขภาพพระสงฆ์
          </h1>
          <p className="text-xs sm:text-sm text-emerald-100 mt-1">
            คำแนะนำขั้นตอนการทำงาน คำถามพบบ่อย และแนวทางดูแลสุขภาวะพระสงฆ์
          </p>
        </div>
      </div>

      {/* 4 Easy Steps */}
      <div className="bg-white rounded-2xl p-6 shadow-xs border border-stone-200 space-y-4">
        <h2 className="text-base font-bold font-heading text-stone-900 flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-700" />
          <span>4 ขั้นตอนการใช้งานระบบแบบง่าย</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {steps.map((s) => {
            const Icon = s.icon;
            return (
              <div
                key={s.step}
                className="p-4 rounded-xl border border-stone-200 bg-stone-50/60 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="w-7 h-7 rounded-full bg-emerald-800 text-white text-xs font-bold font-mono flex items-center justify-center">
                      {s.step}
                    </span>
                    <Icon className="w-5 h-5 text-emerald-700" />
                  </div>
                  <h3 className="text-sm font-bold font-heading text-stone-900 mb-1">
                    {s.title}
                  </h3>
                  <p className="text-xs text-stone-600 leading-relaxed">{s.desc}</p>
                </div>

                <button
                  onClick={() => setActiveTab(s.tab)}
                  className="mt-4 text-xs font-semibold text-emerald-800 hover:text-emerald-950 hover:underline flex items-center gap-1"
                >
                  <span>{s.actionText}</span> →
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Health Guidelines Recommendation Card */}
      <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-5 space-y-3">
        <div className="flex items-center gap-2 text-amber-900 font-bold font-heading text-sm">
          <HeartHandshake className="w-5 h-5 text-amber-700" />
          <span>ข้อแนะนำการดูแลสุขภาพพระสงฆ์ตามหลักพระธรรมวินัยและสุขอนามัย</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-stone-700">
          <div className="bg-white/80 p-3 rounded-xl border border-amber-200/60">
            <strong className="text-amber-900 block mb-1">1. โภชนาการภัตตาหาร</strong>
            รณรงค์ญาติโยมถวายภัตตาหารรสหวาน มัน เค็ม พอเหมาะ ลดน้ำหวานในน้ำปานะ เพิ่มผักและผลไม้สด
          </div>
          <div className="bg-white/80 p-3 rounded-xl border border-amber-200/60">
            <strong className="text-amber-900 block mb-1">2. กิจกรรมทางกาย</strong>
            สนับสนุนการเดินจงกรม กวาดลานวัด หรือการยืดเหยียดกล้ามเนื้ออย่างน้อย 30 นาทีต่อวัน
          </div>
          <div className="bg-white/80 p-3 rounded-xl border border-amber-200/60">
            <strong className="text-amber-900 block mb-1">3. การตรวจคัดกรองประจำปี</strong>
            ตรวจวัดความดันโลหิต น้ำตาลในเลือด และตรวจการทำงานของไตอย่างน้อยปีละ 1 ครั้ง
          </div>
        </div>
      </div>

      {/* FAQ Accordion */}
      <div className="bg-white rounded-2xl p-6 shadow-xs border border-stone-200 space-y-4">
        <h2 className="text-base font-bold font-heading text-stone-900 flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-emerald-700" />
          <span>คำถามที่พบบ่อย (FAQ)</span>
        </h2>

        <div className="space-y-2">
          {faqs.map((faq, index) => {
            const isOpen = openFaqIndex === index;
            return (
              <div
                key={index}
                className="border border-stone-200 rounded-xl overflow-hidden transition-colors"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaqIndex(isOpen ? null : index)}
                  className="w-full p-4 text-left font-semibold text-xs sm:text-sm text-stone-800 flex items-center justify-between hover:bg-stone-50 transition-colors cursor-pointer"
                >
                  <span className="font-heading pr-4">{faq.q}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-stone-400 shrink-0 transition-transform ${
                      isOpen ? 'rotate-180 text-emerald-700' : ''
                    }`}
                  />
                </button>

                {isOpen && (
                  <div className="p-4 pt-1 text-xs text-stone-600 bg-stone-50/50 border-t border-stone-100 leading-relaxed">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Security & Privacy Commitment */}
      <div className="bg-stone-100 rounded-2xl p-4 flex items-center gap-3 text-xs text-stone-600 border border-stone-200">
        <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0" />
        <span>
          ระบบฐานข้อมูลสุขภาพพระสงฆ์ให้ความสำคัญสูงสุดต่อการรักษาความปลอดภัยของข้อมูลส่วนบุคคล
          และการปกป้องสิทธิส่วนบุคคลตาม พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล (PDPA)
        </span>
      </div>
    </div>
  );
};
