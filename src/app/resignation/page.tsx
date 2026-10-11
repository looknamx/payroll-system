'use client';

import React, { useState, useEffect } from 'react';
import {
  UserMinus,
  Plus,
  AlertCircle,
  Calendar,
  CheckCircle,
  X,
  Building2,
} from 'lucide-react';
import { formatThaiDateNumeric } from '@/lib/utils';

export default function ResignationPage() {
  const [resignations, setResignations] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    employeeId: '',
    noticeDate: '',
    resignDate: '',
    lastWorkingDate: '',
    reason: '',
    updateEmployeeStatus: true,
  });

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    setFormData((prev) => ({
      ...prev,
      noticeDate: today,
      resignDate: today,
      lastWorkingDate: today,
    }));
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resRes, empRes] = await Promise.all([
        fetch('/api/resignation'),
        fetch('/api/employees?status=ACTIVE'),
      ]);

      const resData = await resRes.json();
      const empData = await empRes.json();

      setResignations(Array.isArray(resData) ? resData : []);
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
      const res = await fetch('/api/resignation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setIsModalOpen(false);
        fetchData();
      } else {
        const err = await res.json();
        alert(err.error || 'เกิดข้อผิดพลาดในการบันทึก');
      }
    } catch (e) {
      alert('เกิดข้อผิดพลาดในการเชื่อมต่อ');
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">การลาออก</h1>
          <p className="text-sm text-slate-500 mt-1">
            บันทึกการแจ้งลาออก วันทำงานสุดท้าย และจัดการสถานะพนักงาน
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-sm font-semibold transition shadow-sm shadow-rose-600/30 shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>บันทึกการลาออก</span>
        </button>
      </div>

      {/* Info Banner */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl flex items-start gap-3 text-xs text-blue-800">
        <AlertCircle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold">หมายเหตุสำคัญ:</span>{' '}
          เมื่อบันทึกการลาออกและเปิดตัวเลือก "ปรับสถานะพนักงาน" ระบบจะเปลี่ยนสถานะเป็น
          "ลาออก" (RESIGNED) พนักงานจะไม่ถูกนำไปคำนวณเงินเดือนในรอบถัดไป แต่ข้อมูลในอดีตยังคงถูกเก็บรักษาไว้อย่างครบถ้วน
        </div>
      </div>

      {/* Resignation Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50/80 text-xs text-slate-500 uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-5 py-3.5 font-semibold">รหัสพนักงาน</th>
                <th className="px-5 py-3.5 font-semibold">ชื่อ - นามสกุล</th>
                <th className="px-5 py-3.5 font-semibold">แผนก / ตำแหน่ง</th>
                <th className="px-5 py-3.5 font-semibold">วันที่แจ้งลาออก</th>
                <th className="px-5 py-3.5 font-semibold">วันทำงานสุดท้าย</th>
                <th className="px-5 py-3.5 font-semibold">วันที่มีผลลาออก</th>
                <th className="px-5 py-3.5 font-semibold">เหตุผลการลาออก</th>
                <th className="px-5 py-3.5 font-semibold text-center">สถานะ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-slate-400">
                    กำลังโหลดข้อมูล...
                  </td>
                </tr>
              ) : resignations.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-10 text-slate-400">
                    ยังไม่มีรายการพนักงานที่ลาออก
                  </td>
                </tr>
              ) : (
                resignations.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition">
                    <td className="px-5 py-3.5 font-semibold text-slate-800">
                      {item.employee?.employeeCode}
                    </td>
                    <td className="px-5 py-3.5 font-bold text-slate-900">
                      {item.employee?.firstName} {item.employee?.lastName}
                    </td>
                    <td className="px-5 py-3.5 text-xs text-slate-600">
                      {item.employee?.department?.name || '-'}
                    </td>
                    <td className="px-5 py-3.5 text-xs text-slate-600">
                      {formatThaiDateNumeric(item.noticeDate)}
                    </td>
                    <td className="px-5 py-3.5 text-xs font-semibold text-rose-600">
                      {formatThaiDateNumeric(item.lastWorkingDate)}
                    </td>
                    <td className="px-5 py-3.5 text-xs text-slate-600">
                      {formatThaiDateNumeric(item.resignDate)}
                    </td>
                    <td className="px-5 py-3.5 text-xs text-slate-500">
                      {item.reason || '-'}
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                        ลาออกแล้ว
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Resignation Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg p-6 animate-in fade-in duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <h2 className="text-base font-bold text-slate-900">บันทึกข้อมูลการลาออก</h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  เลือกพนักงานที่ลาออก *
                </label>
                <select
                  required
                  value={formData.employeeId}
                  onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm outline-none focus:border-rose-500"
                >
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.employeeCode} - {emp.firstName} {emp.lastName} (
                      {emp.department?.name || '-'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    วันที่ยื่นใบลาออก *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.noticeDate}
                    onChange={(e) => setFormData({ ...formData, noticeDate: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm outline-none focus:border-rose-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    วันทำงานวันสุดท้าย *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.lastWorkingDate}
                    onChange={(e) =>
                      setFormData({ ...formData, lastWorkingDate: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm outline-none focus:border-rose-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  วันที่มีผลลาออกอย่างเป็นทางการ *
                </label>
                <input
                  type="date"
                  required
                  value={formData.resignDate}
                  onChange={(e) => setFormData({ ...formData, resignDate: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  เหตุผลการลาออก
                </label>
                <textarea
                  rows={2}
                  placeholder="ระบุเหตุผล เช่น ย้ายที่อยู่, ได้งานใหม่..."
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm outline-none focus:border-rose-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="statusToggle"
                  checked={formData.updateEmployeeStatus}
                  onChange={(e) =>
                    setFormData({ ...formData, updateEmployeeStatus: e.target.checked })
                  }
                  className="rounded text-rose-600 focus:ring-rose-500"
                />
                <label htmlFor="statusToggle" className="text-xs font-semibold text-slate-700">
                  ปรับสถานะพนักงานเป็น "ลาออก" ทันที
                </label>
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
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-sm font-semibold shadow-md shadow-rose-600/20"
                >
                  บันทึกการลาออก
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

