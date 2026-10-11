import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { THAI_MONTHS } from '@/lib/utils';

export async function GET() {
  try {
    const periods = await prisma.payrollPeriod.findMany({
      include: {
        records: {
          include: {
            employee: {
              include: { department: true, position: true },
            },
          },
        },
      },
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
    });
    return NextResponse.json(periods);
  } catch (error) {
    console.error('Payroll Periods GET Error:', error);
    return NextResponse.json({ error: 'ไม่สามารถดึงข้อมูลรอบเงินเดือนได้' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { month, year, payDate } = body;

    const m = parseInt(month);
    const y = parseInt(year);

    const existing = await prisma.payrollPeriod.findUnique({
      where: { month_year: { month: m, year: y } },
    });

    if (existing) {
      return NextResponse.json({ error: 'รอบเงินเดือนนี้ถูกสร้างไว้แล้ว' }, { status: 400 });
    }

    const name = `${THAI_MONTHS[m - 1]} ${y + 543}`;
    const startDate = new Date(y, m - 1, 1);
    const endDate = new Date(y, m, 0, 23, 59, 59);

    const period = await prisma.payrollPeriod.create({
      data: {
        month: m,
        year: y,
        name,
        startDate,
        endDate,
        payDate: payDate ? new Date(payDate) : new Date(y, m - 1, 30),
        status: 'DRAFT',
      },
    });

    return NextResponse.json(period, { status: 201 });
  } catch (error) {
    console.error('Payroll Periods POST Error:', error);
    return NextResponse.json({ error: 'ไม่สามารถสร้างรอบเงินเดือนได้' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, status } = body;

    if (!id || !status) {
      return NextResponse.json({ error: 'กรุณาระบุรหัสรอบและสถานะ' }, { status: 400 });
    }

    const updated = await prisma.payrollPeriod.update({
      where: { id: parseInt(id) },
      data: { status },
      include: { records: true },
    });

    // อัปเดตสถานะ record ข้างในด้วย
    if (status === 'PAID') {
      await prisma.payrollRecord.updateMany({
        where: { payrollPeriodId: parseInt(id) },
        data: { status: 'PAID' },
      });
    } else if (status === 'VERIFIED') {
      await prisma.payrollRecord.updateMany({
        where: { payrollPeriodId: parseInt(id) },
        data: { status: 'VERIFIED' },
      });
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Payroll Periods PATCH Error:', error);
    return NextResponse.json({ error: 'ไม่สามารถอัปเดตสถานะรอบเงินเดือนได้' }, { status: 500 });
  }
}

