import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const departmentId = searchParams.get('departmentId');
    const status = searchParams.get('status') || '';
    const employmentTypeId = searchParams.get('employmentTypeId');

    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (departmentId) {
      where.departmentId = parseInt(departmentId);
    }

    if (employmentTypeId) {
      where.employmentTypeId = parseInt(employmentTypeId);
    }

    if (search) {
      where.OR = [
        { employeeCode: { contains: search } },
        { firstName: { contains: search } },
        { lastName: { contains: search } },
        { idCardNumber: { contains: search } },
        { phone: { contains: search } },
      ];
    }

    const employees = await prisma.employee.findMany({
      where,
      include: {
        department: true,
        position: true,
        employmentType: true,
      },
      orderBy: { employeeCode: 'asc' },
    });

    return NextResponse.json(employees);
  } catch (error) {
    console.error('Employees GET Error:', error);
    return NextResponse.json({ error: 'ไม่สามารถดึงข้อมูลพนักงานได้' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (!body.employeeCode || !body.firstName) {
      return NextResponse.json(
        { error: 'กรุณากรอกรหัสพนักงาน และชื่อ-นามสกุล' },
        { status: 400 }
      );
    }

    const existing = await prisma.employee.findUnique({
      where: { employeeCode: body.employeeCode.trim() },
    });

    if (existing) {
      return NextResponse.json(
        { error: `รหัสพนักงาน "${body.employeeCode}" มีอยู่ในระบบแล้ว กรุณาใช้รหัสอื่น` },
        { status: 400 }
      );
    }

    if (body.idCardNumber && body.idCardNumber.trim() !== '') {
      const existingIdCard = await prisma.employee.findFirst({
        where: { idCardNumber: body.idCardNumber.trim() },
      });
      if (existingIdCard) {
        return NextResponse.json(
          { error: `เลขบัตรประชาชน "${body.idCardNumber}" ซ้ำกับพนักงานรหัส ${existingIdCard.employeeCode}` },
          { status: 400 }
        );
      }
    }

    // จัดการชื่อ-นามสกุล (รองรับทั้งแยกหรือรวม)
    let fName = body.firstName.trim();
    let lName = (body.lastName || '').trim();
    if (!lName && fName.includes(' ')) {
      const parts = fName.split(' ');
      fName = parts[0];
      lName = parts.slice(1).join(' ');
    }

    const employee = await prisma.employee.create({
      data: {
        employeeCode: body.employeeCode.trim(),
        titleName: body.titleName || 'นาย',
        firstName: fName,
        lastName: lName,
        firstNameEn: body.firstNameEn || null,
        lastNameEn: body.lastNameEn || null,
        avatar: body.avatar || null,
        gender: body.gender || 'ไม่ระบุ',
        nationality: body.nationality || 'ไทย',
        idCardNumber: body.idCardNumber ? body.idCardNumber.trim() : null,
        birthDate: body.birthDate ? new Date(body.birthDate) : null,
        phone: body.phone || null,
        email: body.email || null,
        address: body.address || null,
        bankAccount: body.bankAccount || null,
        bankName: body.bankName || null,
        departmentId: body.departmentId ? parseInt(body.departmentId) : null,
        positionId: body.positionId ? parseInt(body.positionId) : null,
        employmentTypeId: body.employmentTypeId ? parseInt(body.employmentTypeId) : null,
        startDate: body.startDate ? new Date(body.startDate) : new Date(),
        salary: body.salary ? parseFloat(body.salary) : 0,
        dailyWage: body.dailyWage ? parseFloat(body.dailyWage) : 0,
        newSalary: body.newSalary ? parseFloat(body.newSalary) : null,
        newSalaryEffectiveDate: body.newSalaryEffectiveDate ? new Date(body.newSalaryEffectiveDate) : null,
        socialSecurityId: body.socialSecurityId || body.idCardNumber || null,
        ssoEmployeeRate: body.ssoEmployeeRate !== undefined ? parseFloat(body.ssoEmployeeRate) : 5.0,
        ssoEmployerRate: body.ssoEmployerRate !== undefined ? parseFloat(body.ssoEmployerRate) : 5.0,
        providentFundRate: body.providentFundRate !== undefined ? parseFloat(body.providentFundRate) : 0,
        hasSocialSecurity: body.hasSocialSecurity !== undefined ? Boolean(body.hasSocialSecurity) : true,
        employeeLevel: body.employeeLevel || 'พนักงาน',
        hasOvertime: body.hasOvertime !== undefined ? Boolean(body.hasOvertime) : true,
        withholdTaxRate: body.withholdTaxRate ? parseFloat(body.withholdTaxRate) : 0,
        status: body.status || 'ACTIVE',
        resignDate: body.resignDate ? new Date(body.resignDate) : null,
      },
      include: {
        department: true,
        position: true,
        employmentType: true,
      },
    });

    return NextResponse.json(employee, { status: 201 });
  } catch (error) {
    console.error('Employees POST Error:', error);
    return NextResponse.json({ error: 'ไม่สามารถบันทึกข้อมูลพนักงานได้' }, { status: 500 });
  }
}
