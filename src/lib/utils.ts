export const THAI_MONTHS = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
];

export const THAI_MONTHS_SHORT = [
  'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
  'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
];

export function formatCurrency(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(amount)) return '0.00';
  return Number(amount).toLocaleString('th-TH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function formatThaiDate(dateInput: Date | string | null | undefined): string {
  if (!dateInput) return '-';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return '-';

  const day = d.getDate();
  const month = THAI_MONTHS_SHORT[d.getMonth()];
  const year = d.getFullYear() + 543;
  return `${day} ${month} ${year}`;
}

export function formatThaiDateFull(dateInput: Date | string | null | undefined): string {
  if (!dateInput) return '-';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return '-';

  const day = d.getDate();
  const month = THAI_MONTHS[d.getMonth()];
  const year = d.getFullYear() + 543;
  return `${day} ${month} พ.ศ. ${year}`;
}

export function formatThaiDateNumeric(dateInput: Date | string | null | undefined): string {
  if (!dateInput) return '-';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return '-';

  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear() + 543;
  return `${day}/${month}/${year}`;
}

export function formatThaiTime(dateInput: Date | string | null | undefined): string {
  if (!dateInput) return '-';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return '-';

  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes} น.`;
}

// แปลงตัวเลขเป็นข้อความบาทถ้วนไทย (สำหรับหนังสือรับรองและสลิป)
export function bahtText(amount: number): string {
  if (amount === 0) return 'ศูนย์บาทถ้วน';
  
  const numbers = ['', 'หนึ่ง', 'สอง', 'สาม', 'สี่', 'ห้า', 'หก', 'เจ็ด', 'แปด', 'เก้า'];
  const units = ['', 'สิบ', 'ร้อย', 'พัน', 'หมื่น', 'แสน', 'ล้าน'];
  
  let formatted = Math.abs(amount).toFixed(2);
  let [integerPart, decimalPart] = formatted.split('.');
  
  function convertGroup(nStr: string): string {
    let result = '';
    const len = nStr.length;
    for (let i = 0; i < len; i++) {
      const digit = parseInt(nStr[i]);
      const unitIndex = len - i - 1;
      if (digit !== 0) {
        if (unitIndex === 1 && digit === 1) {
          result += 'สิบ';
        } else if (unitIndex === 1 && digit === 2) {
          result += 'ยี่สิบ';
        } else if (unitIndex === 0 && digit === 1 && len > 1 && nStr[len - 2] !== '0') {
          result += 'เอ็ด';
        } else {
          result += numbers[digit] + units[unitIndex];
        }
      }
    }
    return result;
  }

  let text = '';
  if (integerPart.length > 6) {
    const millionPart = integerPart.substring(0, integerPart.length - 6);
    const restPart = integerPart.substring(integerPart.length - 6);
    text += convertGroup(millionPart) + 'ล้าน' + convertGroup(restPart) + 'บาท';
  } else {
    text += convertGroup(integerPart) + 'บาท';
  }

  if (decimalPart === '00') {
    text += 'ถ้วน';
  } else {
    const decVal = parseInt(decimalPart);
    if (decVal > 0) {
      const d1 = parseInt(decimalPart[0]);
      const d2 = parseInt(decimalPart[1]);
      let satang = '';
      if (d1 === 1) satang += 'สิบ';
      else if (d1 === 2) satang += 'ยี่สิบ';
      else if (d1 > 2) satang += numbers[d1] + 'สิบ';

      if (d2 === 1 && d1 > 0) satang += 'เอ็ด';
      else if (d2 > 0) satang += numbers[d2];

      text += satang + 'สตางค์';
    }
  }

  return (amount < 0 ? 'ลบ' : '') + text;
}

