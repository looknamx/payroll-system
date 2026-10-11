'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  FileSpreadsheet,
  Download,
  Printer,
  CheckCircle2,
  AlertCircle,
  Building2,
  Calendar,
  Lock,
  ArrowRight,
} from 'lucide-react';
import { formatCurrency, formatThaiDateNumeric, THAI_MONTHS } from '@/lib/utils';

export default function PayrollSummaryPage() {
  const [month, setMonth] = useState<number>(10);
  const [year, setYear] = useState<number>(2026);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [confirmStatusModal, setConfirmStatusModal] = useState<string | null>(null);

  const fetchSummary = async () => {
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
    fetchSummary();
  }, [month, year]);

  const handleUpdatePeriodStatus = async (status: string) => {
    if (!data?.period?.id) return;
    try {
      const res = await fetch('/api/payroll/periods', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: data.period.id, status }),
      });
      if (res.ok) {
        setConfirmStatusModal(null);
        fetchSummary();
      } else {
        alert('เกิดข้อผิดพลาดในการปรับสถานะ');
      }
    } catch (e) {
      alert('เกิดข้อผิดพลาดในการเชื่อมต่อ');
    }
  };

  const exportCSV = () => {
    if (!data?.period?.records || data.period.records.length === 0) {
      alert('ไม่มีข้อมูลสำหรับส่งออก');
      return;
    }

    const headers = ['รหัสพนักงาน', 'ชื่อ-นามสกุล', 'แผนก', 'เงินได้รวม', 'เงินหักรวม', 'ยอดจ่ายสุทธิ', 'สถานะ'];
    const rows = data.period.records.map((r: any) => [
      r.employee?.employeeCode,
      `"${r.employee?.firstName} ${r.employee?.lastName}"`,
      `"${r.employee?.department?.name || '-'}"`,
      r.totalIncome,
      r.totalDeduction,
      r.netPay,
      r.status,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map((e: any) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `payroll_summary_${month}_${year}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const period = data?.period;
  const stats = data?.stats;
  const records = period?.records || [];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs print:hidden">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">สรุปเงินเดือน</h1>
          <p className="text-sm text-slate-500 mt-1">
            รายงานสรุปยอดจ่ายเงินเดือนประจำรอบ พร้อมการยืนยันสถานะและส่งออกเอกสาร
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
            <span>พิมพ์รายงาน</span>
          </button>
        </div>
      </div>

      {/* Period Status Card & Approval Controls */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-900">
              รอบเงินเดือน: {THAI_MONTHS[month - 1]} {year + 543}
            </h2>
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                period?.status === 'PAID'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : period?.status === 'VERIFIED'
                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                  : 'bg-amber-50 text-amber-700 border border-amber-200'
              }`}
            >
              {period?.status === 'PAID'
                ? 'จ่ายเงินแล้ว (PAID)'
                : period?.status === 'VERIFIED'
                ? 'ตรวจสอบแล้ว (VERIFIED)'
                : 'ฉบับร่าง (DRAFT)'}
            </span>
          </div>
          <div className="text-xs text-slate-500 mt-1">
            {period?.payDate
              ? `กำหนดจ่าย: ${formatThaiDateNumeric(period.payDate)}`
              : 'ยังไม่กำหนดวันจ่าย'}
          </div>
        </div>

        {/* Status Transition Action Buttons */}
        <div className="flex items-center gap-2 print:hidden">
          {period && period.status !== 'PAID' && (
            <>
              {period.status === 'DRAFT' && (
                <button
                  onClick={() => setConfirmStatusModal('VERIFIED')}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
                >
                  ยืนยันว่าตรวจสอบแล้ว
                </button>
              )}

              <button
                onClick={() => setConfirmStatusModal('PAID')}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>ยืนยันการจ่ายเงินเดือน (ปิดรอบ)</span>
              </button>
            </>
          )}

          {period?.status === 'PAID' && (
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-2 rounded-xl border border-emerald-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>รอบนี้จ่ายเงินเรียบร้อยแล้ว (ล็อกการแก้ไข)</span>
            </div>
          )}
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80">
          <div className="text-xs font-semibold text-slate-500">พนักงานในรอบนี้</div>
          <div className="text-2xl font-extrabold text-slate-900 mt-1">{records.length} คน</div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80">
          <div className="text-xs font-semibold text-slate-500">ยอดเงินได้รวม</div>
          <div className="text-2xl font-extrabold text-slate-900 mt-1">
            ฿{formatCurrency(stats?.totalIncome)}
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80">
          <div className="text-xs font-semibold text-rose-600">ยอดเงินหักรวม</div>
          <div className="text-2xl font-extrabold text-rose-600 mt-1">
            ฿{formatCurrency(stats?.totalDeduction)}
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 bg-blue-50/40">
          <div className="text-xs font-semibold text-blue-900">ยอดจ่ายสุทธิ</div>
          <div className="text-2xl font-extrabold text-blue-900 mt-1">
            ฿{formatCurrency(stats?.netPay)}
          </div>
        </div>
      </div>

      {/* Summary Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900">รายละเอียดรายบุคคลในรอบเดือน</h3>
          <Link
            href="/payroll/details"
            className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
          >
            ดูแจกแจงทุกรายการ <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50/80 text-xs text-slate-500 uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-5 py-3 font-semibold">รหัส</th>
                <th className="px-5 py-3 font-semibold">ชื่อ - นามสกุล</th>
                <th className="px-5 py-3 font-semibold">แผนก</th>
                <th className="px-5 py-3 font-semibold text-right">เงินได้รวม</th>
                <th className="px-5 py-3 font-semibold text-right">เงินหักรวม</th>
                <th className="px-5 py-3 font-semibold text-right text-blue-700">ยอดจ่ายสุทธิ</th>
                <th className="px-5 py-3 font-semibold text-center">สลิปเงินเดือน</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {records.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-slate-400">
                    ยังไม่มีข้อมูลในรอบนี้ กรุณาไปที่หน้า "คำนวณเงินได้ / เงินหัก" ก่อน
                  </td>
                </tr>
              ) : (
                records.map((r: any) => (
                  <tr key={r.id} className="hover:bg-slate-50/70 transition">
                    <td className="px-5 py-3.5 font-bold text-slate-900">
                      {r.employee?.employeeCode}
                    </td>
                    <td className="px-5 py-3.5 font-semibold text-slate-900">
                      {r.employee?.firstName} {r.employee?.lastName}
                    </td>
                    <td className="px-5 py-3.5 text-xs text-slate-500">
                      {r.employee?.department?.name || '-'}
                    </td>
                    <td className="px-5 py-3.5 text-right font-medium text-slate-900">
                      ฿{formatCurrency(r.totalIncome)}
                    </td>
                    <td className="px-5 py-3.5 text-right font-medium text-rose-600">
                      ฿{formatCurrency(r.totalDeduction)}
                    </td>
                    <td className="px-5 py-3.5 text-right font-bold text-blue-700">
                      ฿{formatCurrency(r.netPay)}
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <Link
                        href={`/payslip?recordId=${r.id}`}
                        className="inline-flex px-3 py-1 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 text-xs font-semibold transition"
                      >
                        เปิดสลิป
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirmation Modal */}
      {confirmStatusModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md p-6">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-3">
              <AlertCircle className="w-6 h-6" />
            </div>

            <h3 className="text-base font-bold text-slate-900 text-center">
              {confirmStatusModal === 'PAID'
                ? 'ยืนยันการจ่ายเงินเดือนและปิดรอบ?'
                : 'ยืนยันการตรวจสอบความถูกต้อง?'}
            </h3>

            <p className="text-xs text-slate-500 text-center mt-2">
              {confirmStatusModal === 'PAID'
                ? 'เมื่อยืนยันจ่ายเงินเดือนแล้ว ระบบจะล็อกการแก้ไขในรอบนี้เพื่อป้องกันการจ่ายซ้ำและรักษาความถูกต้องทางบัญชี'
                : 'เปลี่ยนสถานะเป็น "ตรวจสอบแล้ว" เพื่อเตรียมพร้อมสำหรับการจ่ายเงิน'}
            </p>

            <div className="flex justify-center gap-3 mt-6">
              <button
                onClick={() => setConfirmStatusModal(null)}
                className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100"
              >
                ยกเลิก
              </button>
              <button
                onClick={() => handleUpdatePeriodStatus(confirmStatusModal)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold text-white shadow-xs ${
                  confirmStatusModal === 'PAID'
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                ยืนยันดำเนินการ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

