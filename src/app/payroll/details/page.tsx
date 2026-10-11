'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ListOrdered,
  Calendar,
  Download,
  Printer,
  Search,
  Filter,
  Eye,
} from 'lucide-react';
import { formatCurrency, THAI_MONTHS } from '@/lib/utils';

export default function PayrollDetailsPage() {
  const [month, setMonth] = useState<number>(10);
  const [year, setYear] = useState<number>(2026);
  const [records, setRecords] = useState<any[]>([]);
  const [period, setPeriod] = useState<any>(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/dashboard?month=${month}&year=${year}`);
      const data = await res.json();
      setPeriod(data.period);

      if (data.period?.id) {
        const recRes = await fetch(`/api/payroll/records?periodId=${data.period.id}`);
        const recData = await recRes.json();
        setRecords(Array.isArray(recData) ? recData : []);
      } else {
        setRecords([]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [month, year]);

  const filteredRecords = records.filter((r) => {
    if (!search) return true;
    const term = search.toLowerCase();
    const code = r.employee?.employeeCode?.toLowerCase() || '';
    const name = `${r.employee?.firstName} ${r.employee?.lastName}`.toLowerCase();
    const dept = r.employee?.department?.name?.toLowerCase() || '';
    return code.includes(term) || name.includes(term) || dept.includes(term);
  });

  const exportCSV = () => {
    if (filteredRecords.length === 0) {
      alert('ไม่มีข้อมูลสำหรับส่งออก');
      return;
    }

    const headers = [
      'รหัสพนักงาน',
      'ชื่อ-นามสกุล',
      'แผนก',
      'เงินเดือนฐาน',
      'ค่าล่วงเวลา',
      'เงินได้รวม',
      'ประกันสังคม',
      'ภาษีหัก ณ ที่จ่าย',
      'เบิกจ่ายล่วงหน้า',
      'เงินหักรวม',
      'ยอดสุทธิ',
    ];

    const rows = filteredRecords.map((r) => {
      const ot = r.incomes?.find((i: any) => i.incomeType?.code === 'OT')?.amount || 0;
      const sso = r.deductions?.find((d: any) => d.deductionType?.code === 'SSO')?.amount || 0;
      const tax = r.deductions?.find((d: any) => d.deductionType?.code === 'TAX')?.amount || 0;
      const adv = r.deductions?.find((d: any) => d.deductionType?.code === 'ADVANCE')?.amount || 0;

      return [
        r.employee?.employeeCode,
        `"${r.employee?.firstName} ${r.employee?.lastName}"`,
        `"${r.employee?.department?.name || '-'}"`,
        r.baseSalary,
        ot,
        r.totalIncome,
        sso,
        tax,
        adv,
        r.totalDeduction,
        r.netPay,
      ];
    });

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `payroll_details_${month}_${year}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs print:hidden">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">สรุปรายละเอียดทั้งหมด</h1>
          <p className="text-sm text-slate-500 mt-1">
            ตารางแจกแจงทุกรายการเงินได้และเงินหักของพนักงานทุกคนในรอบเดือน
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
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
            onClick={exportCSV}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-semibold transition cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>ส่งออก CSV</span>
          </button>

          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-semibold transition cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>พิมพ์</span>
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between print:hidden">
        <div className="relative w-full max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="ค้นหารหัส, ชื่อ-นามสกุล, หรือแผนก..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-blue-500"
          />
        </div>
        <div className="text-xs text-slate-500">
          แสดง {filteredRecords.length} จาก {records.length} คน
        </div>
      </div>

      {/* Full Details Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50/80 text-[11px] text-slate-500 uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 font-semibold">รหัส</th>
                <th className="px-4 py-3 font-semibold">ชื่อ - นามสกุล</th>
                <th className="px-4 py-3 font-semibold">แผนก</th>
                <th className="px-4 py-3 font-semibold text-right">เงินเดือนฐาน</th>
                <th className="px-4 py-3 font-semibold text-right text-emerald-600">ค่าล่วงเวลา</th>
                <th className="px-4 py-3 font-semibold text-right font-bold text-slate-900">รวมเงินได้</th>
                <th className="px-4 py-3 font-semibold text-right text-rose-600">ประกันสังคม</th>
                <th className="px-4 py-3 font-semibold text-right text-rose-600">ภาษี ณ ที่จ่าย</th>
                <th className="px-4 py-3 font-semibold text-right text-rose-600">เบิกล่วงหน้า</th>
                <th className="px-4 py-3 font-semibold text-right font-bold text-rose-600">รวมเงินหัก</th>
                <th className="px-4 py-3 font-semibold text-right font-extrabold text-blue-700">สุทธิ</th>
                <th className="px-4 py-3 font-semibold text-center print:hidden">สลิป</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={12} className="text-center py-10 text-slate-400">
                    กำลังโหลดข้อมูล...
                  </td>
                </tr>
              ) : filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={12} className="text-center py-12 text-slate-400">
                    ไม่พบข้อมูลเงินเดือนในรอบที่เลือก
                  </td>
                </tr>
              ) : (
                filteredRecords.map((r) => {
                  const ot = r.incomes?.find((i: any) => i.incomeType?.code === 'OT')?.amount || 0;
                  const sso = r.deductions?.find((d: any) => d.deductionType?.code === 'SSO')?.amount || 0;
                  const tax = r.deductions?.find((d: any) => d.deductionType?.code === 'TAX')?.amount || 0;
                  const adv = r.deductions?.find((d: any) => d.deductionType?.code === 'ADVANCE')?.amount || 0;

                  return (
                    <tr key={r.id} className="hover:bg-slate-50/70 transition">
                      <td className="px-4 py-3 font-bold text-slate-900">
                        {r.employee?.employeeCode}
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-900">
                        {r.employee?.firstName} {r.employee?.lastName}
                      </td>
                      <td className="px-4 py-3 text-slate-500">
                        {r.employee?.department?.name || '-'}
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-slate-800">
                        ฿{formatCurrency(r.baseSalary)}
                      </td>
                      <td className="px-4 py-3 text-right text-emerald-600 font-medium">
                        {ot > 0 ? `฿${formatCurrency(ot)}` : '-'}
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-slate-900">
                        ฿{formatCurrency(r.totalIncome)}
                      </td>
                      <td className="px-4 py-3 text-right text-rose-600">
                        {sso > 0 ? `฿${formatCurrency(sso)}` : '-'}
                      </td>
                      <td className="px-4 py-3 text-right text-rose-600">
                        {tax > 0 ? `฿${formatCurrency(tax)}` : '-'}
                      </td>
                      <td className="px-4 py-3 text-right text-rose-600">
                        {adv > 0 ? `฿${formatCurrency(adv)}` : '-'}
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-rose-600">
                        ฿{formatCurrency(r.totalDeduction)}
                      </td>
                      <td className="px-4 py-3 text-right font-extrabold text-blue-700">
                        ฿{formatCurrency(r.netPay)}
                      </td>
                      <td className="px-4 py-3 text-center print:hidden">
                        <Link
                          href={`/payslip?recordId=${r.id}`}
                          className="p-1 rounded text-slate-400 hover:text-blue-600 transition"
                          title="ดูสลิป"
                        >
                          <Eye className="w-4 h-4 inline" />
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

