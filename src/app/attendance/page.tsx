'use client';

import React, { useState, useEffect } from 'react';
import {
  Clock,
  Calendar,
  Search,
  Filter,
  Plus,
  Edit,
  CheckCircle,
  AlertTriangle,
  XCircle,
  X,
  FileSpreadsheet,
} from 'lucide-react';
import { formatThaiDateNumeric, formatThaiTime, THAI_MONTHS } from '@/lib/utils';

export default function AttendancePage() {
  const [attendances, setAttendances] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [filterMonth, setFilterMonth] = useState<number>(10);
  const [filterYear, setFilterYear] = useState<number>(2026);
  const [filterEmployeeId, setFilterEmployeeId] = useState('');

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    employeeId: '',
    date: '',
    checkInTime: '08:30',
    checkOutTime: '17:30',
    status: 'PRESENT',
    overtimeHours: '0',
    note: '',
  });

  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      date: new Date().toISOString().split('T')[0],
    }));
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      let url = `/api/attendance?month=${filterMonth}&year=${filterYear}`;
      if (filterEmployeeId) url += `&employeeId=${filterEmployeeId}`;

      const [attRes, empRes] = await Promise.all([
        fetch(url),
        fetch('/api/employees?status=ACTIVE'),
      ]);

      const attData = await attRes.json();
      const empData = await empRes.json();

      setAttendances(Array.isArray(attData) ? attData : []);
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
  }, [filterMonth, filterYear, filterEmployeeId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const checkInDateTime = `${formData.date}T${formData.checkInTime}:00`;
      const checkOutDateTime = formData.checkOutTime
        ? `${formData.date}T${formData.checkOutTime}:00`
        : null;

      const res = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId: formData.employeeId,
          date: formData.date,
          checkIn: checkInDateTime,
          checkOut: checkOutDateTime,
          status: formData.status,
          overtimeHours: parseFloat(formData.overtimeHours) || 0,
          note: formData.note || null,
          source: 'MANUAL',
        }),
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

  // Stats calculation
  const presentCount = attendances.filter((a) => a.status === 'PRESENT').length;
  const lateCount = attendances.filter((a) => a.status === 'LATE').length;
  const absentCount = attendances.filter((a) => a.status === 'ABSENT').length;
  const totalOt = attendances.reduce((acc, a) => acc + (a.overtimeHours || 0), 0);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">เวลาทำงาน</h1>
          <p className="text-sm text-slate-500 mt-1">
            บันทึกและตรวจสอบประวัติการเข้า-ออกงาน วันขาด ลา มาสาย และชั่วโมง OT
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition shadow-sm shadow-blue-600/30 shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>บันทึกเวลาทำงาน</span>
        </button>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200/80">
          <div className="text-xs font-semibold text-emerald-600 flex items-center gap-1.5">
            <CheckCircle className="w-4 h-4" />
            <span>เข้างานปกติ</span>
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-1">{presentCount} วัน</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80">
          <div className="text-xs font-semibold text-amber-600 flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4" />
            <span>มาสาย</span>
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-1">{lateCount} วัน</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80">
          <div className="text-xs font-semibold text-rose-600 flex items-center gap-1.5">
            <XCircle className="w-4 h-4" />
            <span>ขาดงาน</span>
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-1">{absentCount} วัน</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80">
          <div className="text-xs font-semibold text-blue-600 flex items-center gap-1.5">
            <Clock className="w-4 h-4" />
            <span>ชั่วโมง OT สะสม</span>
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-1">{totalOt} ชม.</div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap gap-3 items-center justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-slate-500">เดือน:</span>
            <select
              value={filterMonth}
              onChange={(e) => setFilterMonth(parseInt(e.target.value))}
              className="py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 outline-none cursor-pointer"
            >
              {THAI_MONTHS.map((m, idx) => (
                <option key={idx} value={idx + 1}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-slate-500">ปี:</span>
            <select
              value={filterYear}
              onChange={(e) => setFilterYear(parseInt(e.target.value))}
              className="py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 outline-none cursor-pointer"
            >
              <option value={2026}>พ.ศ. 2569</option>
              <option value={2025}>พ.ศ. 2568</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-slate-500">พนักงาน:</span>
            <select
              value={filterEmployeeId}
              onChange={(e) => setFilterEmployeeId(e.target.value)}
              className="py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 outline-none cursor-pointer"
            >
              <option value="">พนักงานทุกคน</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.employeeCode} - {emp.firstName} {emp.lastName}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="text-xs text-slate-500">
          พบข้อมูล {attendances.length} รายการ
        </div>
      </div>

      {/* Attendance Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50/80 text-xs text-slate-500 uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-5 py-3.5 font-semibold">วันที่</th>
                <th className="px-5 py-3.5 font-semibold">รหัสพนักงาน</th>
                <th className="px-5 py-3.5 font-semibold">ชื่อ - นามสกุล</th>
                <th className="px-5 py-3.5 font-semibold text-center">เวลาเข้า</th>
                <th className="px-5 py-3.5 font-semibold text-center">เวลาออก</th>
                <th className="px-5 py-3.5 font-semibold text-center">สถานะ</th>
                <th className="px-5 py-3.5 font-semibold text-center">OT (ชม.)</th>
                <th className="px-5 py-3.5 font-semibold">ช่องทาง</th>
                <th className="px-5 py-3.5 font-semibold">หมายเหตุ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={9} className="text-center py-10 text-slate-400">
                    กำลังโหลดข้อมูล...
                  </td>
                </tr>
              ) : attendances.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-12 text-slate-400">
                    ยังไม่มีบันทึกเวลาทำงานในรอบเดือนที่เลือก
                  </td>
                </tr>
              ) : (
                attendances.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition">
                    <td className="px-5 py-3.5 font-medium text-slate-900">
                      {formatThaiDateNumeric(item.date)}
                    </td>
                    <td className="px-5 py-3.5 font-semibold text-slate-800">
                      {item.employee?.employeeCode}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="font-semibold text-slate-900">
                        {item.employee?.firstName} {item.employee?.lastName}
                      </div>
                      <div className="text-xs text-slate-400">
                        {item.employee?.department?.name || '-'}
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-center font-mono font-medium text-slate-800">
                      {item.checkIn ? formatThaiTime(item.checkIn) : '-'}
                    </td>
                    <td className="px-5 py-3.5 text-center font-mono font-medium text-slate-800">
                      {item.checkOut ? formatThaiTime(item.checkOut) : '-'}
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${
                          item.status === 'PRESENT'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : item.status === 'LATE'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : item.status === 'ABSENT'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-blue-50 text-blue-700 border border-blue-200'
                        }`}
                      >
                        {item.status === 'PRESENT'
                          ? 'ปกติ'
                          : item.status === 'LATE'
                          ? 'สาย'
                          : item.status === 'ABSENT'
                          ? 'ขาดงาน'
                          : item.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-center font-semibold text-blue-600">
                      {item.overtimeHours > 0 ? `${item.overtimeHours} ชม.` : '-'}
                    </td>
                    <td className="px-5 py-3.5 text-xs text-slate-500">
                      <span className="px-2 py-0.5 rounded bg-slate-100 font-medium">
                        {item.source === 'MOBILE' ? 'มือถือ GPS' : 'ระบบบันทึก'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-slate-500">
                      {item.note || '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Manual Attendance Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg p-6 animate-in fade-in duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <h2 className="text-base font-bold text-slate-900">บันทึกเวลาทำงาน</h2>
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
                  พนักงาน *
                </label>
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

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">วันที่ *</label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">สถานะ</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm outline-none focus:border-blue-500"
                  >
                    <option value="PRESENT">เข้างานปกติ (PRESENT)</option>
                    <option value="LATE">มาสาย (LATE)</option>
                    <option value="ABSENT">ขาดงาน (ABSENT)</option>
                    <option value="LEAVE">ลา (LEAVE)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    เวลาเข้างาน
                  </label>
                  <input
                    type="time"
                    value={formData.checkInTime}
                    onChange={(e) => setFormData({ ...formData, checkInTime: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    เวลาออกงาน
                  </label>
                  <input
                    type="time"
                    value={formData.checkOutTime}
                    onChange={(e) => setFormData({ ...formData, checkOutTime: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ชั่วโมงการทำงานล่วงเวลา (OT)
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={formData.overtimeHours}
                  onChange={(e) => setFormData({ ...formData, overtimeHours: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">หมายเหตุ</label>
                <input
                  type="text"
                  placeholder="เช่น ทำงานนอกสถานที่..."
                  value={formData.note}
                  onChange={(e) => setFormData({ ...formData, note: e.target.value })}
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
                  บันทึก
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

