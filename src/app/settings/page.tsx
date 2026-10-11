'use client';

import React, { useState, useEffect } from 'react';
import {
  Settings,
  Building2,
  Sliders,
  Users,
  CreditCard,
  Calendar,
  Plus,
  Save,
  CheckCircle,
  AlertCircle,
  Percent,
  Trash2,
  X,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Copy,
  Info
} from 'lucide-react';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'company' | 'payroll' | 'organization' | 'types' | 'holidays'>('company');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Data states
  const [company, setCompany] = useState<any>({
    name: '',
    nameEn: '',
    taxId: '',
    address: '',
    phone: '',
    email: '',
    authorizedSignatory: '',
    signatoryPosition: '',
    socialSecurityNo: '',
    socialSecurityBranch: '000000',
  });

  const [settings, setSettings] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [positions, setPositions] = useState<any[]>([]);
  const [incomeTypes, setIncomeTypes] = useState<any[]>([]);
  const [deductionTypes, setDeductionTypes] = useState<any[]>([]);

  // Holidays state
  const [holidayYear, setHolidayYear] = useState<number>(2569);
  const [holidays, setHolidays] = useState<any[]>([]);
  const [newHolidayDate, setNewHolidayDate] = useState('');
  const [newHolidayName, setNewHolidayName] = useState('');
  const [holidayOtMultiplier, setHolidayOtMultiplier] = useState('3');
  const [holidayLoading, setHolidayLoading] = useState(false);

  // New item inputs
  const [newDeptName, setNewDeptName] = useState('');
  const [newPosName, setNewPosName] = useState('');
  const [newIncName, setNewIncName] = useState('');
  const [newDedName, setNewDedName] = useState('');

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/settings');
      const data = await res.json();
      if (data.company) setCompany(data.company);
      if (data.settings) {
        setSettings(data.settings);
        const otRateSetting = data.settings.find((s: any) => s.key === 'HOLIDAY_OT_RATE');
        if (otRateSetting) {
          setHolidayOtMultiplier(otRateSetting.value);
        }
      }
      if (data.departments) setDepartments(data.departments);
      if (data.positions) setPositions(data.positions);
      if (data.incomeTypes) setIncomeTypes(data.incomeTypes);
      if (data.deductionTypes) setDeductionTypes(data.deductionTypes);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchHolidays = async (yr: number) => {
    setHolidayLoading(true);
    try {
      const res = await fetch(`/api/holidays?year=${yr}`);
      const data = await res.json();
      if (Array.isArray(data)) {
        setHolidays(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setHolidayLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
    fetchHolidays(holidayYear);
  }, []);

  useEffect(() => {
    fetchHolidays(holidayYear);
  }, [holidayYear]);

  const handleSaveCompanyAndSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company,
          settings,
        }),
      });

      if (res.ok) {
        setSuccessMessage('บันทึกการตั้งค่าเรียบร้อยแล้ว');
        setTimeout(() => setSuccessMessage(''), 3000);
        fetchSettings();
      } else {
        alert('เกิดข้อผิดพลาดในการบันทึก');
      }
    } catch (e) {
      alert('เกิดข้อผิดพลาดในการเชื่อมต่อ');
    } finally {
      setSaving(false);
    }
  };

  const handleAddDepartment = async () => {
    if (!newDeptName.trim()) return;
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newDepartment: { name: newDeptName.trim() } }),
      });
      if (res.ok) {
        setNewDeptName('');
        fetchSettings();
      }
    } catch (e) {
      alert('เกิดข้อผิดพลาด');
    }
  };

  const handleAddPosition = async () => {
    if (!newPosName.trim()) return;
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPosition: { name: newPosName.trim() } }),
      });
      if (res.ok) {
        setNewPosName('');
        fetchSettings();
      }
    } catch (e) {
      alert('เกิดข้อผิดพลาด');
    }
  };

  const handleAddIncomeType = async () => {
    if (!newIncName.trim()) return;
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newIncomeType: { name: newIncName.trim() } }),
      });
      if (res.ok) {
        setNewIncName('');
        fetchSettings();
      }
    } catch (e) {
      alert('เกิดข้อผิดพลาด');
    }
  };

  const handleAddDeductionType = async () => {
    if (!newDedName.trim()) return;
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newDeductionType: { name: newDedName.trim() } }),
      });
      if (res.ok) {
        setNewDedName('');
        fetchSettings();
      }
    } catch (e) {
      alert('เกิดข้อผิดพลาด');
    }
  };

  const handleDeleteItem = async (type: 'department' | 'position' | 'incomeType' | 'deductionType', id: number, name: string) => {
    const typeLabelMap: Record<string, string> = {
      department: 'แผนก',
      position: 'ตำแหน่ง',
      incomeType: 'ประเภทเงินได้',
      deductionType: 'ประเภทเงินหัก',
    };
    if (!confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบ${typeLabelMap[type]} "${name}" ?`)) return;

    try {
      const res = await fetch(`/api/settings?type=${type}&id=${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (res.ok) {
        setSuccessMessage(`ลบ${typeLabelMap[type]}สำเร็จ`);
        setTimeout(() => setSuccessMessage(''), 3000);
        fetchSettings();
      } else {
        alert(data.error || 'ไม่สามารถลบรายการได้');
      }
    } catch (e) {
      alert('เกิดข้อผิดพลาดในการเชื่อมต่อ');
    }
  };

  // Holiday actions
  const handleAddHoliday = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHolidayDate || !newHolidayName.trim()) return;
    try {
      const res = await fetch('/api/holidays', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: newHolidayDate,
          name: newHolidayName.trim(),
          year: holidayYear,
        }),
      });
      if (res.ok) {
        setNewHolidayDate('');
        setNewHolidayName('');
        fetchHolidays(holidayYear);
        setSuccessMessage('เพิ่มวันหยุดเรียบร้อยแล้ว');
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        const err = await res.json();
        alert(err.error || 'เกิดข้อผิดพลาด');
      }
    } catch (e) {
      alert('เกิดข้อผิดพลาดในการเชื่อมต่อ');
    }
  };

  const handleSeedStandardHolidays = async () => {
    if (!confirm(`ต้องการเติมวันหยุดตามประเพณีของปี ${holidayYear} ทั้งหมดใช่หรือไม่?`)) return;
    try {
      const res = await fetch('/api/holidays', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'seed_standard',
          year: holidayYear,
        }),
      });
      if (res.ok) {
        fetchHolidays(holidayYear);
        setSuccessMessage(`เติมวันหยุดทั่วไปปี ${holidayYear} เรียบร้อยแล้ว`);
        setTimeout(() => setSuccessMessage(''), 3000);
      }
    } catch (e) {
      alert('เกิดข้อผิดพลาด');
    }
  };

  const handleCopyFromPreviousYear = async () => {
    const prevYear = holidayYear - 1;
    if (!confirm(`ต้องการคัดลอกวันหยุดจากปี ${prevYear} มายังปี ${holidayYear} ใช่หรือไม่?`)) return;
    try {
      const res = await fetch('/api/holidays', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'copy_from_year',
          fromYear: prevYear,
          toYear: holidayYear,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        fetchHolidays(holidayYear);
        setSuccessMessage(data.message || `คัดลอกจากปี ${prevYear} สำเร็จ`);
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        alert(data.error || 'ไม่สามารถคัดลอกวันหยุดได้');
      }
    } catch (e) {
      alert('เกิดข้อผิดพลาด');
    }
  };

  const handleDeleteHoliday = async (id: number, name: string) => {
    if (!confirm(`ต้องการลบวันหยุด "${name}" หรือไม่?`)) return;
    try {
      const res = await fetch(`/api/holidays?id=${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        fetchHolidays(holidayYear);
        setSuccessMessage('ลบวันหยุดเรียบร้อยแล้ว');
        setTimeout(() => setSuccessMessage(''), 3000);
      }
    } catch (e) {
      alert('เกิดข้อผิดพลาด');
    }
  };

  const handleSaveOtMultiplier = async () => {
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company,
          settings: [
            ...settings.filter((s) => s.key !== 'HOLIDAY_OT_RATE'),
            { key: 'HOLIDAY_OT_RATE', value: holidayOtMultiplier, label: 'อัตราคูณล่วงเวลาวันหยุด (เท่า)' },
          ],
        }),
      });
      if (res.ok) {
        setSuccessMessage('บันทึกอัตราคูณ OT เรียบร้อยแล้ว');
        setTimeout(() => setSuccessMessage(''), 3000);
        fetchSettings();
      }
    } catch (e) {
      alert('เกิดข้อผิดพลาด');
    }
  };

  const updateSettingValue = (key: string, value: string) => {
    setSettings((prev) =>
      prev.map((s) => (s.key === key ? { ...s, value } : s))
    );
  };

  // Helper format thai date: e.g. "พฤ 1 ม.ค."
  const formatThaiDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      const days = ['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.'];
      const months = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
      return `${days[d.getDay()]} ${d.getDate()} ${months[d.getMonth()]}`;
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">ตั้งค่าระบบ</h1>
        <p className="text-sm text-slate-500 mt-1">
          กำหนดข้อมูลบริษัท กฎการคำนวณเงินเดือน ประกันสังคม แผนก รายการเงินได้/เงินหัก และปฏิทินวันหยุด
        </p>
      </div>

      {/* Success Notification */}
      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl flex items-center gap-2 text-sm font-medium">
          <CheckCircle className="w-5 h-5 text-emerald-600" />
          {successMessage}
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex border-b border-slate-200 bg-white px-5 rounded-t-2xl overflow-x-auto">
        {[
          { key: 'company', label: 'ข้อมูลบริษัทและผู้ลงนาม', icon: Building2 },
          { key: 'payroll', label: 'กฎการคำนวณและประกันสังคม', icon: Sliders },
          { key: 'organization', label: 'แผนกและตำแหน่ง', icon: Users },
          { key: 'types', label: 'รายการเงินได้ / เงินหัก', icon: CreditCard },
          { key: 'holidays', label: 'ปฏิทินวันหยุดบริษัท', icon: Calendar },
        ].map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`flex items-center gap-2 py-4 px-4 text-xs font-bold border-b-2 transition cursor-pointer whitespace-nowrap ${
                active
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: Company Profile */}
      {activeTab === 'company' && (
        <form onSubmit={handleSaveCompanyAndSettings} className="bg-white p-6 rounded-b-2xl border border-slate-200/80 shadow-xs space-y-6 -mt-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                ชื่อบริษัท / นิติบุคคล (ภาษาไทย) *
              </label>
              <input
                type="text"
                required
                value={company.name || ''}
                onChange={(e) => setCompany({ ...company, name: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                ชื่อบริษัท (ภาษาอังกฤษ)
              </label>
              <input
                type="text"
                value={company.nameEn || ''}
                onChange={(e) => setCompany({ ...company, nameEn: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                เลขประจำตัวผู้เสียภาษีอากร (13 หลัก) *
              </label>
              <input
                type="text"
                required
                maxLength={13}
                value={company.taxId || ''}
                onChange={(e) => setCompany({ ...company, taxId: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm outline-none focus:border-blue-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                เลขที่บัญชีนายจ้าง ประกันสังคม (10 หลัก) *
              </label>
              <input
                type="text"
                required
                maxLength={10}
                value={company.socialSecurityNo || ''}
                onChange={(e) => setCompany({ ...company, socialSecurityNo: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm outline-none focus:border-blue-500 font-mono"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                ที่อยู่สถานประกอบการ *
              </label>
              <textarea
                rows={2}
                required
                value={company.address || ''}
                onChange={(e) => setCompany({ ...company, address: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">เบอร์โทรศัพท์</label>
              <input
                type="text"
                value={company.phone || ''}
                onChange={(e) => setCompany({ ...company, phone: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">อีเมลติดต่อฝ่ายบุคคล</label>
              <input
                type="email"
                value={company.email || ''}
                onChange={(e) => setCompany({ ...company, email: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                ชื่อผู้มีอำนาจลงนาม (สำหรับสลิป และแบบภาษี 50 ทวิ) *
              </label>
              <input
                type="text"
                required
                value={company.authorizedSignatory || ''}
                onChange={(e) => setCompany({ ...company, authorizedSignatory: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">ตำแหน่งผู้ลงนาม</label>
              <input
                type="text"
                value={company.signatoryPosition || ''}
                onChange={(e) => setCompany({ ...company, signatoryPosition: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-100">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-md shadow-blue-600/20 transition cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'กำลังบันทึก...' : 'บันทึกข้อมูลบริษัท'}</span>
            </button>
          </div>
        </form>
      )}

      {/* Tab 2: Calculation Rules & SSO */}
      {activeTab === 'payroll' && (
        <form onSubmit={handleSaveCompanyAndSettings} className="bg-white p-6 rounded-b-2xl border border-slate-200/80 shadow-xs space-y-6 -mt-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {settings.map((s) => (
              <div key={s.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <label className="block text-xs font-bold text-slate-800 mb-1">{s.label}</label>
                <div className="flex items-center gap-2 mt-2">
                  <input
                    type="text"
                    value={s.value}
                    onChange={(e) => updateSettingValue(s.key, e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-bold text-slate-900 outline-none focus:border-blue-500"
                  />
                </div>
                <div className="text-[10px] text-slate-400 mt-1">คีย์ระบบ: {s.key}</div>
              </div>
            ))}
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-100">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-md shadow-blue-600/20 transition cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>บันทึกการตั้งค่าคำนวณ</span>
            </button>
          </div>
        </form>
      )}

      {/* Tab 3: Organization (Depts & Positions) */}
      {activeTab === 'organization' && (
        <div className="bg-white p-6 rounded-b-2xl border border-slate-200/80 shadow-xs space-y-8 -mt-6">
          {/* Departments */}
          <div>
            <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-blue-600" />
              <span>รายการแผนกในองค์กร</span>
            </h3>

            <div className="flex gap-2 max-w-md mb-4">
              <input
                type="text"
                placeholder="ชื่อแผนกใหม่..."
                value={newDeptName}
                onChange={(e) => setNewDeptName(e.target.value)}
                className="flex-1 px-3 py-2 border border-slate-300 rounded-xl text-xs outline-none focus:border-blue-500"
              />
              <button
                type="button"
                onClick={handleAddDepartment}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold cursor-pointer"
              >
                เพิ่มแผนก
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              {departments.map((d) => (
                <span
                  key={d.id}
                  className="group inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 text-slate-800 text-xs font-medium border border-slate-200 hover:border-slate-300 transition"
                >
                  <span>{d.name} {d.code && `(${d.code})`}</span>
                  <button
                    type="button"
                    onClick={() => handleDeleteItem('department', d.id, d.name)}
                    className="text-slate-400 hover:text-rose-600 transition cursor-pointer p-0.5 rounded hover:bg-slate-200"
                    title="ลบแผนก"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </span>
              ))}
              {departments.length === 0 && (
                <p className="text-xs text-slate-400 italic">ยังไม่มีรายการแผนก</p>
              )}
            </div>
          </div>

          {/* Positions */}
          <div className="pt-6 border-t border-slate-100">
            <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-600" />
              <span>รายการตำแหน่งงาน</span>
            </h3>

            <div className="flex gap-2 max-w-md mb-4">
              <input
                type="text"
                placeholder="ชื่อตำแหน่งใหม่..."
                value={newPosName}
                onChange={(e) => setNewPosName(e.target.value)}
                className="flex-1 px-3 py-2 border border-slate-300 rounded-xl text-xs outline-none focus:border-blue-500"
              />
              <button
                type="button"
                onClick={handleAddPosition}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold cursor-pointer"
              >
                เพิ่มตำแหน่ง
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              {positions.map((p) => (
                <span
                  key={p.id}
                  className="group inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 text-slate-800 text-xs font-medium border border-slate-200 hover:border-slate-300 transition"
                >
                  <span>{p.name}</span>
                  <button
                    type="button"
                    onClick={() => handleDeleteItem('position', p.id, p.name)}
                    className="text-slate-400 hover:text-rose-600 transition cursor-pointer p-0.5 rounded hover:bg-slate-200"
                    title="ลบตำแหน่ง"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </span>
              ))}
              {positions.length === 0 && (
                <p className="text-xs text-slate-400 italic">ยังไม่มีรายการตำแหน่ง</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Income & Deduction Types */}
      {activeTab === 'types' && (
        <div className="bg-white p-6 rounded-b-2xl border border-slate-200/80 shadow-xs space-y-8 -mt-6">
          {/* Income Types */}
          <div>
            <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-emerald-600" />
              <span>รายการประเภทเงินได้ (Incomes)</span>
            </h3>

            <div className="flex gap-2 max-w-md mb-4">
              <input
                type="text"
                placeholder="เพิ่มประเภทเงินได้ใหม่ เช่น ค่าคอมมิชชั่น..."
                value={newIncName}
                onChange={(e) => setNewIncName(e.target.value)}
                className="flex-1 px-3 py-2 border border-slate-300 rounded-xl text-xs outline-none focus:border-emerald-500"
              />
              <button
                type="button"
                onClick={handleAddIncomeType}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold cursor-pointer"
              >
                เพิ่มเงินได้
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              {incomeTypes.map((i) => (
                <span
                  key={i.id}
                  className="group inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 text-xs font-medium border border-emerald-200"
                >
                  <span>{i.name}</span>
                  <button
                    type="button"
                    onClick={() => handleDeleteItem('incomeType', i.id, i.name)}
                    className="text-emerald-400 hover:text-rose-600 transition cursor-pointer p-0.5 rounded hover:bg-emerald-100"
                    title="ลบประเภทเงินได้"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </span>
              ))}
              {incomeTypes.length === 0 && (
                <p className="text-xs text-slate-400 italic">ยังไม่มีรายการเงินได้</p>
              )}
            </div>
          </div>

          {/* Deduction Types */}
          <div className="pt-6 border-t border-slate-100">
            <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-rose-600" />
              <span>รายการประเภทเงินหัก (Deductions)</span>
            </h3>

            <div className="flex gap-2 max-w-md mb-4">
              <input
                type="text"
                placeholder="เพิ่มประเภทเงินหักใหม่..."
                value={newDedName}
                onChange={(e) => setNewDedName(e.target.value)}
                className="flex-1 px-3 py-2 border border-slate-300 rounded-xl text-xs outline-none focus:border-rose-500"
              />
              <button
                type="button"
                onClick={handleAddDeductionType}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold cursor-pointer"
              >
                เพิ่มเงินหัก
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              {deductionTypes.map((d) => (
                <span
                  key={d.id}
                  className="group inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-rose-50 text-rose-800 text-xs font-medium border border-rose-200"
                >
                  <span>{d.name}</span>
                  <button
                    type="button"
                    onClick={() => handleDeleteItem('deductionType', d.id, d.name)}
                    className="text-rose-400 hover:text-rose-600 transition cursor-pointer p-0.5 rounded hover:bg-rose-100"
                    title="ลบประเภทเงินหัก"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </span>
              ))}
              {deductionTypes.length === 0 && (
                <p className="text-xs text-slate-400 italic">ยังไม่มีรายการเงินหัก</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab 5: Company Holiday Calendar (รูปที่ 2) */}
      {activeTab === 'holidays' && (
        <div className="bg-white p-6 rounded-b-2xl border border-slate-200/80 shadow-xs space-y-6 -mt-6">
          {/* Header & Year Switcher Toolbar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-600" />
                <span>ปฏิทินวันหยุดบริษัท</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                วันหยุดตามประเพณีของบริษัทมีผลต่อการคำนวณค่าล่วงเวลาและวันทำงาน
              </p>
            </div>

            {/* Year Navigator */}
            <div className="flex items-center gap-2 bg-slate-100/80 p-1 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={() => setHolidayYear((prev) => prev - 1)}
                className="p-1.5 hover:bg-white text-slate-700 rounded-lg transition cursor-pointer"
                title="ปีก่อนหน้า"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm font-bold text-slate-800 px-3">
                ปี {holidayYear}
              </span>
              <button
                type="button"
                onClick={() => setHolidayYear((prev) => prev + 1)}
                className="p-1.5 hover:bg-white text-slate-700 rounded-lg transition cursor-pointer"
                title="ปีถัดไป"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Quick Actions & Status Badge */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 bg-slate-50/70 rounded-xl border border-slate-200/80">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-100 text-blue-800 rounded-lg text-xs font-bold">
                {holidays.length} วัน
              </span>
              <span className="text-xs text-slate-600 font-medium">
                — กฎหมายกำหนดวันหยุดตามประเพณีอย่างน้อย 13 วัน
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={handleSeedStandardHolidays}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl text-xs font-semibold shadow-2xs transition cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>เติมวันหยุดทั่วไปปี {holidayYear}</span>
              </button>

              <button
                type="button"
                onClick={handleCopyFromPreviousYear}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl text-xs font-semibold shadow-2xs transition cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5 text-blue-500" />
                <span>คัดลอกจากปี {holidayYear - 1}</span>
              </button>
            </div>
          </div>

          {/* Add Holiday Form */}
          <form onSubmit={handleAddHoliday} className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end p-4 bg-white rounded-xl border border-slate-200">
            <div className="sm:col-span-4">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                วันที่ *
              </label>
              <input
                type="date"
                required
                value={newHolidayDate}
                onChange={(e) => setNewHolidayDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs outline-none focus:border-blue-500 bg-white"
              />
            </div>

            <div className="sm:col-span-6">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                ชื่อวันหยุด *
              </label>
              <input
                type="text"
                required
                placeholder="เช่น วันขึ้นปีใหม่, วันสงกรานต์..."
                value={newHolidayName}
                onChange={(e) => setNewHolidayName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs outline-none focus:border-blue-500"
              />
            </div>

            <div className="sm:col-span-2">
              <button
                type="submit"
                className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition cursor-pointer inline-flex items-center justify-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>เพิ่มวันหยุด</span>
              </button>
            </div>
          </form>

          {/* Holidays Table */}
          <div className="overflow-hidden border border-slate-200 rounded-xl bg-white shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-xs font-bold">
                    <th className="py-3 px-4 w-40">วันที่</th>
                    <th className="py-3 px-4">ชื่อวันหยุด</th>
                    <th className="py-3 px-4 w-28 text-center">จัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {holidayLoading ? (
                    <tr>
                      <td colSpan={3} className="py-8 text-center text-slate-400">
                        กำลังโหลดข้อมูลวันหยุด...
                      </td>
                    </tr>
                  ) : holidays.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="py-8 text-center text-slate-400 italic">
                        ยังไม่มีวันหยุดที่กำหนดสำหรับปี {holidayYear}
                      </td>
                    </tr>
                  ) : (
                    holidays.map((h) => (
                      <tr key={h.id} className="hover:bg-slate-50/80 transition">
                        <td className="py-3 px-4 font-bold text-slate-700 whitespace-nowrap">
                          {formatThaiDate(h.date)}
                        </td>
                        <td className="py-3 px-4 text-slate-800 font-medium">
                          {h.name}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <button
                            type="button"
                            onClick={() => handleDeleteHoliday(h.id, h.name)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-rose-600 hover:bg-rose-50 rounded-lg text-xs font-semibold transition cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>ลบ</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* OT Setting & Notice Box */}
          <div className="pt-4 border-t border-slate-200/80 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col justify-between">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  ตั้งค่าตัวคูณ OT วันหยุด
                </label>
                <p className="text-[11px] text-slate-500 mb-2">
                  ตามกฎหมายแรงงาน ทำงานในวันหยุดได้รับค่าทำงาน 1 เท่า และค่าล่วงเวลาในวันหยุดได้รับ 3 เท่า
                </p>
                <div className="flex items-center gap-2">
                  <select
                    value={holidayOtMultiplier}
                    onChange={(e) => setHolidayOtMultiplier(e.target.value)}
                    className="px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-blue-500"
                  >
                    <option value="1">1 เท่า</option>
                    <option value="2">2 เท่า</option>
                    <option value="3">3 เท่า (ค่ามาตรฐานกฎหมาย)</option>
                  </select>
                  <button
                    type="button"
                    onClick={handleSaveOtMultiplier}
                    className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold cursor-pointer"
                  >
                    บันทึกตัวคูณ
                  </button>
                </div>
              </div>
            </div>

            <div className="p-4 bg-amber-50/70 border border-amber-200/80 rounded-xl flex items-start gap-2.5">
              <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-[11px] text-amber-900 leading-relaxed">
                <span className="font-bold block mb-0.5">ข้อควรระวังเรื่องวันหยุดทางจันทรคติ:</span>
                วันหยุดทางพุทธศาสนา (เช่น วันมาฆบูชา, วันวิสาขบูชา, วันอาสาฬหบูชา) และวันหยุดพิเศษตามมติ ครม. อาจมีการเปลี่ยนแปลงในแต่ละปี กรุณาตรวจสอบประกาศจากภาครัฐก่อนเริ่มปีปฏิทิน
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


