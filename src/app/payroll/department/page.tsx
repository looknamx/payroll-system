'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Building2,
  Calendar,
  Users,
  TrendingUp,
  TrendingDown,
  Printer,
  Download,
} from 'lucide-react';
import { formatCurrency, THAI_MONTHS } from '@/lib/utils';

export default function DepartmentSummaryPage() {
  const [month, setMonth] = useState<number>(10);
  const [year, setYear] = useState<number>(2026);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
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
    fetchData();
  }, [month, year]);

  const records = data?.period?.records || [];

  // Group by department
  const deptMap: Record<string, { count: number; totalIncome: number; totalDeduction: number; netPay: number; employees: any[] }> = {};

  for (const r of records) {
    const dept = r.employee?.department?.name || 'ไม่ระบุแผนก';
    if (!deptMap[dept]) {
      deptMap[dept] = { count: 0, totalIncome: 0, totalDeduction: 0, netPay: 0, employees: [] };
    }
    deptMap[dept].count += 1;
    deptMap[dept].totalIncome += r.totalIncome;
    deptMap[dept].totalDeduction += r.totalDeduction;
    deptMap[dept].netPay += r.netPay;
    deptMap[dept].employees.push(r);
  }

  const deptList = Object.entries(deptMap);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs print:hidden">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">สรุปตามแผนก</h1>
          <p className="text-sm text-slate-500 mt-1">
            รายงานการจ่ายเงินเดือน ค่าล่วงเวลา และเงินหัก แยกตามหน่วยงานและแผนก
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
              <option value={2026}>พ.ศ. 2569</option>
              <option value={2025}>พ.ศ. 2568</option>
            </select>
          </div>

          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-semibold transition cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>พิมพ์</span>
          </button>
        </div>
      </div>

      {/* Department Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {deptList.length === 0 ? (
          <div className="col-span-full bg-white p-10 rounded-2xl border border-slate-200 text-center text-sm text-slate-400">
            ยังไม่มีข้อมูลเงินเดือนในรอบ {THAI_MONTHS[month - 1]} {year + 543}
          </div>
        ) : (
          deptList.map(([deptName, info]) => (
            <div
              key={deptName}
              className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-slate-300 transition flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="font-bold text-slate-900 text-base flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-blue-600" />
                    <span>{deptName}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-xs font-semibold bg-blue-50 text-blue-700">
                    {info.count} คน
                  </span>
                </div>

                <div className="mt-4 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">เงินได้รวม:</span>
                    <span className="font-semibold text-slate-900">
                      ฿{formatCurrency(info.totalIncome)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">เงินหักรวม:</span>
                    <span className="font-semibold text-rose-600">
                      ฿{formatCurrency(info.totalDeduction)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 flex items-baseline justify-between">
                <span className="text-xs font-bold text-slate-700">จ่ายสุทธิ:</span>
                <span className="text-lg font-extrabold text-blue-700">
                  ฿{formatCurrency(info.netPay)}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

