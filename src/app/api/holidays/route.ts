import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const yearStr = searchParams.get('year');
    const year = yearStr ? parseInt(yearStr) : 2569;

    const holidays = await prisma.companyHoliday.findMany({
      where: { year },
      orderBy: { date: 'asc' },
    });

    return NextResponse.json(holidays);
  } catch (error) {
    console.error('Holidays GET Error:', error);
    return NextResponse.json({ error: 'ไม่สามารถดึงข้อมูลวันหยุดได้' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, date, name, year, fromYear, toYear } = body;

    // 1. เติมวันหยุดทั่วไปตามประเพณีของปีที่เลือก (เช่น ปี 2569)
    if (action === 'seed_standard') {
      const targetYear = parseInt(year) || 2569;
      const ceYear = targetYear - 543; // แปลง พ.ศ. เป็น ค.ศ.

      const standardHolidays = [
        { date: `${ceYear}-01-01`, name: 'วันขึ้นปีใหม่' },
        { date: `${ceYear}-01-02`, name: 'วันหยุดชดเชยวันขึ้นปีใหม่' },
        { date: `${ceYear}-03-03`, name: 'วันมาฆบูชา' },
        { date: `${ceYear}-04-06`, name: 'วันพระบาทสมเด็จพระพุทธยอดฟ้าจุฬาโลกมหาราช และวันที่ระลึกมหาจักรีบรมราชวงศ์' },
        { date: `${ceYear}-04-13`, name: 'วันสงกรานต์' },
        { date: `${ceYear}-04-14`, name: 'วันสงกรานต์' },
        { date: `${ceYear}-04-15`, name: 'วันสงกรานต์' },
        { date: `${ceYear}-05-01`, name: 'วันแรงงานแห่งชาติ' },
        { date: `${ceYear}-05-04`, name: 'วันฉัตรมงคล' },
        { date: `${ceYear}-05-31`, name: 'วันวิสาขบูชา' },
        { date: `${ceYear}-06-03`, name: 'วันเฉลิมพระชนมพรรษาสมเด็จพระนางเจ้าฯ พระบรมราชินี' },
        { date: `${ceYear}-07-28`, name: 'วันเฉลิมพระชนมพรรษาพระบาทสมเด็จพระวชิรเกล้าเจ้าอยู่หัว' },
        { date: `${ceYear}-07-29`, name: 'วันอาสาฬหบูชา' },
        { date: `${ceYear}-08-12`, name: 'วันแม่แห่งชาติ (วันเฉลิมพระชนมพรรษาสมเด็จพระบรมราชชนนีพันปีหลวง)' },
        { date: `${ceYear}-10-13`, name: 'วันนวมินทรมหาราช' },
        { date: `${ceYear}-10-23`, name: 'วันปิยมหาราช' },
        { date: `${ceYear}-12-05`, name: 'วันพ่อแห่งชาติ (วันคล้ายวันพระบรมราชสมภพในหลวง ร.9)' },
        { date: `${ceYear}-12-10`, name: 'วันรัฐธรรมนูญ' },
        { date: `${ceYear}-12-31`, name: 'วันสิ้นปี' },
      ];

      for (const h of standardHolidays) {
        const d = new Date(h.date);
        await prisma.companyHoliday.upsert({
          where: {
            date_name: {
              date: d,
              name: h.name,
            },
          },
          update: { year: targetYear },
          create: {
            date: d,
            name: h.name,
            year: targetYear,
          },
        });
      }

      return NextResponse.json({
        success: true,
        message: `เติมวันหยุดทั่วไปปี ${targetYear} เรียบร้อยแล้ว`,
      });
    }

    // 2. คัดลอกจากปีที่แล้ว
    if (action === 'copy_from_year') {
      const srcYear = parseInt(fromYear);
      const dstYear = parseInt(toYear);

      const srcHolidays = await prisma.companyHoliday.findMany({
        where: { year: srcYear },
      });

      if (srcHolidays.length === 0) {
        return NextResponse.json(
          { error: `ไม่พบข้อมูลวันหยุดของปี ${srcYear} สำหรับคัดลอก` },
          { status: 400 }
        );
      }

      for (const h of srcHolidays) {
        const oldDate = new Date(h.date);
        const newDate = new Date(oldDate);
        newDate.setFullYear(newDate.getFullYear() + (dstYear - srcYear));

        await prisma.companyHoliday.upsert({
          where: {
            date_name: {
              date: newDate,
              name: h.name,
            },
          },
          update: { year: dstYear },
          create: {
            date: newDate,
            name: h.name,
            year: dstYear,
          },
        });
      }

      return NextResponse.json({
        success: true,
        message: `คัดลอกวันหยุดจากปี ${srcYear} ไปยังปี ${dstYear} สำเร็จ`,
      });
    }

    // 3. เพิ่มวันหยุดรายการเดี่ยว
    if (!date || !name) {
      return NextResponse.json({ error: 'กรุณากรอกวันที่และชื่อวันหยุด' }, { status: 400 });
    }

    const d = new Date(date);
    const targetYear = year ? parseInt(year) : d.getFullYear() + 543;

    const holiday = await prisma.companyHoliday.create({
      data: {
        date: d,
        name: name.trim(),
        year: targetYear,
      },
    });

    return NextResponse.json(holiday, { status: 201 });
  } catch (error) {
    console.error('Holiday POST Error:', error);
    return NextResponse.json({ error: 'ไม่สามารถบันทึกวันหยุดได้' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'กรุณาระบุรหัสวันหยุดที่ต้องการลบ' }, { status: 400 });
    }

    await prisma.companyHoliday.delete({
      where: { id: parseInt(id) },
    });

    return NextResponse.json({ success: true, message: 'ลบวันหยุดเรียบร้อยแล้ว' });
  } catch (error) {
    console.error('Holiday DELETE Error:', error);
    return NextResponse.json({ error: 'ไม่สามารถลบวันหยุดได้' }, { status: 500 });
  }
}

