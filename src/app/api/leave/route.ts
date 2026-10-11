import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const employeeId = searchParams.get('employeeId');
    const status = searchParams.get('status');

    const where: any = {};
    if (employeeId) where.employeeId = parseInt(employeeId);
    if (status) where.status = status;

    const [leaveRequests, leaveTypes] = await Promise.all([
      prisma.leaveRequest.findMany({
        where,
        include: {
          employee: { include: { department: true } },
          leaveType: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.leaveType.findMany({
        where: { isActive: true },
      }),
    ]);

    return NextResponse.json({ leaveRequests, leaveTypes });
  } catch (error) {
    console.error('Leave GET Error:', error);
    return NextResponse.json({ error: 'ไม่สามารถดึงข้อมูลการลาได้' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { employeeId, leaveTypeId, startDate, endDate, totalDays, reason } = body;

    if (!employeeId || !leaveTypeId || !startDate || !endDate) {
      return NextResponse.json({ error: 'กรุณากรอกข้อมูลการลาให้ครบถ้วน' }, { status: 400 });
    }

    const leave = await prisma.leaveRequest.create({
      data: {
        employeeId: parseInt(employeeId),
        leaveTypeId: parseInt(leaveTypeId),
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        totalDays: totalDays ? parseFloat(totalDays) : 1,
        reason: reason || null,
        status: 'PENDING',
      },
      include: {
        employee: true,
        leaveType: true,
      },
    });

    return NextResponse.json(leave, { status: 201 });
  } catch (error) {
    console.error('Leave POST Error:', error);
    return NextResponse.json({ error: 'ไม่สามารถสร้างคำขอลาได้' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, status, approvedBy } = body;

    if (!id || !status) {
      return NextResponse.json({ error: 'กรุณาระบุรหัสคำขอและสถานะ' }, { status: 400 });
    }

    const updated = await prisma.leaveRequest.update({
      where: { id: parseInt(id) },
      data: {
        status,
        approvedBy: approvedBy || 'ฝ่ายบุคคล',
      },
      include: {
        employee: true,
        leaveType: true,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Leave PATCH Error:', error);
    return NextResponse.json({ error: 'ไม่สามารถปรับสถานะคำขอลาได้' }, { status: 500 });
  }
}

