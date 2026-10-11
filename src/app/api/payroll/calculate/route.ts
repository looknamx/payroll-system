import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { THAI_MONTHS } from '@/lib/utils';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { month, year, forceRecalculate } = body;

    if (!month || !year) {
      return NextResponse.json({ error: 'กรุณาระบุเดือนและปีที่ต้องการคำนวณ' }, { status: 400 });
    }

    const m = parseInt(month);
    const y = parseInt(year);
    const thaiMonthName = THAI_MONTHS[m - 1];
    const thaiYear = y + 543;
    const periodName = `${thaiMonthName} ${thaiYear}`;

    // ตรวจสอบหรือสร้างรอบเงินเดือน
    let period = await prisma.payrollPeriod.findUnique({
      where: {
        month_year: { month: m, year: y },
      },
      include: {
        records: true,
      },
    });

    if (period && period.status === 'PAID' && !forceRecalculate) {
      return NextResponse.json(
        { error: 'รอบเงินเดือนนี้ได้ทำการ "จ่ายแล้ว" ป้องกันการคำนวณซ้ำเพื่อรักษาข้อมูลทางบัญชี' },
        { status: 400 }
      );
    }

    // วันที่เริ่มต้นและสิ้นสุดของรอบเดือน
    const startDate = new Date(y, m - 1, 1);
    const endDate = new Date(y, m, 0, 23, 59, 59);
    const payDate = new Date(y, m - 1, Math.min(30, new Date(y, m, 0).getDate()));

    if (!period) {
      period = await prisma.payrollPeriod.create({
        data: {
          month: m,
          year: y,
          name: periodName,
          startDate,
          endDate,
          payDate,
          status: 'DRAFT',
        },
        include: { records: true },
      });
    }

    // ดึงค่าตั้งต้นระบบสำหรับการคำนวณ
    const settingsList = await prisma.systemSetting.findMany();
    const settings = settingsList.reduce((acc: any, curr) => {
      acc[curr.key] = parseFloat(curr.value) || 0;
      return acc;
    }, {});

    const ssoRate = (settings['sso_employee_rate'] ?? 5.0) / 100;
    const ssoMaxBase = settings['sso_max_base_salary'] ?? 15000;
    const ssoMinBase = settings['sso_min_base_salary'] ?? 1650;
    const otNormalRate = settings['ot_rate_normal'] ?? 1.5;
    const workHoursPerDay = settings['work_hours_per_day'] ?? 8;
    const workDaysPerMonth = settings['work_days_per_month'] ?? 30;

    // ดึงประเภทเงินได้และเงินหัก
    const incomeSalaryType = await prisma.incomeType.findUnique({ where: { code: 'SALARY' } });
    const incomeOtType = await prisma.incomeType.findUnique({ where: { code: 'OT' } });
    const deductionSsoType = await prisma.deductionType.findUnique({ where: { code: 'SSO' } });
    const deductionTaxType = await prisma.deductionType.findUnique({ where: { code: 'TAX' } });
    const deductionAdvanceType = await prisma.deductionType.findUnique({ where: { code: 'ADVANCE' } });
    const deductionLateType = await prisma.deductionType.findUnique({ where: { code: 'LATE_ABSENT' } });

    // ดึงพนักงานที่ยังปฏิบัติงานอยู่ (ACTIVE)
    const employees = await prisma.employee.findMany({
      where: { status: 'ACTIVE' },
      include: {
        employmentType: true,
        attendances: {
          where: {
            date: { gte: startDate, lte: endDate },
          },
        },
        advances: {
          where: {
            status: 'APPROVED',
            requestDate: { lte: endDate },
          },
        },
      },
    });

    const calculatedRecords = [];

    for (const emp of employees) {
      const isDaily = emp.employmentType?.code === 'DAILY';

      // คำนวณวันเข้างานจาก attendances
      const workDaysCount = emp.attendances.filter((a) => a.status === 'PRESENT' || a.status === 'LATE').length;
      const absentCount = emp.attendances.filter((a) => a.status === 'ABSENT').length;
      const lateCount = emp.attendances.filter((a) => a.status === 'LATE').length;
      const leaveCount = emp.attendances.filter((a) => a.status === 'LEAVE').length;
      const totalOtHours = emp.attendances.reduce((acc, a) => acc + (a.overtimeHours || 0), 0);

      // ฐานเงินเดือน/ค่าจ้าง
      let baseIncome = 0;
      let hourlyRate = 0;

      if (isDaily) {
        const days = workDaysCount > 0 ? workDaysCount : workDaysPerMonth;
        baseIncome = (emp.dailyWage || 0) * days;
        hourlyRate = (emp.dailyWage || 0) / workHoursPerDay;
      } else {
        baseIncome = emp.salary || 0;
        hourlyRate = (emp.salary || 0) / (workDaysPerMonth * workHoursPerDay);
      }

      // คำนวณค่าล่วงเวลา (OT)
      const otIncome = Math.round(totalOtHours * hourlyRate * otNormalRate * 100) / 100;

      // รวมเงินได้
      const totalIncome = Math.round((baseIncome + otIncome) * 100) / 100;

      // คำนวณประกันสังคม (5% สูงสุดไม่เกิน 750 บาท สำหรับฐาน 15,000)
      let ssoBase = Math.min(Math.max(baseIncome, ssoMinBase), ssoMaxBase);
      let ssoDeduction = 0;
      if (emp.salary > 0 || emp.dailyWage > 0) {
        ssoDeduction = Math.min(Math.round(ssoBase * ssoRate), 750);
      }

      // คำนวณภาษีหัก ณ ที่จ่าย
      let taxDeduction = 0;
      if (emp.withholdTaxRate > 0) {
        taxDeduction = Math.round((totalIncome * (emp.withholdTaxRate / 100)) * 100) / 100;
      } else {
        // ประเมินภาษีแบบขั้นบันไดพื้นฐาน
        const annualEstimate = totalIncome * 12;
        if (annualEstimate > 300000) {
          taxDeduction = Math.round(((annualEstimate - 300000) * 0.05 / 12) * 100) / 100;
        }
      }

      // คำนวณเงินเบิกล่วงหน้า
      const advanceDeduction = emp.advances.reduce((acc, adv) => acc + adv.amount, 0);

      // รวมเงินหัก
      const totalDeduction = Math.round((ssoDeduction + taxDeduction + advanceDeduction) * 100) / 100;

      // เงินสุทธิ
      const netPay = Math.round((totalIncome - totalDeduction) * 100) / 100;

      // บันทึกหรืออัปเดต PayrollRecord
      const record = await prisma.payrollRecord.upsert({
        where: {
          payrollPeriodId_employeeId: {
            payrollPeriodId: period.id,
            employeeId: emp.id,
          },
        },
        update: {
          baseSalary: isDaily ? emp.dailyWage : emp.salary,
          workDays: isDaily ? (workDaysCount > 0 ? workDaysCount : workDaysPerMonth) : workDaysPerMonth,
          absentDays: absentCount,
          lateDays: lateCount,
          leaveDays: leaveCount,
          overtimeHours: totalOtHours,
          totalIncome,
          totalDeduction,
          netPay,
          status: 'DRAFT',
        },
        create: {
          payrollPeriodId: period.id,
          employeeId: emp.id,
          baseSalary: isDaily ? emp.dailyWage : emp.salary,
          workDays: isDaily ? (workDaysCount > 0 ? workDaysCount : workDaysPerMonth) : workDaysPerMonth,
          absentDays: absentCount,
          lateDays: lateCount,
          leaveDays: leaveCount,
          overtimeHours: totalOtHours,
          totalIncome,
          totalDeduction,
          netPay,
          status: 'DRAFT',
        },
      });

      // ลบรายการเดิมแล้วสร้างรายการแจกแจงเงินได้และเงินหัก
      await prisma.payrollIncome.deleteMany({ where: { payrollRecordId: record.id } });
      await prisma.payrollDeduction.deleteMany({ where: { payrollRecordId: record.id } });

      // เพิ่มเงินได้
      if (incomeSalaryType) {
        await prisma.payrollIncome.create({
          data: {
            payrollRecordId: record.id,
            incomeTypeId: incomeSalaryType.id,
            amount: baseIncome,
            note: isDaily ? 'ค่าจ้างตามวัน' : 'เงินเดือนประจำ',
          },
        });
      }

      if (incomeOtType && otIncome > 0) {
        await prisma.payrollIncome.create({
          data: {
            payrollRecordId: record.id,
            incomeTypeId: incomeOtType.id,
            amount: otIncome,
            note: `OT ${totalOtHours} ชม.`,
          },
        });
      }

      // เพิ่มเงินหัก
      if (deductionSsoType && ssoDeduction > 0) {
        await prisma.payrollDeduction.create({
          data: {
            payrollRecordId: record.id,
            deductionTypeId: deductionSsoType.id,
            amount: ssoDeduction,
            note: 'เงินสมทบประกันสังคม 5%',
          },
        });
      }

      if (deductionTaxType && taxDeduction > 0) {
        await prisma.payrollDeduction.create({
          data: {
            payrollRecordId: record.id,
            deductionTypeId: deductionTaxType.id,
            amount: taxDeduction,
            note: 'ภาษีเงินได้หัก ณ ที่จ่าย',
          },
        });
      }

      if (deductionAdvanceType && advanceDeduction > 0) {
        await prisma.payrollDeduction.create({
          data: {
            payrollRecordId: record.id,
            deductionTypeId: deductionAdvanceType.id,
            amount: advanceDeduction,
            note: 'หักเงินเบิกล่วงหน้า',
          },
        });

        // อัปเดตสถานะเบิกล่วงหน้าเป็น DEDUCTED
        for (const adv of emp.advances) {
          await prisma.advance.update({
            where: { id: adv.id },
            data: { status: 'DEDUCTED', payrollRecordId: record.id },
          });
        }
      }

      // บันทึกประวัติ
      await prisma.payrollHistory.create({
        data: {
          payrollRecordId: record.id,
          action: 'CALCULATE',
          description: `คำนวณเงินเดือนรอบ ${periodName} สำเร็จ (สุทธิ: ${netPay} บาท)`,
          newData: JSON.stringify({ totalIncome, totalDeduction, netPay }),
        },
      });

      calculatedRecords.push(record);
    }

    // อัปเดตสถานะรอบเป็น CALCULATED
    await prisma.payrollPeriod.update({
      where: { id: period.id },
      data: { status: 'VERIFIED' },
    });

    return NextResponse.json({
      success: true,
      message: `คำนวณเงินเดือนรอบ ${periodName} สำหรับพนักงาน ${calculatedRecords.length} คน เรียบร้อยแล้ว`,
      periodId: period.id,
      count: calculatedRecords.length,
    });
  } catch (error) {
    console.error('Payroll Calculation Error:', error);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดในการคำนวณเงินเดือน' }, { status: 500 });
  }
}

