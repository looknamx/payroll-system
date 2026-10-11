'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Smartphone,
  Clock,
  CalendarDays,
  UserMinus,
  Wallet,
  Calculator,
  FileSpreadsheet,
  Building2,
  ListOrdered,
  FileText,
  FileCheck2,
  FileBadge,
  ShieldCheck,
  Settings,
  Menu,
  X,
  CreditCard,
} from 'lucide-react';

interface MenuItem {
  name: string;
  href: string;
  icon: React.ElementType;
}

const menuItems: MenuItem[] = [
  { name: 'แดชบอร์ด', href: '/', icon: LayoutDashboard },
  { name: 'ข้อมูลพนักงาน', href: '/employees', icon: Users },
  { name: 'ลงเวลาผ่านมือถือ', href: '/mobile-checkin', icon: Smartphone },
  { name: 'เวลาทำงาน', href: '/attendance', icon: Clock },
  { name: 'ระบบลางาน', href: '/leave', icon: CalendarDays },
  { name: 'การลาออก', href: '/resignation', icon: UserMinus },
  { name: 'เบิกจ่ายล่วงหน้า', href: '/advance', icon: Wallet },
  { name: 'คำนวณเงินได้ / เงินหัก', href: '/payroll/calculate', icon: Calculator },
  { name: 'สรุปเงินเดือน', href: '/payroll/summary', icon: FileSpreadsheet },
  { name: 'สรุปตามแผนก', href: '/payroll/department', icon: Building2 },
  { name: 'สรุปรายละเอียดทั้งหมด', href: '/payroll/details', icon: ListOrdered },
  { name: 'สลิปเงินเดือน', href: '/payslip', icon: FileText },
  { name: 'หนังสือรับรองหัก ณ ที่จ่าย (ภ.ง.ด.50 ทวิ)', href: '/reports/withholding-tax', icon: FileCheck2 },
  { name: 'แบบ ภ.ง.ด.1', href: '/reports/pnd1', icon: FileBadge },
  { name: 'แบบประกันสังคม (สปส.1-10)', href: '/reports/sso', icon: ShieldCheck },
  { name: 'ตั้งค่า', href: '/settings', icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* Mobile Top Bar */}
      <div className="lg:hidden flex items-center justify-between bg-slate-900 text-white px-4 py-3 sticky top-0 z-40 shadow-md">
        <div className="flex items-center space-x-2">
          <CreditCard className="w-6 h-6 text-blue-400" />
          <span className="font-semibold text-base tracking-tight">ระบบเงินเดือนและพนักงาน</span>
        </div>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 focus:outline-none"
          aria-label="เมนู"
        >
          {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Backdrop for Mobile */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-xs"
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-slate-900 text-slate-200 flex flex-col border-r border-slate-800 transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800 bg-slate-950">
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/30 group-hover:scale-105 transition-transform">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-white text-base tracking-tight leading-tight">PAYROLL PRO</div>
              <div className="text-xs text-slate-400 font-medium">ระบบบริหารงานบุคคล</div>
            </div>
          </Link>
          <button
            onClick={() => setIsOpen(false)}
            className="lg:hidden p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700">
          <div className="px-3 pb-2 text-[11px] font-bold text-slate-300 uppercase tracking-wider">
            เมนูหลัก
          </div>
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group ${
                  active
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 font-semibold'
                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                }`}
              >
                <Icon
                  className={`w-5 h-5 shrink-0 transition-colors ${
                    active ? 'text-white' : 'text-slate-400 group-hover:text-blue-400'
                  }`}
                />
                <span className="truncate">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer info */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-950/60 text-xs text-slate-300">
          <div className="flex items-center justify-between">
            <span className="font-medium text-slate-200">ฝ่ายทรัพยากรบุคคล</span>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-950 text-emerald-400 border border-emerald-800">
              ออนไลน์
            </span>
          </div>
          <div className="mt-1 text-[11px] text-slate-300">ประจำปี พ.ศ. 2569</div>
        </div>
      </aside>
    </>
  );
}

