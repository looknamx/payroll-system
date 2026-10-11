import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const periodId = searchParams.get('periodId');
    const employeeId = searchParams.get('employeeId');

    const where: any = {};
    if (periodId) where.payrollPeriodId = parseInt(periodId);
    if (employeeId) where.employeeId = parseInt(employeeId);

    const records = await prisma.payrollRecord.findMany({
      where,
      include: {
        employee: {
          include: { department: true, position: true, employmentType: true },
        },
        incomes: { include: { incomeType: true } },
        deductions: { include: { deductionType: true } },
        histories: { orderBy: { createdAt: 'desc' } },
        payrollPeriod: true,
      },
      orderBy: { employee: { employeeCode: 'asc' } },
    });

    return NextResponse.json(records);
  } catch (error) {
    console.error('Payroll Records GET Error:', error);
    return NextResponse.json({ error: 'ไม่สามารถดึงข้อมูลรายการเงินเดือนได้' }, { status: 500 });
  }
}

