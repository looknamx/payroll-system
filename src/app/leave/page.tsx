'use client';

import React, { useState, useEffect } from 'react';
import {
  CalendarDays,
  Plus,
  Check,
  X,
  AlertCircle,
  Clock,
  CheckCircle2,
  XCircle,
  FileText,
} from 'lucide-react';
import { formatThaiDateNumeric } from '@/lib/utils';

export default function LeavePage() {
  const [leaveRequests, setLeaveRequests] = useState<any[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    employeeId: '',
    leaveTypeId: '',
    startDate: '',
    endDate: '',
    totalDays: '1',
    reason: '',
  });

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    setFormData((prev) => ({
      ...prev,
      startDate: today,
      endDate: today,
    }));
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [leaveRes, empRes] = await Promise.all([
        fetch('/api/leave'),
        fetch('/api/employees?status=ACTIVE'),
      ]);

      const leaveData = await leaveRes.json();
      const empData = await empRes.json();

      setLeaveRequests(leaveData.leaveRequests || []);
      setLeaveTypes(leaveData.leaveTypes || []);
      setEmployees(Array.isArray(empData) ? empData : []);

      if (empData.length > 0 && !formData.employeeId) {
        setFormData((prev) => ({
          ...prev,
          employeeId: String(empData[0].id),
          leaveTypeId: leaveData.leaveTypes?.[0]?.id ? String(leaveData.leaveTypes[0].id) : '',
        }));
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
      const res = await fetch('/api/leave', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setIsModalOpen(false);
        setFormData((prev) => ({ ...prev, reason: '', totalDays: '1' }));
        fetchData();
      } else {
        const err = await res.json();
        alert(err.error || 'เกิดข้อผิดพลาดในการส่งคำขอ');
      }
    } catch (e) {
      alert('เกิดข้อผิดพลาดในการเชื่อมต่อ');
    }
  };

  const handleUpdateStatus = async (id: number, status: 'APPROVED' | 'REJECTED') => {
    try {
      const res = await fetch('/api/leave', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      });
      if (res.ok) {
        fetchData();
      } else {
        alert('เกิดข้อผิดพลาดในการปรับสถานะ');
      }
    } catch (e) {
      alert('เกิดข้อผิดพลาดในการเชื่อมต่อ');
    }
  };

  const pendingRequests = leaveRequests.filter((r) => r.status === 'PENDING');

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">ระบบลางาน</h1>
          <p className="text-sm text-slate-500 mt-1">
            จัดการคำขอลางาน ตรวจสอบสิทธิวันลา และอนุมัติการลาเพื่อใช้คำนวณเงินเดือน
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition shadow-sm shadow-blue-600/30 shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>สร้างคำขอลางาน</span>
        </button>
      </div>

      {/* Leave Types Policy Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {leaveTypes.map((lt) => (
          <div key={lt.id} className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs">
            <div className="text-xs font-semibold text-slate-800 truncate">{lt.name}</div>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-lg font-bold text-blue-600">{lt.maxDaysPerYear}</span>
              <span className="text-[10px] text-slate-400">วัน/ปี</span>
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              {lt.isPaid ? 'ได้รับค่าจ้าง' : 'ไม่ได้รับค่าจ้าง'}
            </div>
          </div>
        ))}
      </div>

      {/* Pending Approval Section */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 mb-4">
          <Clock className="w-4 h-4 text-amber-500" />
          <span>คำขอลารอการอนุมัติ ({pendingRequests.length} รายการ)</span>
        </h2>

        {pendingRequests.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400">
            ไม่มีคำขอลางานที่รอดำเนินการในขณะนี้
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pendingRequests.map((req) => (
              <div
                key={req.id}
                className="p-4 rounded-xl border border-amber-200 bg-amber-50/40 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="font-bold text-slate-900 text-sm">
                        {req.employee?.firstName} {req.employee?.lastName}
                      </span>
                      <span className="text-xs text-slate-500 ml-2">
                        ({req.employee?.employeeCode} • {req.employee?.department?.name || '-'})
                      </span>
                    </div>
                    <span className="px-2 py-0.5 rounded text-xs font-bold bg-blue-100 text-blue-700">
                      {req.leaveType?.name}
                    </span>
                  </div>

                  <div className="text-xs text-slate-600 mt-2">
                    <span className="font-semibold">ช่วงวันที่:</span>{' '}
                    {formatThaiDateNumeric(req.startDate)} - {formatThaiDateNumeric(req.endDate)} (
                    {req.totalDays} วัน)
                  </div>

                  {req.reason && (
                    <div className="text-xs text-slate-500 mt-1 italic">
                      เหตุผล: "{req.reason}"
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-amber-200/70">
                  <button
                    onClick={() => handleUpdateStatus(req.id, 'REJECTED')}
                    className="flex items-center gap-1 px-3 py-1.5 bg-white border border-rose-200 hover:bg-rose-50 text-rose-700 rounded-lg text-xs font-semibold transition cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>ปฏิเสธ</span>
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(req.id, 'APPROVED')}
                    className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs transition cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>อนุมัติ</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* History Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200">
          <h2 className="text-base font-bold text-slate-900">ประวัติการขอลาทั้งหมด</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50/80 text-xs text-slate-500 uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-5 py-3 font-semibold">รหัสพนักงาน</th>
                <th className="px-5 py-3 font-semibold">ชื่อ - นามสกุล</th>
                <th className="px-5 py-3 font-semibold">ประเภทการลา</th>
                <th className="px-5 py-3 font-semibold">เริ่มวันที่</th>
                <th className="px-5 py-3 font-semibold">ถึงวันที่</th>
                <th className="px-5 py-3 font-semibold text-center">จำนวน (วัน)</th>
                <th className="px-5 py-3 font-semibold">เหตุผล</th>
                <th className="px-5 py-3 font-semibold text-center">สถานะ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-slate-400">
                    กำลังโหลดข้อมูล...
                  </td>
                </tr>
              ) : leaveRequests.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-10 text-slate-400">
                    ยังไม่มีรายการคำขอลางาน
                  </td>
                </tr>
              ) : (
                leaveRequests.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-50/70 transition">
                    <td className="px-5 py-3.5 font-semibold text-slate-800">
                      {req.employee?.employeeCode}
                    </td>
                    <td className="px-5 py-3.5 font-semibold text-slate-900">
                      {req.employee?.firstName} {req.employee?.lastName}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="font-medium text-slate-700">{req.leaveType?.name}</span>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-slate-600">
                      {formatThaiDateNumeric(req.startDate)}
                    </td>
                    <td className="px-5 py-3.5 text-xs text-slate-600">
                      {formatThaiDateNumeric(req.endDate)}
                    </td>
                    <td className="px-5 py-3.5 text-center font-bold text-slate-800">
                      {req.totalDays}
                    </td>
                    <td className="px-5 py-3.5 text-xs text-slate-500">
                      {req.reason || '-'}
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${
                          req.status === 'APPROVED'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : req.status === 'REJECTED'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {req.status === 'APPROVED'
                          ? 'อนุมัติแล้ว'
                          : req.status === 'REJECTED'
                          ? 'ไม่อนุมัติ'
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

      {/* New Leave Request Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg p-6 animate-in fade-in duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <h2 className="text-base font-bold text-slate-900">สร้างคำขอลางาน</h2>
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
                      {emp.employeeCode} - {emp.firstName} {emp.lastName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ประเภทการลา *
                </label>
                <select
                  required
                  value={formData.leaveTypeId}
                  onChange={(e) => setFormData({ ...formData, leaveTypeId: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm outline-none focus:border-blue-500"
                >
                  {leaveTypes.map((lt) => (
                    <option key={lt.id} value={lt.id}>
                      {lt.name} (สิทธิ {lt.maxDaysPerYear} วัน)
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    เริ่มวันที่ *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    ถึงวันที่ *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  จำนวนวันลา *
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0.5"
                  required
                  value={formData.totalDays}
                  onChange={(e) => setFormData({ ...formData, totalDays: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  เหตุผลการลา
                </label>
                <textarea
                  rows={2}
                  placeholder="ระบุเหตุผลในการลา..."
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
                  ส่งคำขอลา
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
