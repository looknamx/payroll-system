import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const resignations = await prisma.resignation.findMany({
      include: {
        employee: {
          include: { department: true, position: true },
        },
      },
      orderBy: { resignDate: 'desc' },
    });
    return NextResponse.json(resignations);
  } catch (error) {
    console.error('Resignation GET Error:', error);
    return NextResponse.json({ error: 'ไม่สามารถดึงข้อมูลการลาออกได้' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { employeeId, noticeDate, resignDate, lastWorkingDate, reason, updateEmployeeStatus } = body;

    if (!employeeId || !resignDate || !lastWorkingDate) {
      return NextResponse.json({ error: 'กรุณาระบุข้อมูลการลาออกให้ครบถ้วน' }, { status: 400 });
    }

    const empId = parseInt(employeeId);

    const resignation = await prisma.resignation.upsert({
      where: { employeeId: empId },
      update: {
        noticeDate: noticeDate ? new Date(noticeDate) : new Date(),
        resignDate: new Date(resignDate),
        lastWorkingDate: new Date(lastWorkingDate),
        reason: reason || null,
        status: 'APPROVED',
      },
      create: {
        employeeId: empId,
        noticeDate: noticeDate ? new Date(noticeDate) : new Date(),
        resignDate: new Date(resignDate),
        lastWorkingDate: new Date(lastWorkingDate),
        reason: reason || null,
        status: 'APPROVED',
      },
      include: { employee: true },
    });

    if (updateEmployeeStatus) {
      await prisma.employee.update({
        where: { id: empId },
        data: {
          status: 'RESIGNED',
          resignDate: new Date(resignDate),
        },
      });
    }

    return NextResponse.json(resignation, { status: 201 });
  } catch (error) {
    console.error('Resignation POST Error:', error);
    return NextResponse.json({ error: 'ไม่สามารถบันทึกการลาออกได้' }, { status: 500 });
  }
}

