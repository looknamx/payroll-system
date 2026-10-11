'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Calculator,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  ArrowRight,
  Edit,
  Eye,
  FileSpreadsheet,
  Calendar,
  X,
  CreditCard,
} from 'lucide-react';
import { formatCurrency, formatThaiDateNumeric, THAI_MONTHS } from '@/lib/utils';

export default function PayrollCalculatePage() {
  const [month, setMonth] = useState<number>(10);
  const [year, setYear] = useState<number>(2026);
  const [loading, setLoading] = useState(false);
  const [records, setRecords] = useState<any[]>([]);
  const [period, setPeriod] = useState<any>(null);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Edit Modal
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [editIncomes, setEditIncomes] = useState<any[]>([]);
  const [editDeductions, setEditDeductions] = useState<any[]>([]);
  const [editReason, setEditReason] = useState('');

  const fetchRecords = async () => {
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
    fetchRecords();
  }, [month, year]);

  const handleCalculate = async (force: boolean = false) => {
    if (period?.status === 'PAID' && !force) {
      const confirmForce = confirm(
        'รอบเงินเดือนนี้อยู่ในสถานะ "จ่ายแล้ว" การคำนวณใหม่อาจกระทบรายงานทางบัญชี คุณแน่ใจว่าต้องการคำนวณซ้ำหรือไม่?'
      );
      if (!confirmForce) return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch('/api/payroll/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ month, year, forceRecalculate: true }),
      });

      const json = await res.json();
      if (!res.ok) {
        setMessage({ text: json.error || 'เกิดข้อผิดพลาดในการคำนวณ', type: 'error' });
      } else {
        setMessage({ text: json.message, type: 'success' });
        fetchRecords();
      }
    } catch (e: any) {
      setMessage({ text: e.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อ', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenEdit = (rec: any) => {
    setSelectedRecord(rec);
    setEditIncomes(
      rec.incomes?.map((i: any) => ({
        id: i.id,
        incomeTypeId: i.incomeTypeId,
        name: i.incomeType?.name,
        amount: i.amount,
        note: i.note || '',
      })) || []
    );
    setEditDeductions(
      rec.deductions?.map((d: any) => ({
        id: d.id,
        deductionTypeId: d.deductionTypeId,
        name: d.deductionType?.name,
        amount: d.amount,
        note: d.note || '',
      })) || []
    );
    setEditReason('');
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecord) return;

    try {
      const res = await fetch(`/api/payroll/records/${selectedRecord.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          incomes: editIncomes,
          deductions: editDeductions,
          reason: editReason || 'แก้ไขตัวเลขเงินเดือนด้วยตนเอง',
        }),
      });

      if (res.ok) {
        setSelectedRecord(null);
        fetchRecords();
      } else {
        const err = await res.json();
        alert(err.error || 'ไม่สามารถบันทึกการแก้ไขได้');
      }
    } catch (e) {
      alert('เกิดข้อผิดพลาดในการเชื่อมต่อ');
    }
  };

  // Summary figures
  const totalIncome = records.reduce((acc, r) => acc + (r.totalIncome || 0), 0);
  const totalDeduction = records.reduce((acc, r) => acc + (r.totalDeduction || 0), 0);
  const netPay = records.reduce((acc, r) => acc + (r.netPay || 0), 0);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">คำนวณเงินได้ / เงินหัก</h1>
          <p className="text-sm text-slate-500 mt-1">
            ประมวลผลเงินเดือน ภาษีหัก ณ ที่จ่าย ประกันสังคม และค่าล่วงเวลาประจำรอบ
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
            onClick={() => handleCalculate(false)}
            disabled={loading}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-xl text-sm font-bold shadow-md shadow-blue-600/20 transition cursor-pointer disabled:opacity-50"
          >
            <Calculator className="w-4 h-4" />
            <span>{loading ? 'กำลังคำนวณ...' : 'ประมวลผลคำนวณเงินเดือน'}</span>
          </button>
        </div>
      </div>

      {/* Message Banner */}
      {message && (
        <div
          className={`p-4 rounded-xl flex items-center gap-2 text-sm font-medium ${
            message.type === 'success'
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border border-rose-200 text-rose-800'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Round Status Bar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-slate-500">สถานะรอบเงินเดือน:</span>
          <span
            className={`inline-flex px-3 py-1 rounded-full text-xs font-bold ${
              period?.status === 'PAID'
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : period?.status === 'VERIFIED'
                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                : 'bg-amber-50 text-amber-700 border border-amber-200'
            }`}
          >
            {period?.status === 'PAID'
              ? 'จ่ายแล้ว (PAID)'
              : period?.status === 'VERIFIED'
              ? 'ตรวจสอบแล้ว (VERIFIED)'
              : 'ฉบับร่าง (DRAFT)'}
          </span>
          <span className="text-xs text-slate-400">
            พนักงานในรอบนี้ {records.length} คน
          </span>
        </div>

        <div className="flex items-center gap-6">
          <div className="text-right">
            <span className="text-xs text-slate-500">รวมเงินได้: </span>
            <span className="text-sm font-bold text-slate-900">฿{formatCurrency(totalIncome)}</span>
          </div>
          <div className="text-right">
            <span className="text-xs text-slate-500">รวมเงินหัก: </span>
            <span className="text-sm font-bold text-rose-600">฿{formatCurrency(totalDeduction)}</span>
          </div>
          <div className="text-right">
            <span className="text-xs text-slate-500">ยอดจ่ายสุทธิ: </span>
            <span className="text-base font-extrabold text-blue-700">฿{formatCurrency(netPay)}</span>
          </div>
        </div>
      </div>

      {/* Calculation Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50/80 text-xs text-slate-500 uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-4 py-3.5 font-semibold">รหัส</th>
                <th className="px-4 py-3.5 font-semibold">ชื่อ - นามสกุล</th>
                <th className="px-4 py-3.5 font-semibold">แผนก</th>
                <th className="px-4 py-3.5 font-semibold text-right">ฐานเงินเดือน</th>
                <th className="px-4 py-3.5 font-semibold text-center">OT (ชม.)</th>
                <th className="px-4 py-3.5 font-semibold text-right">เงินได้รวม</th>
                <th className="px-4 py-3.5 font-semibold text-right">ประกันสังคม</th>
                <th className="px-4 py-3.5 font-semibold text-right">ภาษี หัก ณ ที่จ่าย</th>
                <th className="px-4 py-3.5 font-semibold text-right">เงินหักรวม</th>
                <th className="px-4 py-3.5 font-semibold text-right text-blue-700">สุทธิ</th>
                <th className="px-4 py-3.5 font-semibold text-center">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={11} className="text-center py-10 text-slate-400">
                    กำลังโหลดข้อมูล...
                  </td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan={11} className="text-center py-12 text-slate-400">
                    ยังไม่มีข้อมูลการคำนวณในรอบนี้ กรุณากดปุ่ม "ประมวลผลคำนวณเงินเดือน" ด้านบน
                  </td>
                </tr>
              ) : (
                records.map((rec) => {
                  const sso = rec.deductions?.find((d: any) => d.deductionType?.code === 'SSO')?.amount || 0;
                  const tax = rec.deductions?.find((d: any) => d.deductionType?.code === 'TAX')?.amount || 0;

                  return (
                    <tr key={rec.id} className="hover:bg-slate-50/70 transition">
                      <td className="px-4 py-3.5 font-bold text-slate-900">
                        {rec.employee?.employeeCode}
                      </td>
                      <td className="px-4 py-3.5 font-semibold text-slate-900">
                        {rec.employee?.firstName} {rec.employee?.lastName}
                      </td>
                      <td className="px-4 py-3.5 text-xs text-slate-500">
                        {rec.employee?.department?.name || '-'}
                      </td>
                      <td className="px-4 py-3.5 text-right font-medium text-slate-700">
                        ฿{formatCurrency(rec.baseSalary)}
                      </td>
                      <td className="px-4 py-3.5 text-center text-xs font-semibold text-blue-600">
                        {rec.overtimeHours > 0 ? `${rec.overtimeHours}` : '-'}
                      </td>
                      <td className="px-4 py-3.5 text-right font-bold text-slate-900">
                        ฿{formatCurrency(rec.totalIncome)}
                      </td>
                      <td className="px-4 py-3.5 text-right text-xs text-rose-600 font-medium">
                        ฿{formatCurrency(sso)}
                      </td>
                      <td className="px-4 py-3.5 text-right text-xs text-rose-600 font-medium">
                        ฿{formatCurrency(tax)}
                      </td>
                      <td className="px-4 py-3.5 text-right font-bold text-rose-600">
                        ฿{formatCurrency(rec.totalDeduction)}
                      </td>
                      <td className="px-4 py-3.5 text-right font-extrabold text-blue-700">
                        ฿{formatCurrency(rec.netPay)}
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleOpenEdit(rec)}
                            className="p-1 rounded text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition cursor-pointer"
                            title="ปรับปรุงรายการเงินได้/เงินหัก"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <Link
                            href={`/payslip?recordId=${rec.id}`}
                            className="p-1 rounded text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition"
                            title="ดูสลิปเงินเดือน"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Record Modal */}
      {selectedRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in duration-150">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  ปรับปรุงรายการเงินเดือน - {selectedRecord.employee?.firstName}{' '}
                  {selectedRecord.employee?.lastName}
                </h2>
                <div className="text-xs text-slate-500">
                  รหัส {selectedRecord.employee?.employeeCode} • รอบ {period?.name}
                </div>
              </div>
              <button
                onClick={() => setSelectedRecord(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="overflow-y-auto p-6 space-y-5">
              {/* Income Adjustments */}
              <div>
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  รายการเงินได้ (Incomes)
                </h3>
                <div className="space-y-2">
                  {editIncomes.map((inc, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      <span className="w-48 text-xs font-semibold text-slate-700 truncate">
                        {inc.name}
                      </span>
                      <input
                        type="number"
                        step="any"
                        value={inc.amount}
                        onChange={(e) => {
                          const updated = [...editIncomes];
                          updated[idx].amount = e.target.value;
                          setEditIncomes(updated);
                        }}
                        className="w-36 px-3 py-1.5 border border-slate-300 rounded-lg text-xs outline-none focus:border-blue-500 text-right font-medium"
                      />
                      <input
                        type="text"
                        placeholder="หมายเหตุ..."
                        value={inc.note}
                        onChange={(e) => {
                          const updated = [...editIncomes];
                          updated[idx].note = e.target.value;
                          setEditIncomes(updated);
                        }}
                        className="flex-1 px-3 py-1.5 border border-slate-200 rounded-lg text-xs outline-none focus:border-blue-500"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Deduction Adjustments */}
              <div className="pt-3 border-t border-slate-100">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  รายการเงินหัก (Deductions)
                </h3>
                <div className="space-y-2">
                  {editDeductions.map((ded, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      <span className="w-48 text-xs font-semibold text-slate-700 truncate">
                        {ded.name}
                      </span>
                      <input
                        type="number"
                        step="any"
                        value={ded.amount}
                        onChange={(e) => {
                          const updated = [...editDeductions];
                          updated[idx].amount = e.target.value;
                          setEditDeductions(updated);
                        }}
                        className="w-36 px-3 py-1.5 border border-slate-300 rounded-lg text-xs outline-none focus:border-rose-500 text-right font-medium text-rose-600"
                      />
                      <input
                        type="text"
                        placeholder="หมายเหตุ..."
                        value={ded.note}
                        onChange={(e) => {
                          const updated = [...editDeductions];
                          updated[idx].note = e.target.value;
                          setEditDeductions(updated);
                        }}
                        className="flex-1 px-3 py-1.5 border border-slate-200 rounded-lg text-xs outline-none focus:border-blue-500"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Audit Reason */}
              <div className="pt-3 border-t border-slate-100">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  เหตุผลในการแก้ไขข้อมูล (สำหรับบันทึกประวัติการตรวจสอบ) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="เช่น ปรับยอดตามใบรับรองแพทย์, เพิ่มเบี้ยขยันพิเศษ..."
                  value={editReason}
                  onChange={(e) => setEditReason(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs outline-none focus:border-blue-500"
                />
              </div>

              {/* Footer */}
              <div className="pt-4 border-t border-slate-200 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedRecord(null)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl text-xs font-medium hover:bg-slate-100"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-blue-600/20"
                >
                  บันทึกการปรับปรุง
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

