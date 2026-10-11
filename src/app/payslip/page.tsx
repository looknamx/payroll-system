'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Printer,
  Calendar,
} from 'lucide-react';
import {
  formatCurrency,
  formatThaiDateNumeric,
  formatThaiDateFull,
  THAI_MONTHS,
  bahtText,
} from '@/lib/utils';

function PayslipContent() {
  const searchParams = useSearchParams();
  const initialRecordId = searchParams.get('recordId');

  const [month, setMonth] = useState<number>(10);
  const [year, setYear] = useState<number>(2026);
  const [records, setRecords] = useState<any[]>([]);
  const [selectedRecordId, setSelectedRecordId] = useState<string>(initialRecordId || '');
  const [currentRecord, setCurrentRecord] = useState<any>(null);
  const [company, setCompany] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/settings')
      .then((res) => res.json())
      .then((data) => {
        if (data.company) setCompany(data.company);
      });
  }, []);

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/dashboard?month=${month}&year=${year}`);
      const data = await res.json();
      if (data.period?.id) {
        const recRes = await fetch(`/api/payroll/records?periodId=${data.period.id}`);
        const recData = await recRes.json();
        setRecords(Array.isArray(recData) ? recData : []);

        if (initialRecordId) {
          setSelectedRecordId(initialRecordId);
        } else if (recData.length > 0 && !selectedRecordId) {
          setSelectedRecordId(String(recData[0].id));
        }
      } else {
        setRecords([]);
        setCurrentRecord(null);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, [month, year]);

  useEffect(() => {
    if (selectedRecordId) {
      fetch(`/api/payroll/records/${selectedRecordId}`)
        .then((res) => res.json())
        .then((data) => {
          if (!data.error) setCurrentRecord(data);
        });
    }
  }, [selectedRecordId]);

  return (
    <div className="space-y-6">
      {/* Control Bar (Hidden when printing) */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs print:hidden">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">สลิปเงินเดือน</h1>
          <p className="text-sm text-slate-500 mt-1">
            พิมพ์หรือดูใบแจ้งยอดเงินเดือนรายบุคคล (Pay Slip)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Period selector */}
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

          {/* Employee selector */}
          <div className="flex items-center gap-2">
            <select
              value={selectedRecordId}
              onChange={(e) => setSelectedRecordId(e.target.value)}
              className="py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 outline-none cursor-pointer max-w-xs truncate"
            >
              {records.length === 0 && <option value="">ไม่มีรายการเงินเดือนในรอบนี้</option>}
              {records.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.employee?.employeeCode} - {r.employee?.firstName} {r.employee?.lastName}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => window.print()}
            disabled={!currentRecord}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-md shadow-blue-600/20 transition cursor-pointer disabled:opacity-50"
          >
            <Printer className="w-4 h-4" />
            <span>พิมพ์สลิปเงินเดือน</span>
          </button>
        </div>
      </div>

      {/* Payslip Document Preview */}
      {!currentRecord ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center text-slate-400">
          กรุณาเลือกรอบเงินเดือนและพนักงานที่ต้องการดูสลิปเงินเดือน
        </div>
      ) : (
        <div className="bg-white p-8 sm:p-10 rounded-2xl border border-slate-300 shadow-md max-w-4xl mx-auto print:shadow-none print:border-none print:p-0 print:m-0 text-slate-800">
          {/* Payslip Header */}
          <div className="border-b-2 border-slate-900 pb-5">
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
              <div>
                <h2 className="text-xl font-extrabold text-slate-950 tracking-tight">
                  {company?.name || 'บริษัท สยามพาณิชย์ อินโนเวชั่น จำกัด'}
                </h2>
                <div className="text-xs text-slate-600 mt-1 max-w-lg">
                  {company?.address || '888 อาคารเพลินจิตทาวเวอร์ แขวงคลองเตย เขตคลองเตย กรุงเทพมหานคร'}
                </div>
                <div className="text-xs text-slate-500 mt-0.5">
                  เลขประจำตัวผู้เสียภาษี: {company?.taxId || '0105556012345'} | เลขที่ สปส:{' '}
                  {company?.socialSecurityNo || '1023456789'}
                </div>
              </div>

              <div className="text-right sm:border-l-2 sm:border-slate-200 sm:pl-6">
                <div className="text-lg font-black tracking-wider text-slate-900 uppercase">
                  ใบแจ้งยอดเงินเดือน
                </div>
                <div className="text-xs font-semibold text-slate-500 tracking-widest uppercase">
                  PAY SLIP
                </div>
                <div className="mt-2 text-xs font-bold text-blue-900 bg-blue-50 px-2.5 py-1 rounded-md inline-block">
                  งวดประจำ: {currentRecord.payrollPeriod?.name || `${THAI_MONTHS[month - 1]} ${year + 543}`}
                </div>
              </div>
            </div>
          </div>

          {/* Employee Info Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-4 text-xs border-b border-slate-200 bg-slate-50/60 p-3 rounded-lg my-4">
            <div>
              <span className="text-slate-500">รหัสพนักงาน:</span>
              <div className="font-bold text-slate-900 text-sm">
                {currentRecord.employee?.employeeCode}
              </div>
            </div>
            <div>
              <span className="text-slate-500">ชื่อ - นามสกุล:</span>
              <div className="font-bold text-slate-900 text-sm">
                {currentRecord.employee?.titleName} {currentRecord.employee?.firstName}{' '}
                {currentRecord.employee?.lastName}
              </div>
            </div>
            <div>
              <span className="text-slate-500">แผนก:</span>
              <div className="font-semibold text-slate-800">
                {currentRecord.employee?.department?.name || '-'}
              </div>
            </div>
            <div>
              <span className="text-slate-500">ตำแหน่ง:</span>
              <div className="font-semibold text-slate-800">
                {currentRecord.employee?.position?.name || '-'}
              </div>
            </div>
            <div>
              <span className="text-slate-500">เลขประจำตัวประชาชน:</span>
              <div className="font-mono text-slate-700">
                {currentRecord.employee?.idCardNumber || '-'}
              </div>
            </div>
            <div>
              <span className="text-slate-500">บัญชีธนาคาร:</span>
              <div className="font-mono text-slate-700">
                {currentRecord.employee?.bankAccount || '-'}
              </div>
            </div>
            <div>
              <span className="text-slate-500">ธนาคาร:</span>
              <div className="text-slate-700">{currentRecord.employee?.bankName || '-'}</div>
            </div>
            <div>
              <span className="text-slate-500">วันที่จ่ายเงิน:</span>
              <div className="font-semibold text-slate-900">
                {formatThaiDateNumeric(currentRecord.payrollPeriod?.payDate)}
              </div>
            </div>
          </div>

          {/* Incomes and Deductions Two-Column Table */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-4">
            {/* Income Column */}
            <div className="border border-slate-300 rounded-xl overflow-hidden flex flex-col justify-between">
              <div>
                <div className="bg-slate-100 px-4 py-2 text-xs font-bold text-slate-900 uppercase border-b border-slate-300 flex justify-between">
                  <span>รายการเงินได้ (Earnings)</span>
                  <span>จำนวนเงิน (บาท)</span>
                </div>
                <div className="p-3 space-y-2 text-xs">
                  {currentRecord.incomes?.length > 0 ? (
                    currentRecord.incomes.map((inc: any) => (
                      <div key={inc.id} className="flex justify-between items-center py-1">
                        <div>
                          <span className="font-medium text-slate-800">{inc.incomeType?.name}</span>
                          {inc.note && (
                            <span className="text-[10px] text-slate-400 ml-1.5">({inc.note})</span>
                          )}
                        </div>
                        <span className="font-mono font-semibold text-slate-900">
                          {formatCurrency(inc.amount)}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="flex justify-between items-center py-1">
                      <span className="text-slate-700">เงินเดือนฐาน</span>
                      <span className="font-mono font-semibold text-slate-900">
                        {formatCurrency(currentRecord.baseSalary)}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-slate-50 border-t border-slate-200 px-4 py-2.5 flex justify-between items-center text-xs font-bold text-slate-900">
                <span>รวมเงินได้ (Total Earnings)</span>
                <span className="font-mono text-sm text-slate-950">
                  ฿{formatCurrency(currentRecord.totalIncome)}
                </span>
              </div>
            </div>

            {/* Deduction Column */}
            <div className="border border-slate-300 rounded-xl overflow-hidden flex flex-col justify-between">
              <div>
                <div className="bg-slate-100 px-4 py-2 text-xs font-bold text-slate-900 uppercase border-b border-slate-300 flex justify-between">
                  <span>รายการเงินหัก (Deductions)</span>
                  <span>จำนวนเงิน (บาท)</span>
                </div>
                <div className="p-3 space-y-2 text-xs">
                  {currentRecord.deductions?.length > 0 ? (
                    currentRecord.deductions.map((ded: any) => (
                      <div key={ded.id} className="flex justify-between items-center py-1">
                        <div>
                          <span className="font-medium text-slate-800">
                            {ded.deductionType?.name}
                          </span>
                          {ded.note && (
                            <span className="text-[10px] text-slate-400 ml-1.5">({ded.note})</span>
                          )}
                        </div>
                        <span className="font-mono font-semibold text-rose-600">
                          {formatCurrency(ded.amount)}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-3 text-slate-400 text-xs">ไม่มีรายการเงินหัก</div>
                  )}
                </div>
              </div>

              <div className="bg-slate-50 border-t border-slate-200 px-4 py-2.5 flex justify-between items-center text-xs font-bold text-slate-900">
                <span>รวมเงินหัก (Total Deductions)</span>
                <span className="font-mono text-sm text-rose-600">
                  ฿{formatCurrency(currentRecord.totalDeduction)}
                </span>
              </div>
            </div>
          </div>

          {/* Net Pay Grand Total Banner */}
          <div className="bg-gradient-to-r from-blue-900 to-slate-900 text-white rounded-xl p-5 my-5 flex flex-col sm:flex-row justify-between items-center gap-3">
            <div>
              <div className="text-xs font-medium text-blue-200 uppercase tracking-wider">
                ยอดเงินได้สุทธิ / NET PAY
              </div>
              <div className="text-sm text-slate-300 mt-1">
                ({bahtText(currentRecord.netPay)})
              </div>
            </div>
            <div className="text-3xl font-extrabold tracking-tight font-mono text-white">
              ฿{formatCurrency(currentRecord.netPay)}
            </div>
          </div>

          {/* Signatures */}
          <div className="grid grid-cols-2 gap-8 pt-8 mt-6 border-t border-slate-300 text-center text-xs text-slate-600">
            <div>
              <div className="h-14 border-b border-slate-400 border-dashed max-w-[200px] mx-auto"></div>
              <div className="mt-2 font-medium">ลงชื่อ......................................................</div>
              <div className="font-semibold text-slate-800 mt-0.5">
                ({company?.authorizedSignatory || 'ผู้มีอำนาจลงนาม'})
              </div>
              <div className="text-[11px] text-slate-500">นายจ้าง / ผู้จ่ายเงิน</div>
            </div>

            <div>
              <div className="h-14 border-b border-slate-400 border-dashed max-w-[200px] mx-auto"></div>
              <div className="mt-2 font-medium">ลงชื่อ......................................................</div>
              <div className="font-semibold text-slate-800 mt-0.5">
                ({currentRecord.employee?.titleName} {currentRecord.employee?.firstName}{' '}
                {currentRecord.employee?.lastName})
              </div>
              <div className="text-[11px] text-slate-500">พนักงาน / ผู้รับเงิน</div>
            </div>
          </div>

          {/* Footer notice */}
          <div className="mt-8 pt-4 border-t border-slate-100 text-[10px] text-slate-400 text-center">
            เอกสารนี้สร้างขึ้นจากระบบบริหารงานเงินเดือนอัตโนมัติ (Payroll Pro) • วันที่ออกเอกสาร:{' '}
            {formatThaiDateFull(new Date())}
          </div>
        </div>
      )}
    </div>
  );
}

export default function PayslipPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-400">กำลังโหลดข้อมูลสลิปเงินเดือน...</div>}>
      <PayslipContent />
    </Suspense>
  );
}
