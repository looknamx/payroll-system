'use client';

import React, { useState, useEffect } from 'react';
import {
  FileBadge,
  Printer,
  Download,
  AlertTriangle,
  Calendar,
} from 'lucide-react';
import {
  formatCurrency,
  formatThaiDateNumeric,
  formatThaiDateFull,
  THAI_MONTHS,
  bahtText,
} from '@/lib/utils';

export default function Pnd1ReportPage() {
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

  const totalIncome = records.reduce((acc, r) => acc + (r.totalIncome || 0), 0);
  const totalTax = records.reduce((acc, r) => {
    const tax = r.deductions?.find((d: any) => d.deductionType?.code === 'TAX')?.amount || 0;
    return acc + tax;
  }, 0);

  const exportCSV = () => {
    if (records.length === 0) {
      alert('ไม่มีข้อมูลสำหรับส่งออก');
      return;
    }

    const headers = [
      'ลำดับ',
      'เลขประจำตัวประชาชน',
      'ชื่อ-นามสกุล',
      'วันเดือนปีที่จ่าย',
      'จำนวนเงินที่จ่าย',
      'ภาษีที่หักและนำส่ง',
    ];

    const rows = records.map((r, idx) => {
      const tax = r.deductions?.find((d: any) => d.deductionType?.code === 'TAX')?.amount || 0;
      return [
        idx + 1,
        `"${r.employee?.idCardNumber || '-'}"`,
        `"${r.employee?.firstName} ${r.employee?.lastName}"`,
        formatThaiDateNumeric(r.payrollPeriod?.payDate),
        r.totalIncome,
        tax,
      ];
    });

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `PND1_${month}_${year}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Control Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs print:hidden">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">แบบ ภ.ง.ด.1</h1>
          <p className="text-sm text-slate-500 mt-1">
            ใบแนบแบบยื่นรายการภาษีเงินได้หัก ณ ที่จ่าย ประจำเดือน
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
            <span>พิมพ์ ภ.ง.ด.1</span>
          </button>
        </div>
      </div>

      {/* Warning Notice */}
      <div className="p-4 bg-amber-50 border border-amber-300 rounded-xl flex items-start gap-3 text-xs text-amber-900 print:hidden">
        <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold">ข้อกำหนดการยื่นภาษี:</span>{' '}
          รายงานนี้สร้างขึ้นตามข้อมูลเงินเดือนประจำงวดเพื่อเตรียมยื่นแบบ ภ.ง.ด.1 ต่อกรมสรรพากร
          ภายในวันที่ 7 (หรือวันที่ 15 สำหรับยื่นออนไลน์) ของเดือนถัดไป
          โปรดตรวจสอบยอดเงินรวมและภาษีนำส่งกับฝ่ายบัญชีก่อนยื่นจริง
        </div>
      </div>

      {/* Form P.N.D. 1 Printable Layout */}
      <div className="bg-white p-8 rounded-2xl border border-slate-300 shadow-md max-w-4xl mx-auto print:shadow-none print:border-none print:p-0 print:m-0 text-slate-900 text-xs">
        {/* Header */}
        <div className="text-center pb-4 border-b-2 border-slate-900">
          <div className="text-base font-bold">
            ใบแนบ ภ.ง.ด.1
          </div>
          <div className="text-xs text-slate-600 mt-0.5">
            รายละเอียดการจ่ายเงินได้พึงประเมินตามมาตรา 40 (1) และภาษีเงินได้หัก ณ ที่จ่าย
          </div>
          <div className="text-xs font-bold text-blue-900 mt-2">
            ประจำเดือน {THAI_MONTHS[month - 1]} พ.ศ. {year + 543}
          </div>
        </div>

        {/* Company Info */}
        <div className="py-3 border-b border-slate-300 flex flex-col sm:flex-row justify-between text-xs">
          <div>
            <div><span className="font-bold">ชื่อผู้มีหน้าที่หักภาษี:</span> {company?.name}</div>
            <div className="mt-0.5"><span className="font-bold">ที่อยู่:</span> {company?.address}</div>
          </div>
          <div className="mt-2 sm:mt-0 text-right">
            <div><span className="font-bold">เลขประจำตัวผู้เสียภาษีอากร:</span> <span className="font-mono">{company?.taxId}</span></div>
            <div className="mt-0.5"><span className="font-bold">สาขาที่:</span> 00000 (สำนักงานใหญ่)</div>
          </div>
        </div>

        {/* Employee Table */}
        <div className="py-4">
          <table className="w-full text-left border border-slate-400 border-collapse">
            <thead>
              <tr className="bg-slate-100 text-center font-bold">
                <th className="border border-slate-400 p-2 w-12">ลำดับ</th>
                <th className="border border-slate-400 p-2 w-36">เลขประจำตัวประชาชน</th>
                <th className="border border-slate-400 p-2">ชื่อ - นามสกุล ผู้มีเงินได้</th>
                <th className="border border-slate-400 p-2 w-28">วันเดือนปีที่จ่าย</th>
                <th className="border border-slate-400 p-2 w-32 text-right">จำนวนเงินได้ (บาท)</th>
                <th className="border border-slate-400 p-2 w-32 text-right">ภาษีที่หัก (บาท)</th>
              </tr>
            </thead>
            <tbody>
              {records.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-6 text-slate-400">
                    ไม่มีรายการในรอบเดือนนี้
                  </td>
                </tr>
              ) : (
                records.map((r, idx) => {
                  const tax = r.deductions?.find((d: any) => d.deductionType?.code === 'TAX')?.amount || 0;
                  return (
                    <tr key={r.id}>
                      <td className="border border-slate-400 p-2 text-center">{idx + 1}</td>
                      <td className="border border-slate-400 p-2 text-center font-mono">
                        {r.employee?.idCardNumber || '-'}
                      </td>
                      <td className="border border-slate-400 p-2 font-medium">
                        {r.employee?.titleName} {r.employee?.firstName} {r.employee?.lastName}
                      </td>
                      <td className="border border-slate-400 p-2 text-center">
                        {formatThaiDateNumeric(r.payrollPeriod?.payDate)}
                      </td>
                      <td className="border border-slate-400 p-2 text-right font-mono">
                        {formatCurrency(r.totalIncome)}
                      </td>
                      <td className="border border-slate-400 p-2 text-right font-mono font-semibold text-rose-700">
                        {formatCurrency(tax)}
                      </td>
                    </tr>
                  );
                })
              )}

              {/* Total Row */}
              <tr className="bg-slate-100 font-bold">
                <td colSpan={4} className="border border-slate-400 p-2 text-right">
                  รวมยอดเงินได้และภาษีที่หักนำส่งทั้งสิ้น
                </td>
                <td className="border border-slate-400 p-2 text-right font-mono text-sm">
                  {formatCurrency(totalIncome)}
                </td>
                <td className="border border-slate-400 p-2 text-right font-mono text-sm text-rose-700">
                  {formatCurrency(totalTax)}
                </td>
              </tr>
              <tr className="bg-slate-50 font-bold">
                <td colSpan={6} className="border border-slate-400 p-2">
                  รวมเงินภาษีที่นำส่งทั้งสิ้น (ตัวอักษร): {bahtText(totalTax)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Footer Signature */}
        <div className="grid grid-cols-2 gap-8 pt-6 mt-4 border-t border-slate-300 text-center text-xs">
          <div className="text-left text-slate-500">
            จำนวนพนักงานทั้งหมด {records.length} ราย
          </div>
          <div>
            <div className="h-10"></div>
            <div>ลงชื่อ............................................................ ผู้มีอำนาจลงนาม</div>
            <div className="font-bold mt-1">({company?.authorizedSignatory || 'ผู้มีอำนาจลงนาม'})</div>
            <div className="text-slate-500">วันที่ {formatThaiDateFull(new Date())}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

