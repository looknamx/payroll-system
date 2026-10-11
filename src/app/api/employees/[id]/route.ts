import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const employeeId = parseInt(id);

    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
      include: {
        department: true,
        position: true,
        employmentType: true,
        leaveRequests: {
          include: { leaveType: true },
          orderBy: { startDate: 'desc' },
          take: 5,
        },
        advances: {
          orderBy: { requestDate: 'desc' },
          take: 5,
        },
        resignation: true,
      },
    });

    if (!employee) {
      return NextResponse.json({ error: 'ไม่พบข้อมูลพนักงาน' }, { status: 404 });
    }

    return NextResponse.json(employee);
  } catch (error) {
    console.error('Employee GET ID Error:', error);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดในการดึงข้อมูล' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const employeeId = parseInt(id);
    const body = await request.json();

    // ตรวจสอบรหัสพนักงานซ้ำ (กรณีเปลี่ยนรหัส)
    if (body.employeeCode) {
      const existing = await prisma.employee.findFirst({
        where: {
          employeeCode: body.employeeCode.trim(),
          NOT: { id: employeeId },
        },
      });
      if (existing) {
        return NextResponse.json(
          { error: `รหัสพนักงาน "${body.employeeCode}" ซ้ำกับพนักงานอื่น` },
          { status: 400 }
        );
      }
    }

    const updated = await prisma.employee.update({
      where: { id: employeeId },
      data: {
        employeeCode: body.employeeCode ? body.employeeCode.trim() : undefined,
        titleName: body.titleName,
        firstName: body.firstName ? body.firstName.trim() : undefined,
        lastName: body.lastName ? body.lastName.trim() : undefined,
        firstNameEn: body.firstNameEn,
        lastNameEn: body.lastNameEn,
        avatar: body.avatar !== undefined ? body.avatar : undefined,
        gender: body.gender || 'ไม่ระบุ',
        nationality: body.nationality || 'ไทย',
        idCardNumber: body.idCardNumber ? body.idCardNumber.trim() : null,
        birthDate: body.birthDate ? new Date(body.birthDate) : null,
        phone: body.phone,
        email: body.email,
        address: body.address,
        bankAccount: body.bankAccount,
        bankName: body.bankName,
        departmentId: body.departmentId ? parseInt(body.departmentId) : null,
        positionId: body.positionId ? parseInt(body.positionId) : null,
        employmentTypeId: body.employmentTypeId ? parseInt(body.employmentTypeId) : null,
        startDate: body.startDate ? new Date(body.startDate) : undefined,
        salary: body.salary !== undefined ? parseFloat(body.salary) : undefined,
        dailyWage: body.dailyWage !== undefined ? parseFloat(body.dailyWage) : undefined,
        newSalary: body.newSalary ? parseFloat(body.newSalary) : null,
        newSalaryEffectiveDate: body.newSalaryEffectiveDate ? new Date(body.newSalaryEffectiveDate) : null,
        socialSecurityId: body.socialSecurityId || body.idCardNumber,
        ssoEmployeeRate: body.ssoEmployeeRate !== undefined ? parseFloat(body.ssoEmployeeRate) : 5.0,
        ssoEmployerRate: body.ssoEmployerRate !== undefined ? parseFloat(body.ssoEmployerRate) : 5.0,
        providentFundRate: body.providentFundRate !== undefined ? parseFloat(body.providentFundRate) : 0,
        hasSocialSecurity: body.hasSocialSecurity !== undefined ? Boolean(body.hasSocialSecurity) : true,
        employeeLevel: body.employeeLevel || 'พนักงาน',
        hasOvertime: body.hasOvertime !== undefined ? Boolean(body.hasOvertime) : true,
        withholdTaxRate: body.withholdTaxRate !== undefined ? parseFloat(body.withholdTaxRate) : undefined,
        status: body.status,
        resignDate: body.resignDate ? new Date(body.resignDate) : null,
      },
      include: {
        department: true,
        position: true,
        employmentType: true,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Employee PUT Error:', error);
    return NextResponse.json({ error: 'ไม่สามารถอัปเดตข้อมูลพนักงานได้' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const employeeId = parseInt(id);

    // ลบพนักงานและข้อมูลที่เกี่ยวข้องทั้งหมดแบบถาวร (เงินเดือนทุกงวด, ใบลา, เวลาเข้างาน, เบิกจ่าย, ประวัติ)
    await prisma.$transaction(async (tx) => {
      // 1. ดึงรอบเงินเดือนของคนนี้
      const records = await tx.payrollRecord.findMany({
        where: { employeeId },
        select: { id: true },
      });
      const recordIds = records.map((r) => r.id);

      if (recordIds.length > 0) {
        await tx.payrollIncome.deleteMany({
          where: { payrollRecordId: { in: recordIds } },
        });
        await tx.payrollDeduction.deleteMany({
          where: { payrollRecordId: { in: recordIds } },
        });
        await tx.payrollHistory.deleteMany({
          where: { payrollRecordId: { in: recordIds } },
        });
        await tx.payrollRecord.deleteMany({
          where: { employeeId },
        });
      }

      // 2. ลบเวลาทำงาน
      await tx.attendance.deleteMany({
        where: { employeeId },
      });

      // 3. ลบคำขอลา
      await tx.leaveRequest.deleteMany({
        where: { employeeId },
      });

      // 4. ลบการเบิกล่วงหน้า
      await tx.advance.deleteMany({
        where: { employeeId },
      });

      // 5. ลบการแจ้งลาออก
      await tx.resignation.deleteMany({
        where: { employeeId },
      });

      // 6. ลบข้อมูลพนักงานออกจากระบบ
      await tx.employee.delete({
        where: { id: employeeId },
      });
    });

    return NextResponse.json({
      success: true,
      message: 'ลบข้อมูลพนักงาน พร้อมประวัติเงินเดือนทุกงวด เวลาทำงาน และใบลา ออกจากระบบเรียบร้อยแล้ว',
    });
  } catch (error) {
    console.error('Employee DELETE Error:', error);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดในการลบพนักงาน' }, { status: 500 });
  }
}
