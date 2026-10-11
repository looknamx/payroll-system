import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const [company, settings, departments, positions, employmentTypes, incomeTypes, deductionTypes] = await Promise.all([
      prisma.company.findFirst(),
      prisma.systemSetting.findMany({ orderBy: { id: 'asc' } }),
      prisma.department.findMany({ orderBy: { name: 'asc' } }),
      prisma.position.findMany({ orderBy: { name: 'asc' } }),
      prisma.employmentType.findMany({ orderBy: { id: 'asc' } }),
      prisma.incomeType.findMany({ orderBy: { id: 'asc' } }),
      prisma.deductionType.findMany({ orderBy: { id: 'asc' } }),
    ]);

    return NextResponse.json({
      company,
      settings,
      departments,
      positions,
      employmentTypes,
      incomeTypes,
      deductionTypes,
    });
  } catch (error) {
    console.error('Settings GET Error:', error);
    return NextResponse.json({ error: 'ไม่สามารถดึงข้อมูลการตั้งค่าได้' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { company, settings, newDepartment, newPosition, newIncomeType, newDeductionType } = body;

    // อัปเดตข้อมูลบริษัท
    if (company) {
      await prisma.company.upsert({
        where: { id: company.id || 1 },
        update: {
          name: company.name,
          nameEn: company.nameEn,
          taxId: company.taxId,
          address: company.address,
          phone: company.phone,
          email: company.email,
          authorizedSignatory: company.authorizedSignatory,
          signatoryPosition: company.signatoryPosition,
          socialSecurityNo: company.socialSecurityNo,
          socialSecurityBranch: company.socialSecurityBranch,
        },
        create: {
          id: 1,
          name: company.name,
          nameEn: company.nameEn,
          taxId: company.taxId,
          address: company.address,
          phone: company.phone,
          email: company.email,
          authorizedSignatory: company.authorizedSignatory,
          signatoryPosition: company.signatoryPosition,
          socialSecurityNo: company.socialSecurityNo,
          socialSecurityBranch: company.socialSecurityBranch,
        },
      });
    }

    // อัปเดตการตั้งค่าระบบ
    if (settings && Array.isArray(settings)) {
      for (const s of settings) {
        await prisma.systemSetting.upsert({
          where: { key: s.key },
          update: { value: String(s.value) },
          create: {
            key: s.key,
            value: String(s.value),
            label: s.label || s.key,
            group: s.group || 'general',
          },
        });
      }
    }

    // เพิ่มแผนกใหม่
    if (newDepartment && newDepartment.name) {
      await prisma.department.create({
        data: {
          name: newDepartment.name.trim(),
          code: newDepartment.code || null,
        },
      });
    }

    // เพิ่มตำแหน่งใหม่
    if (newPosition && newPosition.name) {
      await prisma.position.create({
        data: { name: newPosition.name.trim() },
      });
    }

    // เพิ่มประเภทเงินได้ใหม่
    if (newIncomeType && newIncomeType.name) {
      await prisma.incomeType.create({
        data: {
          name: newIncomeType.name.trim(),
          code: newIncomeType.code || `INC_${Date.now()}`,
          isDefault: false,
        },
      });
    }

    // เพิ่มประเภทเงินหักใหม่
    if (newDeductionType && newDeductionType.name) {
      await prisma.deductionType.create({
        data: {
          name: newDeductionType.name.trim(),
          code: newDeductionType.code || `DED_${Date.now()}`,
          isDefault: false,
        },
      });
    }

    return NextResponse.json({ success: true, message: 'บันทึกการตั้งค่าเรียบร้อยแล้ว' });
  } catch (error) {
    console.error('Settings POST Error:', error);
    return NextResponse.json({ error: 'ไม่สามารถบันทึกการตั้งค่าได้' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // 'department', 'position', 'incomeType', 'deductionType'
    const idStr = searchParams.get('id');

    if (!type || !idStr) {
      return NextResponse.json({ error: 'กรุณาระบุประเภทและรหัสที่ต้องการลบ' }, { status: 400 });
    }

    const id = parseInt(idStr);

    if (type === 'department') {
      // ปลดการเชื่อมโยงพนักงานก่อนลบ
      await prisma.employee.updateMany({
        where: { departmentId: id },
        data: { departmentId: null },
      });
      await prisma.department.delete({ where: { id } });
      return NextResponse.json({ success: true, message: 'ลบแผนกเรียบร้อยแล้ว' });
    }

    if (type === 'position') {
      // ปลดการเชื่อมโยงพนักงานก่อนลบ
      await prisma.employee.updateMany({
        where: { positionId: id },
        data: { positionId: null },
      });
      await prisma.position.delete({ where: { id } });
      return NextResponse.json({ success: true, message: 'ลบตำแหน่งเรียบร้อยแล้ว' });
    }

    if (type === 'incomeType') {
      await prisma.payrollIncome.deleteMany({
        where: { incomeTypeId: id },
      });
      await prisma.incomeType.delete({ where: { id } });
      return NextResponse.json({ success: true, message: 'ลบประเภทเงินได้เรียบร้อยแล้ว' });
    }

    if (type === 'deductionType') {
      await prisma.payrollDeduction.deleteMany({
        where: { deductionTypeId: id },
      });
      await prisma.deductionType.delete({ where: { id } });
      return NextResponse.json({ success: true, message: 'ลบประเภทเงินหักเรียบร้อยแล้ว' });
    }

    return NextResponse.json({ error: 'ประเภทที่ระบุไม่ถูกต้อง' }, { status: 400 });
  } catch (error) {
    console.error('Settings DELETE Error:', error);
    return NextResponse.json({ error: 'ไม่สามารถลบรายการได้' }, { status: 500 });
  }
}
