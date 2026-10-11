import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding initial data...');

  // 1. Company
  await prisma.company.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      name: 'บริษัท สยามพาณิชย์ อินโนเวชั่น จำกัด',
      nameEn: 'Siam Commerce Innovation Co., Ltd.',
      taxId: '0105556012345',
      address: 'เลขที่ 888 อาคารเพลินจิตทาวเวอร์ ชั้น 15 ถนนสุขุมวิท แขวงคลองเตย เขตคลองเตย กรุงเทพมหานคร 10110',
      phone: '02-789-9999',
      email: 'hr@siamcommerce.co.th',
      authorizedSignatory: 'นายณรงค์เดช วิวัฒน์ธานินทร์',
      signatoryPosition: 'กรรมการผู้จัดการ',
      socialSecurityNo: '1023456789',
      socialSecurityBranch: '000000',
    },
  });

  // 2. Departments
  const departments = [
    { name: 'ฝ่ายบริหาร', code: 'MGT' },
    { name: 'ฝ่ายทรัพยากรบุคคล', code: 'HR' },
    { name: 'ฝ่ายการเงินและบัญชี', code: 'ACC' },
    { name: 'ฝ่ายพัฒนาเทคโนโลยี', code: 'IT' },
    { name: 'ฝ่ายขายและการตลาด', code: 'MKT' },
    { name: 'ฝ่ายปฏิบัติการและการผลิต', code: 'OPS' },
  ];

  for (const dept of departments) {
    await prisma.department.upsert({
      where: { name: dept.name },
      update: {},
      create: dept,
    });
  }

  // 3. Positions
  const positions = [
    { name: 'ผู้อำนวยการ / ผู้จัดการทั่วไป' },
    { name: 'ผู้จัดการแผนก' },
    { name: 'หัวหน้าทีม' },
    { name: 'เจ้าหน้าที่อาวุโส' },
    { name: 'เจ้าหน้าที่ปฏิบัติการ' },
    { name: 'พนักงานทั่วไป' },
  ];

  for (const pos of positions) {
    await prisma.position.upsert({
      where: { name: pos.name },
      update: {},
      create: pos,
    });
  }

  // 4. Employment Types
  const empTypes = [
    { name: 'พนักงานประจำ (รายเดือน)', code: 'MONTHLY' },
    { name: 'พนักงานรายวัน (จ้างตามวัน)', code: 'DAILY' },
  ];

  for (const et of empTypes) {
    await prisma.employmentType.upsert({
      where: { code: et.code },
      update: {},
      create: et,
    });
  }

  // 5. Leave Types
  const leaveTypes = [
    { name: 'ลาป่วย', maxDaysPerYear: 30, isPaid: true },
    { name: 'ลากิจ', maxDaysPerYear: 6, isPaid: true },
    { name: 'ลาพักร้อนประจำปี', maxDaysPerYear: 6, isPaid: true },
    { name: 'ลาคลอดบุตร', maxDaysPerYear: 98, isPaid: true },
    { name: 'ลาบวช / ปฏิบัติธรรม', maxDaysPerYear: 15, isPaid: false },
    { name: 'ลาโดยไม่รับค่าจ้าง (Leave without pay)', maxDaysPerYear: 30, isPaid: false },
  ];

  for (const lt of leaveTypes) {
    await prisma.leaveType.upsert({
      where: { name: lt.name },
      update: {},
      create: lt,
    });
  }

  // 6. Income Types
  const incomeTypes = [
    { name: 'เงินเดือน / ค่าจ้างหลัก', code: 'SALARY', isDefault: true },
    { name: 'ค่าล่วงเวลา (OT)', code: 'OT', isDefault: true },
    { name: 'เบี้ยเลี้ยง / เบี้ยขยัน', code: 'ALLOWANCE', isDefault: true },
    { name: 'โบนัส', code: 'BONUS', isDefault: false },
    { name: 'ค่าเดินทางและพาหนะ', code: 'COMMUTE', isDefault: false },
    { name: 'เงินได้อื่นๆ', code: 'OTHER_INCOME', isDefault: false },
  ];

  for (const it of incomeTypes) {
    await prisma.incomeType.upsert({
      where: { code: it.code },
      update: {},
      create: it,
    });
  }

  // 7. Deduction Types
  const deductionTypes = [
    { name: 'เงินสมทบประกันสังคม', code: 'SSO', isDefault: true },
    { name: 'ภาษีหัก ณ ที่จ่าย', code: 'TAX', isDefault: true },
    { name: 'เบิกเงินล่วงหน้า', code: 'ADVANCE', isDefault: true },
    { name: 'หักขาดงาน / มาสาย', code: 'LATE_ABSENT', isDefault: true },
    { name: 'กองทุนสำรองเลี้ยงชีพ', code: 'PROVIDENT_FUND', isDefault: false },
    { name: 'เงินหักอื่นๆ', code: 'OTHER_DEDUCTION', isDefault: false },
  ];

  for (const dt of deductionTypes) {
    await prisma.deductionType.upsert({
      where: { code: dt.code },
      update: {},
      create: dt,
    });
  }

  // 8. Settings
  const settings = [
    { key: 'sso_employee_rate', value: '5.0', label: 'อัตราเงินสมทบประกันสังคมผู้ประกันตน (%)', group: 'sso' },
    { key: 'sso_employer_rate', value: '5.0', label: 'อัตราเงินสมทบประกันสังคมนายจ้าง (%)', group: 'sso' },
    { key: 'sso_max_base_salary', value: '15000', label: 'ฐานเงินเดือนสูงสุดในการคำนวณประกันสังคม (บาท)', group: 'sso' },
    { key: 'sso_min_base_salary', value: '1650', label: 'ฐานเงินเดือนต่ำสุดในการคำนวณประกันสังคม (บาท)', group: 'sso' },
    { key: 'work_hours_per_day', value: '8', label: 'ชั่วโมงทำงานต่อวัน', group: 'payroll' },
    { key: 'work_days_per_month', value: '30', label: 'จำนวนวันฐานในการคำนวณต่อเดือน', group: 'payroll' },
    { key: 'ot_rate_normal', value: '1.5', label: 'อัตราค่าล่วงเวลาวันทำงานปกติ (เท่า)', group: 'payroll' },
    { key: 'ot_rate_holiday', value: '3.0', label: 'อัตราค่าล่วงเวลาวันหยุด (เท่า)', group: 'payroll' },
    { key: 'payroll_pay_day', value: '30', label: 'วันที่จ่ายเงินเดือนของทุกเดือน', group: 'payroll' },
  ];

  for (const set of settings) {
    await prisma.systemSetting.upsert({
      where: { key: set.key },
      update: { value: set.value, label: set.label },
      create: set,
    });
  }

  // 9. Sample Employees
  const monthlyType = await prisma.employmentType.findUnique({ where: { code: 'MONTHLY' } });
  const dailyType = await prisma.employmentType.findUnique({ where: { code: 'DAILY' } });
  const hrDept = await prisma.department.findUnique({ where: { name: 'ฝ่ายทรัพยากรบุคคล' } });
  const itDept = await prisma.department.findUnique({ where: { name: 'ฝ่ายพัฒนาเทคโนโลยี' } });
  const accDept = await prisma.department.findUnique({ where: { name: 'ฝ่ายการเงินและบัญชี' } });
  const opsDept = await prisma.department.findUnique({ where: { name: 'ฝ่ายปฏิบัติการและการผลิต' } });
  
  const mgrPos = await prisma.position.findUnique({ where: { name: 'ผู้จัดการแผนก' } });
  const officerPos = await prisma.position.findUnique({ where: { name: 'เจ้าหน้าที่ปฏิบัติการ' } });
  const generalPos = await prisma.position.findUnique({ where: { name: 'พนักงานทั่วไป' } });

  const sampleEmployees = [
    {
      employeeCode: 'EMP001',
      titleName: 'นาย',
      firstName: 'วีระชัย',
      lastName: 'ใจมั่นคง',
      firstNameEn: 'Weerachai',
      lastNameEn: 'Jaimunkong',
      idCardNumber: '1100500123456',
      phone: '081-234-5678',
      email: 'weerachai@example.com',
      address: '99/12 หมู่ 4 ต.บางนา อ.บางนา จ.สมุทรปราการ',
      bankAccount: '123-4-56789-0',
      bankName: 'ธนาคารกสิกรไทย',
      departmentId: itDept?.id,
      positionId: mgrPos?.id,
      employmentTypeId: monthlyType?.id,
      salary: 55000,
      dailyWage: 0,
      socialSecurityId: '1100500123456',
      withholdTaxRate: 3,
      startDate: new Date('2023-01-15'),
      status: 'ACTIVE',
    },
    {
      employeeCode: 'EMP002',
      titleName: 'นางสาว',
      firstName: 'สุพรรษา',
      lastName: 'ศิริรัตน์',
      firstNameEn: 'Supansa',
      lastNameEn: 'Sirirat',
      idCardNumber: '3101400876543',
      phone: '089-876-5432',
      email: 'supansa@example.com',
      address: '45/8 แขวงลาดพร้าว เขตลาดพร้าว กรุงเทพฯ',
      bankAccount: '987-6-54321-0',
      bankName: 'ธนาคารไทยพาณิชย์',
      departmentId: hrDept?.id,
      positionId: officerPos?.id,
      employmentTypeId: monthlyType?.id,
      salary: 32000,
      dailyWage: 0,
      socialSecurityId: '3101400876543',
      withholdTaxRate: 2,
      startDate: new Date('2023-06-01'),
      status: 'ACTIVE',
    },
    {
      employeeCode: 'EMP003',
      titleName: 'นาย',
      firstName: 'กฤษณะ',
      lastName: 'ทองคำ',
      firstNameEn: 'Kritsana',
      lastNameEn: 'Thongkham',
      idCardNumber: '1209900345678',
      phone: '086-555-4321',
      email: 'kritsana@example.com',
      address: '12/3 ถนนเพชรเกษม แขวงบางหว้า เขตภาษีเจริญ กรุงเทพฯ',
      bankAccount: '456-1-23789-9',
      bankName: 'ธนาคารกรุงเทพ',
      departmentId: accDept?.id,
      positionId: officerPos?.id,
      employmentTypeId: monthlyType?.id,
      salary: 28000,
      dailyWage: 0,
      socialSecurityId: '1209900345678',
      withholdTaxRate: 1.5,
      startDate: new Date('2024-02-01'),
      status: 'ACTIVE',
    },
    {
      employeeCode: 'EMP004',
      titleName: 'นาย',
      firstName: 'บุญมี',
      lastName: 'มีโชค',
      firstNameEn: 'Boonmee',
      lastNameEn: 'Meechok',
      idCardNumber: '3450100789123',
      phone: '084-111-2233',
      email: 'boonmee@example.com',
      address: '77 หมู่ 1 ต.บางปะอิน จ.พระนครศรีอยุธยา',
      bankAccount: '789-0-12345-6',
      bankName: 'ธนาคารกรุงไทย',
      departmentId: opsDept?.id,
      positionId: generalPos?.id,
      employmentTypeId: dailyType?.id,
      salary: 0,
      dailyWage: 500,
      socialSecurityId: '3450100789123',
      withholdTaxRate: 0,
      startDate: new Date('2024-05-10'),
      status: 'ACTIVE',
    },
    {
      employeeCode: 'EMP005',
      titleName: 'นางสาว',
      firstName: 'จิดาภา',
      lastName: 'แก้วมณี',
      firstNameEn: 'Jidapa',
      lastNameEn: 'Kaewmanee',
      idCardNumber: '1103700456123',
      phone: '083-999-8877',
      email: 'jidapa@example.com',
      address: '108 แขวงดอนเมือง เขตดอนเมือง กรุงเทพฯ',
      bankAccount: '333-2-99881-1',
      bankName: 'ธนาคารกสิกรไทย',
      departmentId: opsDept?.id,
      positionId: generalPos?.id,
      employmentTypeId: dailyType?.id,
      salary: 0,
      dailyWage: 480,
      socialSecurityId: '1103700456123',
      withholdTaxRate: 0,
      startDate: new Date('2024-08-01'),
      status: 'ACTIVE',
    },
  ];

  for (const emp of sampleEmployees) {
    await prisma.employee.upsert({
      where: { employeeCode: emp.employeeCode },
      update: {},
      create: emp,
    });
  }

  // 10. Sample Payroll Period: ตุลาคม 2569 (2026-10)
  const period = await prisma.payrollPeriod.upsert({
    where: { month_year: { month: 10, year: 2026 } },
    update: {},
    create: {
      month: 10,
      year: 2026,
      name: 'ตุลาคม 2569',
      startDate: new Date('2026-10-01'),
      endDate: new Date('2026-10-31'),
      payDate: new Date('2026-10-30'),
      status: 'VERIFIED',
    },
  });

  console.log('Seeding finished successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

