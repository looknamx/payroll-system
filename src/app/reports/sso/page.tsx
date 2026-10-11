'use client';

import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Printer,
  Download,
  AlertTriangle,
  Calendar,
} from 'lucide-react';
import {
  formatCurrency,
  formatThaiDateFull,
  formatThaiDateNumeric,
  THAI_MONTHS,
  bahtText,
} from '@/lib/utils';

export default function SsoReportPage() {
  const [month, setMonth] = useState<number>(10);
  const [year, setYear] = useState<number>(2026);
  const [records, setRecords] = useState<any[]>([]);
  const [company, setCompany] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/settings')
      .then((res) => res.json())
      .then((data) => {
        if (data.company) setCompany(data.company);
      });
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/dashboard?month=${month}&year=${year}`);
      const data = await res.json();
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
    fetchData();
  }, [month, year]);

  // SSO Calculations
  const calculatedRows = records.map((r, idx) => {
    const rawSalary = r.baseSalary || 0;
    // ฐานคำนวณประกันสังคม: ขั้นต่ำ 1,650 สูงสุด 15,000 บาท
    const ssoWageBase = rawSalary > 0 ? Math.min(Math.max(rawSalary, 1650), 15000) : 0;
    const employeeContribution = r.deductions?.find(
      (d: any) => d.deductionType?.code === 'SSO'
    )?.amount || Math.min(Math.round(ssoWageBase * 0.05), 750);
    const employerContribution = employeeContribution; // อัตราสมทบนายจ้าง 5% เท่ากัน
    const totalContribution = employeeContribution + employerContribution;

    return {
      index: idx + 1,
      idCard: r.employee?.idCardNumber || '-',
      name: `${r.employee?.titleName || ''} ${r.employee?.firstName} ${r.employee?.lastName}`,
      actualWage: rawSalary,
      ssoWageBase,
      employeeContribution,
      employerContribution,
      totalContribution,
    };
  });

  const totalSsoWages = calculatedRows.reduce((acc, r) => acc + r.ssoWageBase, 0);
  const totalEmployeeSSO = calculatedRows.reduce((acc, r) => acc + r.employeeContribution, 0);
  const totalEmployerSSO = calculatedRows.reduce((acc, r) => acc + r.employerContribution, 0);
  const grandTotalSSO = totalEmployeeSSO + totalEmployerSSO;

  const exportCSV = () => {
    if (calculatedRows.length === 0) {
      alert('ไม่มีข้อมูลสำหรับส่งออก');
      return;
    }

    const headers = [
      'ลำดับ',
      'เลขประจำตัวประชาชน',
      'ชื่อ-นามสกุล',
      'ค่าจ้างจริง',
      'ค่าจ้างที่ใช้คำนวณ',
      'เงินสมทบผู้ประกันตน (5%)',
      'เงินสมทบนายจ้าง (5%)',
      'รวมเงินสมทบ',
    ];

    const rows = calculatedRows.map((r) => [
      r.index,
      `"${r.idCard}"`,
      `"${r.name}"`,
      r.actualWage,
      r.ssoWageBase,
      r.employeeContribution,
      r.employerContribution,
      r.totalContribution,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `SSO_1_10_${month}_${year}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Control Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs print:hidden">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            แบบส่งเงินสมทบประกันสังคม (สปส.1-10)
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            รายงานแสดงการส่งเงินสมทบ กองทุนประกันสังคม ประจำเดือน
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
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>ส่งออก CSV</span>
          </button>

          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/20 transition cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>พิมพ์ สปส.1-10</span>
          </button>
        </div>
      </div>

      {/* Warning Notice */}
      <div className="p-4 bg-amber-50 border border-amber-300 rounded-xl flex items-start gap-3 text-xs text-amber-900 print:hidden">
        <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold">ข้อกำหนดการนำส่งเงินสมทบ:</span>{' '}
          นายจ้างมีหน้าที่ยื่นแบบ สปส.1-10 และนำส่งเงินสมทบภายในวันที่ 15 ของเดือนถัดไป
          การคำนวณนี้ใช้ฐานค่าจ้างสูงสุด 15,000 บาท (สมทบไม่เกิน 750 บาท/คน)
          โปรดตรวจสอบความถูกต้องกับสำนักงานประกันสังคมก่อนยื่นจริง
        </div>
      </div>

      {/* Official Form SSO 1-10 Layout */}
      <div className="bg-white p-8 rounded-2xl border border-slate-300 shadow-md max-w-4xl mx-auto print:shadow-none print:border-none print:p-0 print:m-0 text-slate-900 text-xs">
        {/* Header */}
        <div className="text-center pb-4 border-b-2 border-slate-900">
          <div className="text-base font-bold">
            แบบรายการแสดงการส่งเงินสมทบ (สปส. 1-10 ส่วนที่ 2)
          </div>
          <div className="text-xs text-slate-600 mt-0.5">
            กองทุนประกันสังคม กระทรวงแรงงาน
          </div>
          <div className="text-xs font-bold text-blue-900 mt-2">
            ประจำเดือน {THAI_MONTHS[month - 1]} พ.ศ. {year + 543}
          </div>
        </div>

        {/* Company & Social Security Account */}
        <div className="py-3 border-b border-slate-300 flex flex-col sm:flex-row justify-between text-xs">
          <div>
            <div><span className="font-bold">ชื่อสถานประกอบการ:</span> {company?.name}</div>
            <div className="mt-0.5"><span className="font-bold">ที่ตั้ง:</span> {company?.address}</div>
          </div>
          <div className="mt-2 sm:mt-0 text-right">
            <div>
              <span className="font-bold">เลขที่บัญชีนายจ้าง (10 หลัก):</span>{' '}
              <span className="font-mono font-bold text-sm text-blue-950">
                {company?.socialSecurityNo || '1023456789'}
              </span>
            </div>
            <div className="mt-0.5">
              <span className="font-bold">ลำดับที่สาขา:</span>{' '}
              <span className="font-mono">{company?.socialSecurityBranch || '000000'}</span>
            </div>
          </div>
        </div>

        {/* Summary Figures Box (สปส. 1-10 ส่วนที่ 1 ย่อ) */}
        <div className="my-3 p-3 bg-slate-50 border border-slate-300 rounded-lg grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
          <div>
            <span className="text-slate-500">จำนวนผู้ประกันตน:</span>
            <div className="font-bold text-slate-900 mt-0.5">{calculatedRows.length} คน</div>
          </div>
          <div>
            <span className="text-slate-500">เงินสมทบผู้ประกันตน:</span>
            <div className="font-bold text-slate-900 mt-0.5">฿{formatCurrency(totalEmployeeSSO)}</div>
          </div>
          <div>
            <span className="text-slate-500">เงินสมทบนายจ้าง:</span>
            <div className="font-bold text-slate-900 mt-0.5">฿{formatCurrency(totalEmployerSSO)}</div>
          </div>
          <div>
            <span className="text-slate-500">รวมเงินสมทบนำส่ง:</span>
            <div className="font-extrabold text-blue-900 mt-0.5">฿{formatCurrency(grandTotalSSO)}</div>
          </div>
        </div>

        {/* Detailed Employee Table */}
        <div className="py-2">
          <table className="w-full text-left border border-slate-400 border-collapse">
            <thead>
              <tr className="bg-slate-100 text-center font-bold">
                <th className="border border-slate-400 p-2 w-10">ลำดับ</th>
                <th className="border border-slate-400 p-2 w-32">เลขบัตรประชาชน</th>
                <th className="border border-slate-400 p-2">ชื่อ - นามสกุล ผู้ประกันตน</th>
                <th className="border border-slate-400 p-2 w-28 text-right">ค่าจ้างที่ใช้คำนวณ</th>
                <th className="border border-slate-400 p-2 w-24 text-right">ลูกจ้าง (5%)</th>
                <th className="border border-slate-400 p-2 w-24 text-right">นายจ้าง (5%)</th>
                <th className="border border-slate-400 p-2 w-28 text-right">รวมสมทบ</th>
              </tr>
            </thead>
            <tbody>
              {calculatedRows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-6 text-slate-400">
                    ไม่มีข้อมูลผู้ประกันตนในรอบเดือนนี้
                  </td>
                </tr>
              ) : (
                calculatedRows.map((r) => (
                  <tr key={r.index}>
                    <td className="border border-slate-400 p-2 text-center">{r.index}</td>
                    <td className="border border-slate-400 p-2 text-center font-mono">
                      {r.idCard}
                    </td>
                    <td className="border border-slate-400 p-2 font-medium">{r.name}</td>
                    <td className="border border-slate-400 p-2 text-right font-mono">
                      {formatCurrency(r.ssoWageBase)}
                    </td>
                    <td className="border border-slate-400 p-2 text-right font-mono">
                      {formatCurrency(r.employeeContribution)}
                    </td>
                    <td className="border border-slate-400 p-2 text-right font-mono">
                      {formatCurrency(r.employerContribution)}
                    </td>
                    <td className="border border-slate-400 p-2 text-right font-mono font-bold text-slate-950">
                      {formatCurrency(r.totalContribution)}
                    </td>
                  </tr>
                ))
              )}

              {/* Grand Total */}
              <tr className="bg-slate-100 font-bold">
                <td colSpan={3} className="border border-slate-400 p-2 text-right">
                  รวมทั้งสิ้น
                </td>
                <td className="border border-slate-400 p-2 text-right font-mono">
                  {formatCurrency(totalSsoWages)}
                </td>
                <td className="border border-slate-400 p-2 text-right font-mono">
                  {formatCurrency(totalEmployeeSSO)}
                </td>
                <td className="border border-slate-400 p-2 text-right font-mono">
                  {formatCurrency(totalEmployerSSO)}
                </td>
                <td className="border border-slate-400 p-2 text-right font-mono text-sm text-blue-900">
                  {formatCurrency(grandTotalSSO)}
                </td>
              </tr>
              <tr className="bg-slate-50 font-bold">
                <td colSpan={7} className="border border-slate-400 p-2">
                  รวมเงินสมทบทั้งสิ้น (ตัวอักษร): {bahtText(grandTotalSSO)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Footer Signature */}
        <div className="grid grid-cols-2 gap-8 pt-6 mt-4 border-t border-slate-300 text-center text-xs">
          <div className="text-left text-slate-500 space-y-1">
            <div>ผู้จัดทำ: ฝ่ายบุคคลและเงินเดือน</div>
            <div>โทรศัพท์: {company?.phone || '-'}</div>
          </div>
          <div>
            <div className="h-10"></div>
            <div>ลงชื่อ............................................................ นายจ้าง/ผู้รับมอบอำนาจ</div>
            <div className="font-bold mt-1">({company?.authorizedSignatory || 'ผู้มีอำนาจลงนาม'})</div>
            <div className="text-slate-500">วันที่ {formatThaiDateFull(new Date())}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

