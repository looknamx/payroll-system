'use client';

import React, { useState, useEffect } from 'react';
import {
  Smartphone,
  MapPin,
  Clock,
  CheckCircle2,
  AlertCircle,
  Calendar,
  User,
  ArrowRightCircle,
  RefreshCw,
} from 'lucide-react';
import { formatThaiDateFull, formatThaiTime } from '@/lib/utils';

export default function MobileCheckinPage() {
  const [employees, setEmployees] = useState<any[]>([]);
  const [selectedEmpId, setSelectedEmpId] = useState('');
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const [locationStatus, setLocationStatus] = useState<string>('กำลังค้นหาพิกัด GPS...');
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [todayRecord, setTodayRecord] = useState<any>(null);
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    setCurrentTime(new Date());
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    // ดึงพนักงาน
    fetch('/api/employees?status=ACTIVE')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setEmployees(data);
          setSelectedEmpId(String(data[0].id));
        }
      });

    // ตรวจสอบพิกัด GPS
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          setLocationStatus('พร้อมบันทึก (ตรวจพบพิกัด GPS ของอุปกรณ์)');
        },
        () => {
          // หากผู้ใช้ไม่อนุญาต ให้ใช้พิกัดสำนักงานตัวอย่าง
          setCoords({ lat: 13.7469, lng: 100.5349 });
          setLocationStatus('ใช้พิกัดจำลอง ณ สำนักงานใหญ่ (สุขุมวิท)');
        }
      );
    } else {
      setCoords({ lat: 13.7469, lng: 100.5349 });
      setLocationStatus('ใช้พิกัดจำลอง ณ สำนักงานใหญ่');
    }
  }, []);

  const fetchTodayAttendance = async (empId: string) => {
    if (!empId) return;
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      const res = await fetch(`/api/attendance?employeeId=${empId}&date=${todayStr}`);
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        setTodayRecord(data[0]);
      } else {
        setTodayRecord(null);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (selectedEmpId) {
      fetchTodayAttendance(selectedEmpId);
    }
  }, [selectedEmpId]);

  const handleCheckIn = async (type: 'CHECK_IN' | 'CHECK_OUT') => {
    if (!selectedEmpId) {
      setMessage({ text: 'กรุณาเลือกพนักงานก่อน', type: 'error' });
      return;
    }

    setLoading(true);
    setMessage(null);

    const now = new Date();
    const isLate = now.getHours() > 9 || (now.getHours() === 9 && now.getMinutes() > 0);

    const payload: any = {
      employeeId: selectedEmpId,
      date: now.toISOString().split('T')[0],
      source: 'MOBILE',
      latitude: coords?.lat,
      longitude: coords?.lng,
      note: note || undefined,
    };

    if (type === 'CHECK_IN') {
      payload.checkIn = now.toISOString();
      payload.status = isLate ? 'LATE' : 'PRESENT';
    } else {
      payload.checkOut = now.toISOString();
    }

    try {
      const res = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok) {
        setMessage({ text: json.error || 'บันทึกไม่สำเร็จ', type: 'error' });
      } else {
        setMessage({
          text: type === 'CHECK_IN' ? 'บันทึกเวลาเข้างานเรียบร้อยแล้ว' : 'บันทึกเวลาออกงานเรียบร้อยแล้ว',
          type: 'success',
        });
        setNote('');
        fetchTodayAttendance(selectedEmpId);
      }
    } catch (e: any) {
      setMessage({ text: e.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อ', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const selectedEmployee = employees.find((e) => String(e.id) === selectedEmpId);

  return (
    <div className="max-w-xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs text-center">
        <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-3">
          <Smartphone className="w-6 h-6" />
        </div>
        <h1 className="text-xl font-bold text-slate-900">ลงเวลาทำงานผ่านมือถือ</h1>
        <p className="text-xs text-slate-500 mt-1">
          ระบบบันทึกเวลาเข้า-ออกงานพร้อมระบุตำแหน่งและเวลาจริง
        </p>

        {/* Digital Clock */}
        <div className="mt-5 p-4 rounded-2xl bg-slate-900 text-white shadow-inner">
          <div className="text-3xl font-extrabold tracking-wider font-mono">
            {currentTime ? formatThaiTime(currentTime) : '--:-- น.'}
          </div>
          <div className="text-xs text-slate-300 mt-1">
            {currentTime ? formatThaiDateFull(currentTime) : 'กำลังเชื่อมต่อเวลา...'}
          </div>
        </div>
      </div>

      {/* Select Employee Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-2">
            เลือกพนักงานที่ต้องการลงเวลา
          </label>
          <div className="relative">
            <select
              value={selectedEmpId}
              onChange={(e) => setSelectedEmpId(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 outline-none focus:border-blue-500 focus:bg-white cursor-pointer"
            >
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.employeeCode} - {emp.titleName} {emp.firstName} {emp.lastName} (
                  {emp.department?.name || 'ทั่วไป'})
                </option>
              ))}
            </select>
          </div>
        </div>

        {selectedEmployee && (
          <div className="p-3 bg-slate-50 rounded-xl text-xs space-y-1 text-slate-600">
            <div>
              <span className="font-semibold text-slate-800">สังกัด:</span>{' '}
              {selectedEmployee.department?.name || '-'} / {selectedEmployee.position?.name || '-'}
            </div>
            <div>
              <span className="font-semibold text-slate-800">ประเภท:</span>{' '}
              {selectedEmployee.employmentType?.name || 'พนักงานประจำ'}
            </div>
          </div>
        )}

        {/* GPS Status */}
        <div className="flex items-center gap-2 p-3 bg-blue-50/70 border border-blue-100 rounded-xl text-xs text-blue-800">
          <MapPin className="w-4 h-4 text-blue-600 shrink-0" />
          <span className="truncate">{locationStatus}</span>
        </div>

        {/* Note input */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            หมายเหตุ / บันทึกเพิ่มเติม (ถ้ามี)
          </label>
          <input
            type="text"
            placeholder="เช่น ปฏิบัติงานนอกสถานที่, ทำงานล่วงเวลา..."
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:border-blue-500"
          />
        </div>

        {/* Message Banner */}
        {message && (
          <div
            className={`p-3 rounded-xl text-xs flex items-center gap-2 font-medium ${
              message.type === 'success'
                ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                : 'bg-rose-50 border border-rose-200 text-rose-800'
            }`}
          >
            {message.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{message.text}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <button
            onClick={() => handleCheckIn('CHECK_IN')}
            disabled={loading}
            className="flex items-center justify-center gap-2 py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white rounded-xl text-sm font-bold shadow-md shadow-emerald-600/20 transition cursor-pointer disabled:opacity-50"
          >
            <Clock className="w-4 h-4" />
            <span>ลงเวลาเข้างาน</span>
          </button>

          <button
            onClick={() => handleCheckIn('CHECK_OUT')}
            disabled={loading}
            className="flex items-center justify-center gap-2 py-3.5 px-4 bg-rose-600 hover:bg-rose-700 active:scale-[0.98] text-white rounded-xl text-sm font-bold shadow-md shadow-rose-600/20 transition cursor-pointer disabled:opacity-50"
          >
            <ArrowRightCircle className="w-4 h-4" />
            <span>ลงเวลาออกงาน</span>
          </button>
        </div>
      </div>

      {/* Today Attendance Status Card */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
          <Clock className="w-4 h-4 text-slate-600" />
          <span>สถานะการลงเวลาของวันนี้</span>
        </h3>

        {todayRecord ? (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl">
                <div className="text-[11px] font-semibold text-emerald-700">เวลาเข้างาน</div>
                <div className="text-lg font-extrabold text-emerald-900 mt-1">
                  {todayRecord.checkIn ? formatThaiTime(todayRecord.checkIn) : 'ยังไม่บันทึก'}
                </div>
              </div>

              <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl">
                <div className="text-[11px] font-semibold text-blue-700">เวลาออกงาน</div>
                <div className="text-lg font-extrabold text-blue-900 mt-1">
                  {todayRecord.checkOut ? formatThaiTime(todayRecord.checkOut) : 'ยังไม่บันทึก'}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
              <span>สถานะ:</span>
              <span
                className={`font-bold ${
                  todayRecord.status === 'PRESENT'
                    ? 'text-emerald-600'
                    : todayRecord.status === 'LATE'
                    ? 'text-amber-600'
                    : 'text-slate-600'
                }`}
              >
                {todayRecord.status === 'PRESENT'
                  ? 'ตรงเวลา (ปกติ)'
                  : todayRecord.status === 'LATE'
                  ? 'มาสาย'
                  : todayRecord.status}
              </span>
            </div>

            {todayRecord.overtimeHours > 0 && (
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>ชั่วโมง OT:</span>
                <span className="font-bold text-blue-600">{todayRecord.overtimeHours} ชม.</span>
              </div>
            )}
          </div>
        ) : (
          <div className="py-6 text-center text-xs text-slate-400">
            ยังไม่มีบันทึกเวลาของพนักงานท่านนี้ในวันนี้
          </div>
        )}
      </div>
    </div>
  );
}

