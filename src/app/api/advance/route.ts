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

    const advances = await prisma.advance.findMany({
      where,
      include: {
        employee: { include: { department: true } },
      },
      orderBy: { requestDate: 'desc' },
    });

    return NextResponse.json(advances);
  } catch (error) {
    console.error('Advance GET Error:', error);
    return NextResponse.json({ error: 'ไม่สามารถดึงข้อมูลการเบิกล่วงหน้าได้' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { employeeId, amount, requestDate, reason } = body;

    if (!employeeId || !amount) {
      return NextResponse.json({ error: 'กรุณาระบุพนักงานและจำนวนเงิน' }, { status: 400 });
    }

    const advance = await prisma.advance.create({
      data: {
        employeeId: parseInt(employeeId),
        amount: parseFloat(amount),
        requestDate: requestDate ? new Date(requestDate) : new Date(),
        reason: reason || null,
        status: 'APPROVED',
      },
      include: { employee: true },
    });

    return NextResponse.json(advance, { status: 201 });
  } catch (error) {
    console.error('Advance POST Error:', error);
    return NextResponse.json({ error: 'ไม่สามารถบันทึกรายการเบิกล่วงหน้าได้' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, status } = body;

    const updated = await prisma.advance.update({
      where: { id: parseInt(id) },
      data: { status },
      include: { employee: true },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Advance PATCH Error:', error);
    return NextResponse.json({ error: 'ไม่สามารถอัปเดตสถานะการเบิกได้' }, { status: 500 });
  }
}

