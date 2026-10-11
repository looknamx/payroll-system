'use client';

import React, { useState, useEffect } from 'react';
import {
  Wallet,
  Plus,
  CheckCircle,
  AlertCircle,
  Calendar,
  X,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { formatCurrency, formatThaiDateNumeric } from '@/lib/utils';

export default function AdvancePage() {
  const [advances, setAdvances] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    employeeId: '',
    amount: '',
    requestDate: '',
    reason: '',
  });

  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      requestDate: new Date().toISOString().split('T')[0],
    }));
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [advRes, empRes] = await Promise.all([
        fetch('/api/advance'),
        fetch('/api/employees?status=ACTIVE'),
      ]);

      const advData = await advRes.json();
      const empData = await empRes.json();

      setAdvances(Array.isArray(advData) ? advData : []);
      setEmployees(Array.isArray(empData) ? empData : []);

      if (empData.length > 0 && !formData.employeeId) {
        setFormData((prev) => ({ ...prev, employeeId: String(empData[0].id) }));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/advance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setIsModalOpen(false);
        setFormData((prev) => ({ ...prev, amount: '', reason: '' }));
        fetchData();
      } else {
        const err = await res.json();
        alert(err.error || 'เกิดข้อผิดพลาดในการบันทึก');
      }
    } catch (e) {
      alert('เกิดข้อผิดพลาดในการเชื่อมต่อ');
    }
  };

  const totalAdvance = advances.reduce((acc, a) => acc + (a.amount || 0), 0);
  const pendingDeduction = advances
    .filter((a) => a.status === 'APPROVED')
    .reduce((acc, a) => acc + (a.amount || 0), 0);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">เบิกจ่ายล่วงหน้า</h1>
          <p className="text-sm text-slate-500 mt-1">
            บันทึกรายการเบิกเงินเดือนล่วงหน้าระหว่างเดือน และตรวจสอบยอดรอหักในรอบเงินเดือน
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition shadow-sm shadow-blue-600/30 shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>ขอเบิกเงินล่วงหน้า</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            ยอดเบิกสะสมทั้งหมด
          </div>
          <div className="text-2xl font-extrabold text-slate-900 mt-2">
            ฿{formatCurrency(totalAdvance)}
          </div>
          <div className="text-xs text-slate-400 mt-1">รวมทุกรายการในระบบ</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80">
          <div className="text-xs font-semibold text-amber-600 uppercase tracking-wider">
            ยอดรอหักในรอบเงินเดือน
          </div>
          <div className="text-2xl font-extrabold text-amber-600 mt-2">
            ฿{formatCurrency(pendingDeduction)}
          </div>
          <div className="text-xs text-amber-700/80 mt-1">
            จะถูกนำไปหักอัตโนมัติเมื่อกดคำนวณเงินเดือน
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80">
          <div className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">
            ยอดที่หักในเงินเดือนแล้ว
          </div>
          <div className="text-2xl font-extrabold text-emerald-600 mt-2">
            ฿{formatCurrency(totalAdvance - pendingDeduction)}
          </div>
          <div className="text-xs text-slate-400 mt-1">ตัดยอดเรียบร้อยแล้ว</div>
        </div>
      </div>

      {/* Advances Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50/80 text-xs text-slate-500 uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-5 py-3.5 font-semibold">วันที่ขอเบิก</th>
                <th className="px-5 py-3.5 font-semibold">รหัสพนักงาน</th>
                <th className="px-5 py-3.5 font-semibold">ชื่อ - นามสกุล</th>
                <th className="px-5 py-3.5 font-semibold">แผนก</th>
                <th className="px-5 py-3.5 font-semibold text-right">จำนวนเงิน (บาท)</th>
                <th className="px-5 py-3.5 font-semibold">เหตุผล</th>
                <th className="px-5 py-3.5 font-semibold text-center">สถานะ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-slate-400">
                    กำลังโหลดข้อมูล...
                  </td>
                </tr>
              ) : advances.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-slate-400">
                    ยังไม่มีรายการเบิกเงินล่วงหน้า
                  </td>
                </tr>
              ) : (
                advances.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition">
                    <td className="px-5 py-3.5 text-xs text-slate-600">
                      {formatThaiDateNumeric(item.requestDate)}
                    </td>
                    <td className="px-5 py-3.5 font-semibold text-slate-800">
                      {item.employee?.employeeCode}
                    </td>
                    <td className="px-5 py-3.5 font-bold text-slate-900">
                      {item.employee?.firstName} {item.employee?.lastName}
                    </td>
                    <td className="px-5 py-3.5 text-xs text-slate-500">
                      {item.employee?.department?.name || '-'}
                    </td>
                    <td className="px-5 py-3.5 text-right font-extrabold text-slate-900">
                      ฿{formatCurrency(item.amount)}
                    </td>
                    <td className="px-5 py-3.5 text-xs text-slate-500">
                      {item.reason || '-'}
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${
                          item.status === 'DEDUCTED'
                            ? 'bg-slate-100 text-slate-700 border border-slate-200'
                            : item.status === 'APPROVED'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-blue-50 text-blue-700 border border-blue-200'
                        }`}
                      >
                        {item.status === 'DEDUCTED'
                          ? 'หักในเงินเดือนแล้ว'
                          : item.status === 'APPROVED'
                          ? 'รอหักในรอบเงินเดือน'
                          : 'รออนุมัติ'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Advance Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg p-6 animate-in fade-in duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <h2 className="text-base font-bold text-slate-900">บันทึกขอเบิกเงินล่วงหน้า</h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">พนักงาน *</label>
                <select
                  required
                  value={formData.employeeId}
                  onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm outline-none focus:border-blue-500"
                >
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.employeeCode} - {emp.firstName} {emp.lastName} (
                      {emp.department?.name || '-'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  จำนวนเงินที่ขอเบิก (บาท) *
                </label>
                <input
                  type="number"
                  step="any"
                  min="1"
                  required
                  placeholder="เช่น 3000"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm outline-none focus:border-blue-500 font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  วันที่ขอเบิก *
                </label>
                <input
                  type="date"
                  required
                  value={formData.requestDate}
                  onChange={(e) => setFormData({ ...formData, requestDate: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  เหตุผลความจำเป็น
                </label>
                <textarea
                  rows={2}
                  placeholder="เช่น ค่ารักษาพยาบาล, ค่าใช้จ่ายฉุกเฉิน..."
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm outline-none focus:border-blue-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-sm font-medium hover:bg-slate-100"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold shadow-md shadow-blue-600/20"
                >
                  บันทึกการเบิก
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
