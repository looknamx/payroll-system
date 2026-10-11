'use client';

import React, { useState, useEffect } from 'react';
import {
  Users,
  UserPlus,
  Search,
  Edit,
  Trash2,
  AlertCircle,
  CheckCircle,
  X,
  CreditCard,
  Building2,
  Calendar,
  Image as ImageIcon,
  ShieldCheck,
  Percent,
} from 'lucide-react';
import { formatCurrency, formatThaiDateNumeric } from '@/lib/utils';

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [positions, setPositions] = useState<any[]>([]);
  const [employmentTypes, setEmploymentTypes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [filterDept, setFilterDept] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentEmpId, setCurrentEmpId] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Form state according to Image 1
  const initialForm = {
    avatar: '',
    employeeCode: '',
    fullName: '', // รวมชื่อ-นามสกุล
    gender: 'ไม่ระบุ',
    birthDate: '',
    nationality: 'ไทย',
    positionId: '',
    phone: '',
    departmentId: '',
    employmentTypeId: '',
    salary: '0',
    startDate: '',
    newSalary: '',
    newSalaryEffectiveDate: '',
    resignDate: '',
    idCardNumber: '',
    ssoEmployeeRate: '5',
    ssoEmployerRate: '',
    providentFundRate: '0',
    hasSocialSecurity: 'true',
    employeeLevel: 'พนักงาน',
    hasOvertime: 'true',
    bankName: 'ธนาคารกสิกรไทย',
    bankAccount: '',
    address: '',
    status: 'ACTIVE',
  };
  const [formData, setFormData] = useState(initialForm);

  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      startDate: new Date().toISOString().split('T')[0],
    }));
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [empRes, setRes] = await Promise.all([
        fetch(`/api/employees?search=${search}&departmentId=${filterDept}&status=${filterStatus}`),
        fetch('/api/settings'),
      ]);
      const empData = await empRes.json();
      const setData = await setRes.json();

      setEmployees(Array.isArray(empData) ? empData : []);
      setDepartments(setData.departments || []);
      setPositions(setData.positions || []);
      setEmploymentTypes(setData.employmentTypes || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [search, filterDept, filterStatus]);

  const handleOpenAdd = () => {
    setIsEditing(false);
    setCurrentEmpId(null);
    setFormData({
      ...initialForm,
      startDate: new Date().toISOString().split('T')[0],
      departmentId: departments[0]?.id ? String(departments[0].id) : '',
      positionId: positions[0]?.id ? String(positions[0].id) : '',
      employmentTypeId: employmentTypes[0]?.id ? String(employmentTypes[0].id) : '',
    });
    setErrorMessage('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (emp: any) => {
    setIsEditing(true);
    setCurrentEmpId(emp.id);
    const fullName = `${emp.firstName || ''} ${emp.lastName || ''}`.trim();

    setFormData({
      avatar: emp.avatar || '',
      employeeCode: emp.employeeCode || '',
      fullName,
      gender: emp.gender || 'ไม่ระบุ',
      birthDate: emp.birthDate ? new Date(emp.birthDate).toISOString().split('T')[0] : '',
      nationality: emp.nationality || 'ไทย',
      positionId: emp.positionId ? String(emp.positionId) : '',
      phone: emp.phone || '',
      departmentId: emp.departmentId ? String(emp.departmentId) : '',
      employmentTypeId: emp.employmentTypeId ? String(emp.employmentTypeId) : '',
      salary: String(emp.salary || emp.dailyWage || 0),
      startDate: emp.startDate ? new Date(emp.startDate).toISOString().split('T')[0] : '',
      newSalary: emp.newSalary ? String(emp.newSalary) : '',
      newSalaryEffectiveDate: emp.newSalaryEffectiveDate ? new Date(emp.newSalaryEffectiveDate).toISOString().split('T')[0] : '',
      resignDate: emp.resignDate ? new Date(emp.resignDate).toISOString().split('T')[0] : '',
      idCardNumber: emp.idCardNumber || '',
      ssoEmployeeRate: String(emp.ssoEmployeeRate ?? 5),
      ssoEmployerRate: emp.ssoEmployerRate !== null && emp.ssoEmployerRate !== undefined ? String(emp.ssoEmployerRate) : '',
      providentFundRate: String(emp.providentFundRate ?? 0),
      hasSocialSecurity: emp.hasSocialSecurity ? 'true' : 'false',
      employeeLevel: emp.employeeLevel || 'พนักงาน',
      hasOvertime: emp.hasOvertime ? 'true' : 'false',
      bankName: emp.bankName || 'ธนาคารกสิกรไทย',
      bankAccount: emp.bankAccount || '',
      address: emp.address || '',
      status: emp.status || 'ACTIVE',
    });
    setErrorMessage('');
    setIsModalOpen(true);
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('ขนาดไฟล์รูปภาพเกิน 5MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({ ...prev, avatar: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!formData.employeeCode.trim() || !formData.fullName.trim()) {
      setErrorMessage('กรุณากรอกรหัสพนักงาน และชื่อ-นามสกุล');
      return;
    }

    // แยกชื่อ-นามสกุล
    const nameParts = formData.fullName.trim().split(' ');
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(' ');

    const isDaily = employmentTypes.find((et) => String(et.id) === formData.employmentTypeId)?.code === 'DAILY';

    const payload = {
      employeeCode: formData.employeeCode.trim(),
      firstName,
      lastName,
      avatar: formData.avatar || null,
      gender: formData.gender,
      birthDate: formData.birthDate || null,
      nationality: formData.nationality,
      positionId: formData.positionId ? parseInt(formData.positionId) : null,
      phone: formData.phone || null,
      departmentId: formData.departmentId ? parseInt(formData.departmentId) : null,
      employmentTypeId: formData.employmentTypeId ? parseInt(formData.employmentTypeId) : null,
      salary: isDaily ? 0 : parseFloat(formData.salary) || 0,
      dailyWage: isDaily ? parseFloat(formData.salary) || 0 : 0,
      startDate: formData.startDate || new Date().toISOString(),
      newSalary: formData.newSalary ? parseFloat(formData.newSalary) : null,
      newSalaryEffectiveDate: formData.newSalaryEffectiveDate || null,
      resignDate: formData.resignDate || null,
      idCardNumber: formData.idCardNumber ? formData.idCardNumber.trim() : null,
      ssoEmployeeRate: parseFloat(formData.ssoEmployeeRate) || 5.0,
      ssoEmployerRate: formData.ssoEmployerRate ? parseFloat(formData.ssoEmployerRate) : parseFloat(formData.ssoEmployeeRate) || 5.0,
      providentFundRate: parseFloat(formData.providentFundRate) || 0,
      hasSocialSecurity: formData.hasSocialSecurity === 'true',
      employeeLevel: formData.employeeLevel,
      hasOvertime: formData.hasOvertime === 'true',
      bankName: formData.bankName,
      bankAccount: formData.bankAccount,
      address: formData.address,
      status: formData.resignDate ? 'RESIGNED' : formData.status,
    };

    try {
      const url = isEditing ? `/api/employees/${currentEmpId}` : '/api/employees';
      const method = isEditing ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok) {
        setErrorMessage(json.error || 'เกิดข้อผิดพลาดในการบันทึก');
        return;
      }

      setSuccessMessage(isEditing ? 'อัปเดตข้อมูลพนักงานสำเร็จ' : 'เพิ่มพนักงานใหม่เรียบร้อยแล้ว');
      setTimeout(() => setSuccessMessage(''), 3000);
      setIsModalOpen(false);
      fetchData();
    } catch (err: any) {
      setErrorMessage(err.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อ');
    }
  };

  // Requirement 2: เมื่อลบพนักงาน จะถูกลบออกจากระบบเลย ข้อมูลเงินเดือนทุกงวด ใบลา เวลาเข้างาน และตารางกะของคนนี้จะถูกลบไปด้วย
  const handleDelete = async (id: number, name: string) => {
    if (
      !confirm(
        `ยืนยันการลบพนักงาน "${name}" ออกจากระบบถาวรหรือไม่?\n\n⚠️ คำเตือน: ข้อมูลเงินเดือนทุกงวด, สลิปเงินเดือน, เวลาเข้างาน, และใบลาของพนักงานท่านนี้จะถูกลบออกจากระบบอย่างสมบูรณ์!`
      )
    )
      return;

    try {
      const res = await fetch(`/api/employees/${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (res.ok) {
        alert(json.message || 'ลบข้อมูลพนักงานเรียบร้อยแล้ว');
        fetchData();
      } else {
        alert(json.error || 'เกิดข้อผิดพลาดในการลบ');
      }
    } catch (e) {
      alert('เกิดข้อผิดพลาดในการเชื่อมต่อ');
    }
  };

  const activeEmployees = employees.filter((e) => e.status === 'ACTIVE');
  const monthlyCount = activeEmployees.filter((e) => e.employmentType?.code === 'MONTHLY').length;
  const dailyCount = activeEmployees.filter((e) => e.employmentType?.code === 'DAILY').length;
  const incompleteCount = activeEmployees.filter(
    (e) => !e.idCardNumber || !e.bankAccount || !e.departmentId
  ).length;

  return (
    <div className="space-y-6">
      {/* Page Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">ข้อมูลพนักงาน</h1>
          <p className="text-sm text-slate-500 mt-1">
            จัดการรายชื่อ ประวัติการจ้างงาน เงินเดือน ประกันสังคม และบัญชีธนาคาร
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition shadow-sm shadow-blue-600/30 shrink-0 cursor-pointer"
        >
          <UserPlus className="w-4 h-4" />
          <span>เพิ่มพนักงานใหม่</span>
        </button>
      </div>

      {/* Alert Banner */}
      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl flex items-center gap-2 text-sm font-medium">
          <CheckCircle className="w-5 h-5 text-emerald-600" />
          {successMessage}
        </div>
      )}

      {/* Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200/80">
          <div className="text-xs font-semibold text-slate-500">พนักงานปัจจุบัน</div>
          <div className="text-2xl font-bold text-slate-900 mt-1">{activeEmployees.length} คน</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200/80">
          <div className="text-xs font-semibold text-slate-500">พนักงานประจำ (รายเดือน)</div>
          <div className="text-2xl font-bold text-blue-600 mt-1">{monthlyCount} คน</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200/80">
          <div className="text-xs font-semibold text-slate-500">พนักงานรายวัน</div>
          <div className="text-2xl font-bold text-indigo-600 mt-1">{dailyCount} คน</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200/80">
          <div className="text-xs font-semibold text-slate-500">ข้อมูลยังไม่สมบูรณ์</div>
          <div className="text-2xl font-bold text-amber-600 mt-1">{incompleteCount} คน</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="ค้นหารหัส, ชื่อ-นามสกุล, บัตร ปชช., โทร..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-500 focus:bg-white transition"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-slate-500">แผนก:</span>
            <select
              value={filterDept}
              onChange={(e) => setFilterDept(e.target.value)}
              className="py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 outline-none cursor-pointer"
            >
              <option value="">ทั้งหมด</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-slate-500">สถานะ:</span>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 outline-none cursor-pointer"
            >
              <option value="">ทุกสถานะ</option>
              <option value="ACTIVE">ปฏิบัติงาน (ACTIVE)</option>
              <option value="RESIGNED">ลาออก (RESIGNED)</option>
              <option value="SUSPENDED">พักงาน (SUSPENDED)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Employees Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50/80 text-xs text-slate-500 uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-5 py-3.5 font-semibold">รหัสพนักงาน</th>
                <th className="px-5 py-3.5 font-semibold">ชื่อ - นามสกุล</th>
                <th className="px-5 py-3.5 font-semibold">แผนก / ตำแหน่ง</th>
                <th className="px-5 py-3.5 font-semibold">ประเภทการจ้าง</th>
                <th className="px-5 py-3.5 font-semibold text-right">เงินเดือน / ค่าจ้าง</th>
                <th className="px-5 py-3.5 font-semibold">เริ่มงาน</th>
                <th className="px-5 py-3.5 font-semibold text-center">สถานะ</th>
                <th className="px-5 py-3.5 font-semibold text-center">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="text-center py-10 text-slate-400">
                    กำลังโหลดข้อมูล...
                  </td>
                </tr>
              ) : employees.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-slate-400">
                    ไม่พบข้อมูลพนักงานที่ตรงกับเงื่อนไข
                  </td>
                </tr>
              ) : (
                employees.map((emp) => {
                  const isIncomplete = !emp.idCardNumber || !emp.bankAccount || !emp.departmentId;
                  const isDaily = emp.employmentType?.code === 'DAILY';

                  return (
                    <tr key={emp.id} className="hover:bg-slate-50/70 transition">
                      <td className="px-5 py-4 font-bold text-slate-900">
                        <div className="flex items-center gap-2">
                          {emp.avatar ? (
                            <img
                              src={emp.avatar}
                              alt=""
                              className="w-7 h-7 rounded-full object-cover border border-slate-200"
                            />
                          ) : (
                            <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600">
                              {emp.firstName?.charAt(0) || '?'}
                            </div>
                          )}
                          <span>{emp.employeeCode}</span>
                          {isIncomplete && (
                            <span
                              title="ข้อมูลบัตรประชาชนหรือธนาคารยังไม่ครบ"
                              className="text-amber-500 cursor-help"
                            >
                              <AlertCircle className="w-3.5 h-3.5" />
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="font-semibold text-slate-900">
                          {emp.firstName} {emp.lastName}
                        </div>
                        <div className="text-xs text-slate-400">
                          {emp.idCardNumber ? `ปชช: ${emp.idCardNumber}` : 'ยังไม่ระบุเลข ปชช.'}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="text-slate-800 font-medium">
                          {emp.department?.name || '-'}
                        </div>
                        <div className="text-xs text-slate-500">
                          {emp.position?.name || '-'}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className="inline-flex px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700">
                          {emp.employmentType?.name || 'พนักงานประจำ'}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right font-semibold text-slate-900">
                        {isDaily ? (
                          <span>฿{formatCurrency(emp.dailyWage)} / วัน</span>
                        ) : (
                          <span>฿{formatCurrency(emp.salary)} / ด.</span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-xs text-slate-500">
                        {formatThaiDateNumeric(emp.startDate)}
                      </td>
                      <td className="px-5 py-4 text-center">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${
                            emp.status === 'ACTIVE'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : emp.status === 'RESIGNED'
                              ? 'bg-slate-100 text-slate-600 border border-slate-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          {emp.status === 'ACTIVE'
                            ? 'ปฏิบัติงาน'
                            : emp.status === 'RESIGNED'
                            ? 'ลาออก'
                            : 'พักงาน'}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleOpenEdit(emp)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition cursor-pointer"
                            title="แก้ไขข้อมูล"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() =>
                              handleDelete(emp.id, `${emp.firstName} ${emp.lastName}`)
                            }
                            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                            title="ลบพนักงานและข้อมูลทั้งหมดออกจากระบบ"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
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

      {/* Add / Edit Employee Modal matching Image 1 exactly */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-300 shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in duration-150">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-white">
              <h2 className="text-lg font-bold text-slate-900">
                {isEditing ? 'แก้ไขพนักงาน' : 'เพิ่มพนักงาน'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-4">
              {errorMessage && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-center gap-2 font-medium">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* 1. Avatar Upload Box (Top) */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 flex items-center gap-4">
                <div className="w-16 h-16 rounded-full border-2 border-slate-300 bg-emerald-50 flex items-center justify-center text-emerald-700 text-2xl font-bold overflow-hidden shrink-0">
                  {formData.avatar ? (
                    <img src={formData.avatar} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    '?'
                  )}
                </div>

                <div>
                  <div className="text-xs font-semibold text-slate-700">รูปพนักงาน</div>
                  <label className="inline-flex items-center gap-1.5 px-3 py-1.5 mt-1 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer shadow-xs">
                    <ImageIcon className="w-3.5 h-3.5 text-slate-600" />
                    <span>เลือกรูป</span>
                    <input
                      type="file"
                      accept="image/png, image/jpeg"
                      onChange={handleAvatarChange}
                      className="hidden"
                    />
                  </label>
                  <div className="text-[11px] text-slate-400 mt-1">
                    ขนาดแนะนำ 150x150 พิกเซล ไฟล์ jpg, png สูงสุด 5MB • ใช้ในสลิปเงินเดือนพนักงาน
                  </div>
                </div>
              </div>

              {/* 2. Form Grid (2 columns layout matching Image 1) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Row 1 */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    รหัสพนักงาน *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="EMP001"
                    value={formData.employeeCode}
                    onChange={(e) => setFormData({ ...formData, employeeCode: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    ชื่อ-นามสกุล *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="สมชาย ใจดี"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm outline-none focus:border-blue-500"
                  />
                </div>

                {/* Row 2 */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">เพศ</label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm outline-none focus:border-blue-500"
                  >
                    <option value="ไม่ระบุ">ไม่ระบุ</option>
                    <option value="ชาย">ชาย</option>
                    <option value="หญิง">หญิง</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    วันเกิด (ไม่บังคับ)
                  </label>
                  <input
                    type="date"
                    value={formData.birthDate}
                    onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm outline-none focus:border-blue-500"
                  />
                </div>

                {/* Row 3 */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">สัญชาติ</label>
                  <input
                    type="text"
                    value={formData.nationality}
                    onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">ตำแหน่ง</label>
                  <select
                    value={formData.positionId}
                    onChange={(e) => setFormData({ ...formData, positionId: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm outline-none focus:border-blue-500"
                  >
                    <option value="">-- เลือกตำแหน่ง --</option>
                    {positions.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Row 4 */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">เบอร์โทร</label>
                  <input
                    type="text"
                    placeholder="08xxxxxxxx (10 หลัก)"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">แผนก</label>
                  <select
                    value={formData.departmentId}
                    onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm outline-none focus:border-blue-500"
                  >
                    <option value="">-- เลือกแผนก --</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Row 5 */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    ประเภทการจ้าง *
                  </label>
                  <select
                    value={formData.employmentTypeId}
                    onChange={(e) => setFormData({ ...formData, employmentTypeId: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm outline-none focus:border-blue-500"
                  >
                    {employmentTypes.map((et) => (
                      <option key={et.id} value={et.id}>
                        {et.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    เงินเดือน (บาท) *
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={formData.salary}
                    onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm font-bold outline-none focus:border-blue-500"
                  />
                  <div className="text-[11px] text-slate-400 mt-1">
                    ถ้าเป็นรายวัน ใส่ค่าจ้างต่อวันและเลือกรายวัน
                  </div>
                </div>

                {/* Row 6 */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    วันที่เริ่มงาน
                  </label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm outline-none focus:border-blue-500"
                  />
                </div>

                <div></div>

                {/* Row 7: Special Box: ปรับเงินเดือนใหม่ (ขึ้น/ลดเงินเดือน) - ไม่บังคับ */}
                <div className="sm:col-span-2 p-4 bg-slate-50/80 border border-slate-200 rounded-xl">
                  <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5 mb-3">
                    <CreditCard className="w-4 h-4 text-blue-600" />
                    <span>ปรับเงินเดือนใหม่ (ขึ้น/ลดเงินเดือน) — ไม่บังคับ</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">
                        เงินเดือนใหม่ (บาท)
                      </label>
                      <input
                        type="number"
                        step="any"
                        placeholder="0"
                        value={formData.newSalary}
                        onChange={(e) => setFormData({ ...formData, newSalary: e.target.value })}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm outline-none focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">
                        มีผลตั้งแต่วันที่
                      </label>
                      <input
                        type="date"
                        value={formData.newSalaryEffectiveDate}
                        onChange={(e) =>
                          setFormData({ ...formData, newSalaryEffectiveDate: e.target.value })
                        }
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div className="text-[11px] text-slate-400 mt-2">
                    ระบบจะจำเงินเดือนเดิมไว้เป็นประวัติ • จะคิดคำนวณอัตโนมัติเมื่อถึงรอบเงินเดือน
                  </div>
                </div>

                {/* Row 8 */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    วันที่ลาออก (เว้นว่างไว้ถ้ายังทำงานอยู่)
                  </label>
                  <input
                    type="date"
                    value={formData.resignDate}
                    onChange={(e) => setFormData({ ...formData, resignDate: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    เลขบัตรประชาชน (13 หลัก)
                  </label>
                  <input
                    type="text"
                    maxLength={13}
                    placeholder="ตัวเลข 13 หลัก"
                    value={formData.idCardNumber}
                    onChange={(e) => setFormData({ ...formData, idCardNumber: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm font-mono outline-none focus:border-blue-500"
                  />
                </div>

                {/* Row 9 */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    อัตรา กสส. (%)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={formData.ssoEmployeeRate}
                    onChange={(e) => setFormData({ ...formData, ssoEmployeeRate: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm outline-none focus:border-blue-500"
                  />
                  <div className="text-[11px] text-slate-400 mt-1">สมทบประกันสังคมบริษัท</div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    บริษัทสมทบ กสส. (%)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    placeholder="เท่ากับพนักงาน"
                    value={formData.ssoEmployerRate}
                    onChange={(e) => setFormData({ ...formData, ssoEmployerRate: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm outline-none focus:border-blue-500"
                  />
                  <div className="text-[11px] text-slate-400 mt-1">
                    เว้นว่าง = เท่ากับที่พนักงานสมทบ วิธีป้องกันคลาดเคลื่อน ไม่ให้คำนวณซ้ำซ้อน
                  </div>
                </div>

                {/* Row 10: กองทุนสำรองเลี้ยงชีพ */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    กองทุนสำรองเลี้ยงชีพ (%)
                  </label>
                  <select
                    value={formData.providentFundRate}
                    onChange={(e) => setFormData({ ...formData, providentFundRate: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm outline-none focus:border-blue-500"
                  >
                    <option value="0">ไม่เข้ากองทุน (0%)</option>
                    <option value="3">3%</option>
                    <option value="5">5%</option>
                    <option value="7">7%</option>
                    <option value="10">10%</option>
                    <option value="15">15%</option>
                  </select>
                  <div className="text-[11px] text-slate-400 mt-1">
                    ใส่ 0 ถ้าไม่เข้ากองทุนสำรองเลี้ยงชีพ
                  </div>

                  {formData.providentFundRate !== '0' && (
                    <div className="mt-2 p-2.5 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-800 flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
                      <span>กรณีเข้ากองทุนสำรองเลี้ยงชีพ จะนำไปหักในสลิปเงินเดือนและนำส่งเข้ากองทุน</span>
                    </div>
                  )}
                </div>

                {/* Row 11: ประกันสังคม & ระดับ */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    ประกันสังคม
                  </label>
                  <select
                    value={formData.hasSocialSecurity}
                    onChange={(e) =>
                      setFormData({ ...formData, hasSocialSecurity: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm outline-none focus:border-blue-500"
                  >
                    <option value="true">มีประกันสังคม (หัก 5%)</option>
                    <option value="false">ไม่หักประกันสังคม</option>
                  </select>
                  <div className="text-[11px] text-slate-400 mt-1">
                    * ถ้าพนักงานได้รับยกเว้น เช่น กรรมการ/เจ้าของบริษัทให้เลือกไม่หัก
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    ระดับ (สิทธิในสลิปและระบบ)
                  </label>
                  <select
                    value={formData.employeeLevel}
                    onChange={(e) => setFormData({ ...formData, employeeLevel: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm outline-none focus:border-blue-500"
                  >
                    <option value="พนักงาน">พนักงาน</option>
                    <option value="หัวหน้างาน">หัวหน้างาน</option>
                    <option value="ผู้จัดการ">ผู้จัดการ</option>
                    <option value="ผู้บริหาร">ผู้บริหาร</option>
                  </select>
                  <div className="text-[11px] text-slate-400 mt-1">
                    * บันทึกไว้ในประวัติการทำงานและตำแหน่ง • เปลี่ยนระดับ ใช้กับระบบสลิปและสิทธิ์เข้าถึง
                  </div>
                </div>

                {/* Row 12: สิทธิ OT & ธนาคาร */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    สิทธิค่าล่วงเวลา (OT)
                  </label>
                  <select
                    value={formData.hasOvertime}
                    onChange={(e) => setFormData({ ...formData, hasOvertime: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm outline-none focus:border-blue-500"
                  >
                    <option value="true">คิด OT ได้ (ปกติ)</option>
                    <option value="false">ไม่คิด OT</option>
                  </select>
                  <div className="text-[11px] text-slate-400 mt-1">
                    * ถ้าเป็นตำแหน่งที่ได้รับการยกเว้น "ระบุข้อกำหนด" ด้วย
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">ธนาคาร</label>
                  <input
                    type="text"
                    placeholder="เช่น ธนาคารกสิกรไทย"
                    value={formData.bankName}
                    onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm outline-none focus:border-blue-500"
                  />
                </div>

                {/* Row 13: เลขที่บัญชี */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    เลขที่บัญชี
                  </label>
                  <input
                    type="text"
                    placeholder="เช่น 123-4-56789-0"
                    value={formData.bankAccount}
                    onChange={(e) => setFormData({ ...formData, bankAccount: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm font-mono outline-none focus:border-blue-500"
                  />
                </div>

                {/* Row 14: ที่อยู่ */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    ที่อยู่ (สำหรับหนังสือรับรองหัก ณ ที่จ่าย 50 ทวิ)
                  </label>
                  <input
                    type="text"
                    placeholder="บ้านเลขที่ หมู่ ถนน ตำบล/แขวง อำเภอ/เขต จังหวัด รหัสไปรษณีย์"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Modal Footer */}
              <div className="pt-4 border-t border-slate-200 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2 border border-slate-300 text-slate-700 rounded-xl text-sm font-medium hover:bg-slate-100 transition cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-bold shadow-md transition cursor-pointer"
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
