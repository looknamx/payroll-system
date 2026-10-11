import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const record = await prisma.payrollRecord.findUnique({
      where: { id: parseInt(id) },
      include: {
        employee: {
          include: { department: true, position: true, employmentType: true },
        },
        incomes: { include: { incomeType: true } },
        deductions: { include: { deductionType: true } },
        histories: { orderBy: { createdAt: 'desc' } },
        payrollPeriod: true,
      },
    });

    if (!record) {
      return NextResponse.json({ error: 'ไม่พบรายการเงินเดือน' }, { status: 404 });
    }

    return NextResponse.json(record);
  } catch (error) {
    console.error('Payroll Record GET ID Error:', error);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดในการดึงข้อมูล' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const recordId = parseInt(id);
    const body = await request.json();
    const { incomes, deductions, note, status, reason } = body;

    const currentRecord = await prisma.payrollRecord.findUnique({
      where: { id: recordId },
      include: { incomes: true, deductions: true },
    });

    if (!currentRecord) {
      return NextResponse.json({ error: 'ไม่พบรายการเงินเดือน' }, { status: 404 });
    }

    // คำนวณยอดเงินได้และเงินหักใหม่
    let newTotalIncome = 0;
    let newTotalDeduction = 0;

    // อัปเดตรายการเงินได้
    if (incomes && Array.isArray(incomes)) {
      await prisma.payrollIncome.deleteMany({ where: { payrollRecordId: recordId } });
      for (const inc of incomes) {
        const amt = parseFloat(inc.amount) || 0;
        newTotalIncome += amt;
        await prisma.payrollIncome.create({
          data: {
            payrollRecordId: recordId,
            incomeTypeId: parseInt(inc.incomeTypeId),
            amount: amt,
            note: inc.note || null,
          },
        });
      }
    } else {
      newTotalIncome = currentRecord.totalIncome;
    }

    // อัปเดตรายการเงินหัก
    if (deductions && Array.isArray(deductions)) {
      await prisma.payrollDeduction.deleteMany({ where: { payrollRecordId: recordId } });
      for (const ded of deductions) {
        const amt = parseFloat(ded.amount) || 0;
        newTotalDeduction += amt;
        await prisma.payrollDeduction.create({
          data: {
            payrollRecordId: recordId,
            deductionTypeId: parseInt(ded.deductionTypeId),
            amount: amt,
            note: ded.note || null,
          },
        });
      }
    } else {
      newTotalDeduction = currentRecord.totalDeduction;
    }

    const netPay = Math.round((newTotalIncome - newTotalDeduction) * 100) / 100;

    // บันทึกการแก้ไข
    const updated = await prisma.payrollRecord.update({
      where: { id: recordId },
      data: {
        totalIncome: Math.round(newTotalIncome * 100) / 100,
        totalDeduction: Math.round(newTotalDeduction * 100) / 100,
        netPay,
        note: note !== undefined ? note : currentRecord.note,
        status: status || currentRecord.status,
      },
      include: {
        employee: true,
        incomes: { include: { incomeType: true } },
        deductions: { include: { deductionType: true } },
      },
    });

    // บันทึก Audit History
    await prisma.payrollHistory.create({
      data: {
        payrollRecordId: recordId,
        action: 'UPDATE',
        description: reason || 'แก้ไขรายการเงินเดือนด้วยตนเอง',
        previousData: JSON.stringify({
          totalIncome: currentRecord.totalIncome,
          totalDeduction: currentRecord.totalDeduction,
          netPay: currentRecord.netPay,
        }),
        newData: JSON.stringify({
          totalIncome: updated.totalIncome,
          totalDeduction: updated.totalDeduction,
          netPay: updated.netPay,
        }),
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Payroll Record PUT Error:', error);
    return NextResponse.json({ error: 'ไม่สามารถอัปเดตรายการเงินเดือนได้' }, { status: 500 });
  }
}

