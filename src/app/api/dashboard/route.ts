import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month') ? parseInt(searchParams.get('month')!) : 10;
    const year = searchParams.get('year') ? parseInt(searchParams.get('year')!) : 2026;

    // ข้อมูลพนักงาน
    const totalEmployees = await prisma.employee.count({
      where: { status: 'ACTIVE' },
    });
    const monthlyEmployees = await prisma.employee.count({
      where: {
        status: 'ACTIVE',
        employmentType: { code: 'MONTHLY' },
      },
    });
    const dailyEmployees = await prisma.employee.count({
      where: {
        status: 'ACTIVE',
        employmentType: { code: 'DAILY' },
      },
    });

    // พนักงานที่ข้อมูลยังไม่ครบ
    const incompleteEmployees = await prisma.employee.count({
      where: {
        status: 'ACTIVE',
        OR: [
          { idCardNumber: null },
          { idCardNumber: '' },
          { bankAccount: null },
          { bankAccount: '' },
          { departmentId: null },
        ],
      },
    });

    // รอบเงินเดือนที่เลือก
    const period = await prisma.payrollPeriod.findUnique({
      where: {
        month_year: { month, year },
      },
      include: {
        records: {
          include: {
            employee: {
              include: { department: true },
            },
          },
        },
      },
    });

    // สรุปยอดเงินเดือนของรอบที่เลือก
    let totalIncome = 0;
    let totalDeduction = 0;
    let netPay = 0;
    let totalBaseSalary = 0;
    let departmentSummaries: Record<string, { count: number; totalNet: number; totalIncome: number }> = {};

    if (period && period.records.length > 0) {
      for (const rec of period.records) {
        totalIncome += rec.totalIncome;
        totalDeduction += rec.totalDeduction;
        netPay += rec.netPay;
        totalBaseSalary += rec.baseSalary;

        const deptName = rec.employee.department?.name || 'ไม่ระบุแผนก';
        if (!departmentSummaries[deptName]) {
          departmentSummaries[deptName] = { count: 0, totalNet: 0, totalIncome: 0 };
        }
        departmentSummaries[deptName].count += 1;
        departmentSummaries[deptName].totalNet += rec.netPay;
        departmentSummaries[deptName].totalIncome += rec.totalIncome;
      }
    } else {
      const activeEmps = await prisma.employee.findMany({
        where: { status: 'ACTIVE' },
      });
      totalBaseSalary = activeEmps.reduce((acc, emp) => acc + (emp.salary || 0), 0);
    }

    const pendingLeaves = await prisma.leaveRequest.count({
      where: { status: 'PENDING' },
    });

    const pendingAdvances = await prisma.advance.count({
      where: { status: 'PENDING' },
    });

    const availablePeriods = await prisma.payrollPeriod.findMany({
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
      take: 12,
    });

    return NextResponse.json({
      period,
      stats: {
        totalEmployees,
        monthlyEmployees,
        dailyEmployees,
        incompleteEmployees,
        totalIncome,
        totalDeduction,
        netPay,
        totalBaseSalary,
        pendingLeaves,
        pendingAdvances,
      },
      departmentSummaries,
      availablePeriods,
    });
  } catch (error) {
    console.error('Dashboard API Error:', error);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดในการดึงข้อมูลแดชบอร์ด' }, { status: 500 });
  }
}
