import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const dateStr = searchParams.get('date');
    const employeeId = searchParams.get('employeeId');
    const month = searchParams.get('month');
    const year = searchParams.get('year');

    const where: any = {};

    if (employeeId) {
      where.employeeId = parseInt(employeeId);
    }

    if (dateStr) {
      const targetDate = new Date(dateStr);
      const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
      const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));
      where.date = { gte: startOfDay, lte: endOfDay };
    } else if (month && year) {
      const m = parseInt(month);
      const y = parseInt(year);
      const startDate = new Date(y, m - 1, 1);
      const endDate = new Date(y, m, 0, 23, 59, 59);
      where.date = { gte: startDate, lte: endDate };
    }

    const attendances = await prisma.attendance.findMany({
      where,
      include: {
        employee: {
          include: { department: true, position: true },
        },
      },
      orderBy: { date: 'desc' },
    });

    return NextResponse.json(attendances);
  } catch (error) {
    console.error('Attendance GET Error:', error);
    return NextResponse.json({ error: 'ไม่สามารถดึงข้อมูลเวลาทำงานได้' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { employeeId, date, checkIn, checkOut, status, overtimeHours, note, source, latitude, longitude } = body;

    if (!employeeId || !date) {
      return NextResponse.json({ error: 'กรุณาระบุพนักงานและวันที่' }, { status: 400 });
    }

    const attendanceDate = new Date(date);
    attendanceDate.setHours(0, 0, 0, 0);

    // ตรวจสอบหรือสร้างรายการเวลาเข้า-ออก
    const existing = await prisma.attendance.findUnique({
      where: {
        employeeId_date: {
          employeeId: parseInt(employeeId),
          date: attendanceDate,
        },
      },
    });

    if (existing) {
      const updated = await prisma.attendance.update({
        where: { id: existing.id },
        data: {
          checkIn: checkIn ? new Date(checkIn) : existing.checkIn,
          checkOut: checkOut ? new Date(checkOut) : existing.checkOut,
          status: status || existing.status,
          overtimeHours: overtimeHours !== undefined ? parseFloat(overtimeHours) : existing.overtimeHours,
          note: note !== undefined ? note : existing.note,
          source: source || existing.source,
          latitude: latitude || existing.latitude,
          longitude: longitude || existing.longitude,
        },
        include: { employee: true },
      });
      return NextResponse.json(updated);
    }

    const created = await prisma.attendance.create({
      data: {
        employeeId: parseInt(employeeId),
        date: attendanceDate,
        checkIn: checkIn ? new Date(checkIn) : null,
        checkOut: checkOut ? new Date(checkOut) : null,
        status: status || 'PRESENT',
        overtimeHours: overtimeHours ? parseFloat(overtimeHours) : 0,
        note: note || null,
        source: source || 'MANUAL',
        latitude: latitude || null,
        longitude: longitude || null,
      },
      include: { employee: true },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error('Attendance POST Error:', error);
    return NextResponse.json({ error: 'ไม่สามารถบันทึกเวลาทำงานได้' }, { status: 500 });
  }
}

