'use client';

import React, { useState, useEffect } from 'react';
import {
  FileCheck2,
  Printer,
  Download,
  AlertTriangle,
  Building2,
  Calendar,
} from 'lucide-react';
import {
  formatCurrency,
  formatThaiDateFull,
  formatThaiDateNumeric,
  bahtText,
} from '@/lib/utils';

export default function WithholdingTaxPage() {
  const [employees, setEmployees] = useState<any[]>([]);
  const [selectedEmpId, setSelectedEmpId] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [company, setCompany] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/employees?status=ACTIVE'),
      fetch('/api/settings'),
    ])
      .then(async ([empRes, setRes]) => {
        const empData = await empRes.json();
        const setData = await setRes.json();

        if (Array.isArray(empData) && empData.length > 0) {
          setEmployees(empData);
          setSelectedEmpId(String(empData[0].id));
        }
        if (setData.company) setCompany(setData.company);
      })
      .finally(() => setLoading(false));
  }, []);

  const employee = employees.find((e) => String(e.id) === selectedEmpId);

  // คำนวณยอดสะสมทั้งปี (หรือประมาณการ)
  const monthlySalary = employee?.salary || 0;
  const annualIncome = monthlySalary * 12;
  const taxRate = employee?.withholdTaxRate || 0;
  const annualTax = Math.round((annualIncome * (taxRate / 100)) * 100) / 100;
  const annualSso = Math.min(monthlySalary * 0.05, 750) * 12;

  return (
    <div className="space-y-6">
      {/* Control Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs print:hidden">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            หนังสือรับรองการหักภาษี ณ ที่จ่าย (ภ.ง.ด.50 ทวิ)
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            มาตรา 50 ทวิ แห่งประมวลรัษฎากร สำหรับยื่นแสดงภาษีเงินได้บุคคลธรรมดา
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-600">พนักงาน:</span>
            <select
              value={selectedEmpId}
              onChange={(e) => setSelectedEmpId(e.target.value)}
              className="py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 outline-none cursor-pointer max-w-xs"
            >
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.employeeCode} - {emp.firstName} {emp.lastName}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-600">ปีภาษี:</span>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 outline-none cursor-pointer"
            >
              <option value={2026}>พ.ศ. 2569</option>
              <option value={2025}>พ.ศ. 2568</option>
            </select>
          </div>

          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/20 transition cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>พิมพ์ 50 ทวิ</span>
          </button>
        </div>
      </div>

      {/* Warning Notice as requested */}
      <div className="p-4 bg-amber-50 border border-amber-300 rounded-xl flex items-start gap-3 text-xs text-amber-900 print:hidden">
        <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold">ข้อกำหนดการใช้งานเอกสารราชการ:</span>{' '}
          เอกสารนี้จัดทำขึ้นเป็นแบบฟอร์มร่างตามโครงสร้างข้อมูลที่บันทึกไว้ในระบบ
          ก่อนนำไปยื่นแสดงต่อกรมสรรพากรหรือส่งมอบแก่พนักงาน
          โปรดตรวจสอบความถูกต้องของยอดรวมสะสมและภาษีหัก ณ ที่จ่ายจริงกับฝ่ายบัญชีก่อนทุกครั้ง
        </div>
      </div>

      {/* 50 Tawi Official Form Layout */}
      <div className="bg-white p-8 sm:p-12 rounded-2xl border border-slate-300 shadow-md max-w-4xl mx-auto print:shadow-none print:border-none print:p-0 print:m-0 text-slate-900 font-sans text-xs">
        {/* Form Header */}
        <div className="text-center pb-4 border-b border-slate-900">
          <div className="text-base font-bold tracking-tight">
            หนังสือรับรองการหักภาษี ณ ที่จ่าย
          </div>
          <div className="text-[11px] text-slate-600">
            ตามมาตรา 50 ทวิ แห่งประมวลรัษฎากร
          </div>
          <div className="text-right text-[11px] font-semibold text-slate-700 mt-1">
            เล่มที่/เลขที่: 50T-{selectedYear}-{employee?.employeeCode || '001'}
          </div>
        </div>

        {/* Section 1: Payer (Company) */}
        <div className="py-3 border-b border-slate-300 space-y-1">
          <div className="font-bold text-slate-900">
            1. ผู้มีหน้าที่หักภาษี ณ ที่จ่าย :
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-3">
            <div>
              <span className="text-slate-500">ชื่อ:</span>{' '}
              <span className="font-semibold">{company?.name || 'บริษัท สยามพาณิชย์ อินโนเวชั่น จำกัด'}</span>
            </div>
            <div>
              <span className="text-slate-500">เลขประจำตัวผู้เสียภาษีอากร:</span>{' '}
              <span className="font-mono font-bold">{company?.taxId || '0105556012345'}</span>
            </div>
            <div className="sm:col-span-2">
              <span className="text-slate-500">ที่อยู่:</span>{' '}
              <span>{company?.address || '-'}</span>
            </div>
          </div>
        </div>

        {/* Section 2: Payee (Employee) */}
        <div className="py-3 border-b border-slate-300 space-y-1">
          <div className="font-bold text-slate-900">
            2. ผู้ถูกหักภาษี ณ ที่จ่าย :
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-3">
            <div>
              <span className="text-slate-500">ชื่อ:</span>{' '}
              <span className="font-semibold">
                {employee?.titleName || (employee?.gender === 'หญิง' ? 'นางสาว' : 'นาย')} {employee?.firstName} {employee?.lastName}
              </span>
            </div>
            <div>
              <span className="text-slate-500">เลขประจำตัวประชาชน (13 หลัก):</span>{' '}
              <span className="font-mono font-bold">{employee?.idCardNumber || '-'}</span>
            </div>
            <div className="sm:col-span-2">
              <span className="text-slate-500">ที่อยู่:</span>{' '}
              <span>{employee?.address || '-'}</span>
            </div>
          </div>
        </div>

        {/* Section 3: Income Table */}
        <div className="py-4">
          <table className="w-full text-left border border-slate-400 border-collapse">
            <thead>
              <tr className="bg-slate-100 text-center font-bold">
                <th className="border border-slate-400 p-2">ประเภทเงินได้พึงประเมินที่จ่าย</th>
                <th className="border border-slate-400 p-2 w-32">วัน เดือน ปี ที่จ่าย</th>
                <th className="border border-slate-400 p-2 w-36 text-right">จำนวนเงินที่จ่าย (บาท)</th>
                <th className="border border-slate-400 p-2 w-36 text-right">ภาษีที่หักและนำส่ง (บาท)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-slate-400 p-2">
                  <div className="font-semibold">
                    1. เงินเดือน ค่าจ้าง เบี้ยเลี้ยง โบนัส ฯลฯ ตามมาตรา 40 (1)
                  </div>
                  <div className="text-[10px] text-slate-500">
                    ประจำปีภาษี พ.ศ. {selectedYear + 543}
                  </div>
                </td>
                <td className="border border-slate-400 p-2 text-center">
                  ตลอดปี {selectedYear + 543}
                </td>
                <td className="border border-slate-400 p-2 text-right font-mono font-semibold">
                  {formatCurrency(annualIncome)}
                </td>
                <td className="border border-slate-400 p-2 text-right font-mono font-semibold">
                  {formatCurrency(annualTax)}
                </td>
              </tr>
              <tr>
                <td className="border border-slate-400 p-2 text-slate-500">
                  2. ค่าธรรมเนียม ค่านายหน้า ฯลฯ ตามมาตรา 40 (2)
                </td>
                <td className="border border-slate-400 p-2 text-center text-slate-400">-</td>
                <td className="border border-slate-400 p-2 text-right font-mono text-slate-400">-</td>
                <td className="border border-slate-400 p-2 text-right font-mono text-slate-400">-</td>
              </tr>
              {/* Grand Total */}
              <tr className="bg-slate-50 font-bold">
                <td colSpan={2} className="border border-slate-400 p-2 text-right">
                  รวมเงินที่จ่ายและภาษีที่หักนำส่ง
                </td>
                <td className="border border-slate-400 p-2 text-right font-mono text-sm">
                  {formatCurrency(annualIncome)}
                </td>
                <td className="border border-slate-400 p-2 text-right font-mono text-sm text-rose-700">
                  {formatCurrency(annualTax)}
                </td>
              </tr>
              <tr className="bg-slate-100 font-bold">
                <td colSpan={4} className="border border-slate-400 p-2">
                  <span className="text-slate-600">รวมเงินภาษีที่หักนำส่ง (ตัวอักษร) : </span>
                  <span className="text-slate-900">{bahtText(annualTax)}</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Section 4: Social Security & Funds */}
        <div className="p-3 border border-slate-300 rounded-lg bg-slate-50/50 space-y-1 mb-6">
          <div className="font-semibold text-slate-800">
            เงินสมทบกองทุนประกันสังคม / กองทุนสำรองเลี้ยงชีพ :
          </div>
          <div className="grid grid-cols-2 gap-4 text-slate-700">
            <div>
              • เงินสมทบกองทุนประกันสังคมตลอดปี: <span className="font-bold">{formatCurrency(annualSso)} บาท</span>
            </div>
            <div>
              • เงินสะสมกองทุนสำรองเลี้ยงชีพ: <span className="font-bold">0.00 บาท</span>
            </div>
          </div>
        </div>

        {/* Section 5: Signature */}
        <div className="grid grid-cols-2 gap-8 pt-4 border-t border-slate-900 text-center">
          <div className="text-left space-y-2">
            <div className="font-bold">ผู้จ่ายเงิน :</div>
            <div>[X] หักภาษี ณ ที่จ่าย</div>
            <div>[ ] ออกภาษีให้ตลอดไป</div>
            <div>[ ] ออกภาษีให้ครั้งเดียว</div>
          </div>

          <div className="space-y-1">
            <div className="text-slate-500 text-[11px]">
              ขอรับรองว่าข้อความและตัวเลขดังกล่าวข้างต้นถูกต้องตรงกับความจริงทุกประการ
            </div>
            <div className="h-12"></div>
            <div>ลงชื่อ............................................................ ผู้มีอำนาจลงนาม</div>
            <div className="font-bold">({company?.authorizedSignatory || 'ผู้มีอำนาจลงนาม'})</div>
            <div className="text-slate-500">ประทับตรานิติบุคคล (ถ้ามี)</div>
            <div className="text-[11px] text-slate-500 pt-1">
              วันที่ {formatThaiDateFull(new Date())}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

