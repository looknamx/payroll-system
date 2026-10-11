import type { Metadata } from 'next';
import './globals.css';
import Sidebar from '@/components/Sidebar';

export const metadata: Metadata = {
  title: 'ระบบเงินเดือนและจัดการพนักงาน (Payroll Management System)',
  description: 'ระบบจัดการข้อมูลพนักงาน บันทึกเวลา คำนวณเงินเดือน และจัดทำรายงานเอกสารภาษี/ประกันสังคม',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="th" className="h-full">
      <body className="min-h-full flex bg-slate-50 text-slate-800 font-sans antialiased">
        <Sidebar />
        <div className="flex-1 flex flex-col lg:pl-72 min-w-0 min-h-screen">
          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
