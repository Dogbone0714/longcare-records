import * as XLSX from 'xlsx';
import { generatePDFFromHTML } from './pdfGenerator';

// 匯出 Excel 檔案
export const exportToExcel = (records, filename = '長照紀錄表') => {
  if (records.length === 0) {
    alert('沒有資料可以匯出');
    return;
  }

  // 準備資料
  const data = records.map(record => ({
    '日期時間': record.date,
    '姓名': record.name,
    '年齡': record.age,
    '房號': record.room,
    '早餐': record.breakfast || '-',
    '午餐': record.lunch || '-',
    '晚餐': record.dinner || '-',
    '喝水量(ml)': record.water ? `${record.water}ml` : '-',
    '收縮壓': record.systolic || '-',
    '舒張壓': record.diastolic || '-',
    '血壓': record.systolic && record.diastolic ? `${record.systolic}/${record.diastolic}` : '-',
    '脈搏(次/分)': record.pulse || '-',
    '體溫(°C)': record.temperature ? `${record.temperature}°C` : '-',
    '睡眠狀況': record.sleep || '-',
    '備註': record.note || '-'
  }));

  // 建立工作簿
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(data);

  // 設定欄位寬度
  const colWidths = [
    { wch: 20 }, // 日期時間
    { wch: 10 }, // 姓名
    { wch: 8 },  // 年齡
    { wch: 8 },  // 房號
    { wch: 10 }, // 早餐
    { wch: 10 }, // 午餐
    { wch: 10 }, // 晚餐
    { wch: 12 }, // 喝水量
    { wch: 10 }, // 收縮壓
    { wch: 10 }, // 舒張壓
    { wch: 12 }, // 血壓
    { wch: 12 }, // 脈搏
    { wch: 12 }, // 體溫
    { wch: 12 }, // 睡眠狀況
    { wch: 30 }  // 備註
  ];
  ws['!cols'] = colWidths;

  // 加入工作表
  XLSX.utils.book_append_sheet(wb, ws, '長照紀錄');

  // 下載檔案
  const fileName = `${filename}_${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(wb, fileName);
};

// 匯出 PDF 檔案
export const exportToPDF = (records, filename = '長照紀錄表') => {
  if (records.length === 0) {
    alert('沒有資料可以匯出');
    return;
  }

  // 使用 HTML 轉 PDF 的方式確保中文字體正常顯示
  generatePDFFromHTML(records, filename, false);
};

// 匯出單一病患的詳細報告
export const exportPatientReport = (records, patientName, filename = '病患詳細報告') => {
  if (records.length === 0) {
    alert('沒有資料可以匯出');
    return;
  }

  // 使用 HTML 轉 PDF 的方式確保中文字體正常顯示
  generatePDFFromHTML(records, filename, true, patientName);
};
