'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Users,
  Wallet,
  TrendingDown,
  TrendingUp,
  Clock,
  CalendarCheck,
  AlertCircle,
  Calculator,
  UserPlus,
  ArrowRight,
  Building2,
  Calendar,
} from 'lucide-react';
import { formatCurrency, THAI_MONTHS } from '@/lib/utils';

export default function DashboardPage() {
  const [month, setMonth] = useState<number>(10);
  const [year, setYear] = useState<number>(2026);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/dashboard?month=${month}&year=${year}`);
      const json = await res.json();
      setData(json);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, [month, year]);

  const stats = data?.stats;
  const period = data?.period;
  const deptSummaries = data?.departmentSummaries || {};

  return (
    <div className="space-y-6">
      {/* Page Header with Period Filter */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">แดชบอร์ดภาพรวม</h1>
          <p className="text-sm text-slate-500 mt-1">
            สรุปข้อมูลพนักงานและการจ่ายเงินเดือนประจำรอบเดือน
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-xl border border-slate-200">
            <Calendar className="w-4 h-4 text-slate-500 ml-2" />
            <select
              value={month}
              onChange={(e) => setMonth(parseInt(e.target.value))}
              className="bg-transparent text-sm font-medium text-slate-700 outline-none pr-2 cursor-pointer"
            >
              {THAI_MONTHS.map((m, idx) => (
                <option key={idx} value={idx + 1}>
                  {m}
                </option>
              ))}
            </select>
            <select
              value={year}
              onChange={(e) => setYear(parseInt(e.target.value))}
              className="bg-transparent text-sm font-medium text-slate-700 outline-none pr-2 cursor-pointer border-l border-slate-300 pl-2"
            >
              <option value={2026}>พ.ศ. 2569 (2026)</option>
              <option value={2025}>พ.ศ. 2568 (2025)</option>
              <option value={2027}>พ.ศ. 2570 (2027)</option>
            </select>
          </div>

          <Link
            href={`/payroll/calculate?month=${month}&year=${year}`}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium transition shadow-sm shadow-blue-600/30"
          >
            <Calculator className="w-4 h-4" />
            <span>คำนวณเงินเดือน</span>
          </Link>
        </div>
      </div>

      {/* Main KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Employees */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-slate-300 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              พนักงานทั้งหมด
            </span>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
              {stats?.totalEmployees ?? 0}
            </span>
            <span className="text-sm font-medium text-slate-500">คน</span>
          </div>
          <div className="mt-2 text-xs text-slate-500 flex items-center gap-2">
            <span>ประจำ: {stats?.monthlyEmployees ?? 0} คน</span>
            <span>•</span>
            <span>รายวัน: {stats?.dailyEmployees ?? 0} คน</span>
          </div>
        </div>

        {/* Total Incomes */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-slate-300 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              ยอดเงินได้รวม
            </span>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-1">
            <span className="text-2xl font-extrabold text-slate-900 tracking-tight">
              ฿{formatCurrency(stats?.totalIncome || stats?.totalBaseSalary)}
            </span>
          </div>
          <div className="mt-2 text-xs text-emerald-600 font-medium">
            {period ? 'ยอดเงินได้ที่คำนวณแล้ว' : 'ประมาณการจากฐานเงินเดือน'}
          </div>
        </div>

        {/* Total Deductions */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-slate-300 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              ยอดเงินหักรวม
            </span>
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <TrendingDown className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-1">
            <span className="text-2xl font-extrabold text-rose-600 tracking-tight">
              ฿{formatCurrency(stats?.totalDeduction)}
            </span>
          </div>
          <div className="mt-2 text-xs text-slate-500">
            รวมประกันสังคม, ภาษี, เบิกล่วงหน้า
          </div>
        </div>

        {/* Net Pay */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-slate-300 transition bg-gradient-to-br from-blue-50/50 to-indigo-50/30">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-blue-900 uppercase tracking-wider">
              ยอดจ่ายสุทธิ
            </span>
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
              <Wallet className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-1">
            <span className="text-2xl font-extrabold text-blue-950 tracking-tight">
              ฿{formatCurrency(stats?.netPay)}
            </span>
          </div>
          <div className="mt-2 text-xs font-semibold text-blue-700">
            สถานะรอบ: {period?.status === 'PAID' ? 'จ่ายเรียบร้อยแล้ว' : period?.status === 'VERIFIED' ? 'ตรวจสอบแล้ว' : 'ฉบับร่าง'}
          </div>
        </div>
      </div>

      {/* Action Banners & Warnings */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {stats?.incompleteEmployees > 0 && (
          <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <div className="text-sm font-semibold text-amber-900">
                ข้อมูลพนักงานยังไม่ครบ {stats.incompleteEmployees} คน
              </div>
              <div className="text-xs text-amber-700 mt-1">
                พนักงานบางท่านยังไม่มีเลขบัญชีธนาคาร หรือบัตรประชาชน
              </div>
              <Link
                href="/employees"
                className="inline-flex items-center gap-1 text-xs font-semibold text-amber-800 hover:text-amber-950 mt-2"
              >
                ไปตรวจสอบข้อมูล <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        )}

        {stats?.pendingLeaves > 0 && (
          <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl flex items-start gap-3">
            <CalendarCheck className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <div className="text-sm font-semibold text-blue-900">
                คำขอลางานรออนุมัติ {stats.pendingLeaves} รายการ
              </div>
              <div className="text-xs text-blue-700 mt-1">
                ตรวจสอบก่อนเริ่มกระบวนการคำนวณเงินเดือน
              </div>
              <Link
                href="/leave"
                className="inline-flex items-center gap-1 text-xs font-semibold text-blue-800 hover:text-blue-950 mt-2"
              >
                ไปหน้าระบบลา <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        )}

        {stats?.pendingAdvances > 0 && (
          <div className="bg-purple-50 border border-purple-200 p-4 rounded-xl flex items-start gap-3">
            <Clock className="w-5 h-5 text-purple-600 shrink-0 mt-0.5" />
            <div>
              <div className="text-sm font-semibold text-purple-900">
                รายการเบิกเงินล่วงหน้า {stats.pendingAdvances} รายการ
              </div>
              <div className="text-xs text-purple-700 mt-1">
                ระบบจะนำไปหักในรอบเงินเดือนโดยอัตโนมัติ
              </div>
              <Link
                href="/advance"
                className="inline-flex items-center gap-1 text-xs font-semibold text-purple-800 hover:text-purple-950 mt-2"
              >
                ดูรายการเบิกล่วงหน้า <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Status Notice if No Calculation Yet */}
      {!period && (
        <div className="bg-white p-8 rounded-2xl border border-dashed border-slate-300 text-center">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-4">
            <Calculator className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-slate-800">
            ยังไม่มีข้อมูลการคำนวณเงินเดือนรอบ {THAI_MONTHS[month - 1]} {year + 543}
          </h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto mt-2">
            คุณสามารถเริ่มคำนวณเงินเดือนประจำรอบเดือนนี้เพื่อสร้างรายงาน สลิปเงินเดือน และแบบฟอร์มส่งภาษี/ประกันสังคม
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              href={`/payroll/calculate?month=${month}&year=${year}`}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium transition shadow-md shadow-blue-600/20"
            >
              <Calculator className="w-4 h-4" />
              <span>เริ่มคำนวณเงินเดือนรอบนี้</span>
            </Link>
            <Link
              href="/employees"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-medium transition"
            >
              <UserPlus className="w-4 h-4" />
              <span>จัดการข้อมูลพนักงาน</span>
            </Link>
          </div>
        </div>
      )}

      {/* Department Breakdown */}
      {Object.keys(deptSummaries).length > 0 && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-bold text-slate-900">สรุปยอดตามแผนกประจำรอบ</h2>
            </div>
            <Link
              href="/payroll/department"
              className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
            >
              ดูรายงานแบบละเอียด <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(deptSummaries).map(([deptName, info]: [string, any]) => (
              <div
                key={deptName}
                className="p-4 rounded-xl border border-slate-100 bg-slate-50/70 hover:bg-slate-50 transition"
              >
                <div className="font-semibold text-slate-800 text-sm">{deptName}</div>
                <div className="text-xs text-slate-500 mt-1">จำนวน {info.count} คน</div>
                <div className="mt-3 flex items-baseline justify-between">
                  <span className="text-xs text-slate-500">จ่ายสุทธิ:</span>
                  <span className="text-base font-bold text-slate-900">
                    ฿{formatCurrency(info.totalNet)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Links Section */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: 'สลิปเงินเดือน', href: '/payslip', color: 'hover:border-blue-500' },
          { label: 'ภ.ง.ด.50 ทวิ', href: '/reports/withholding-tax', color: 'hover:border-emerald-500' },
          { label: 'แบบ ภ.ง.ด.1', href: '/reports/pnd1', color: 'hover:border-indigo-500' },
          { label: 'สปส.1-10', href: '/reports/sso', color: 'hover:border-amber-500' },
          { label: 'บันทึกเวลาทำงาน', href: '/attendance', color: 'hover:border-teal-500' },
          { label: 'ตั้งค่าระบบ', href: '/settings', color: 'hover:border-purple-500' },
        ].map((link, idx) => (
          <Link
            key={idx}
            href={link.href}
            className={`p-4 bg-white rounded-xl border border-slate-200/80 text-center text-sm font-semibold text-slate-700 hover:shadow-xs transition ${link.color}`}
          >
            {link.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
