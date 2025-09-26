import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

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

  const doc = new jsPDF('l', 'mm', 'a4'); // 橫向 A4

  // 設定中文字體
  doc.addFont('https://fonts.gstatic.com/s/notosanstc/v1/-nF7OG829O4rOjIZ5irWmWZgJ8I0.ttf', 'NotoSansTC', 'normal');
  doc.setFont('NotoSansTC');

  // 標題
  doc.setFontSize(16);
  doc.text('長照紀錄表', 14, 20);
  
  // 生成日期
  doc.setFontSize(10);
  doc.text(`生成日期: ${new Date().toLocaleString('zh-TW')}`, 14, 30);
  doc.text(`總計紀錄: ${records.length} 筆`, 14, 35);

  // 準備表格資料
  const tableData = records.map(record => [
    record.date,
    record.name,
    record.age,
    record.room,
    record.breakfast || '-',
    record.lunch || '-',
    record.dinner || '-',
    record.water ? `${record.water}ml` : '-',
    record.systolic && record.diastolic ? `${record.systolic}/${record.diastolic}` : '-',
    record.pulse || '-',
    record.temperature ? `${record.temperature}°C` : '-',
    record.sleep || '-',
    record.note || '-'
  ]);

  // 表格標題
  const headers = [
    '日期時間',
    '姓名',
    '年齡',
    '房號',
    '早餐',
    '午餐',
    '晚餐',
    '喝水量',
    '血壓',
    '脈搏',
    '體溫',
    '睡眠',
    '備註'
  ];

  // 建立表格
  doc.autoTable({
    head: [headers],
    body: tableData,
    startY: 45,
    styles: {
      fontSize: 8,
      cellPadding: 2,
      overflow: 'linebreak',
      halign: 'center',
      valign: 'middle'
    },
    headStyles: {
      fillColor: [66, 139, 202],
      textColor: 255,
      fontStyle: 'bold'
    },
    columnStyles: {
      0: { halign: 'left', cellWidth: 25 }, // 日期時間
      1: { cellWidth: 15 }, // 姓名
      2: { cellWidth: 10 }, // 年齡
      3: { cellWidth: 10 }, // 房號
      4: { cellWidth: 12 }, // 早餐
      5: { cellWidth: 12 }, // 午餐
      6: { cellWidth: 12 }, // 晚餐
      7: { cellWidth: 15 }, // 喝水量
      8: { cellWidth: 15 }, // 血壓
      9: { cellWidth: 12 }, // 脈搏
      10: { cellWidth: 12 }, // 體溫
      11: { cellWidth: 10 }, // 睡眠
      12: { halign: 'left', cellWidth: 30 } // 備註
    },
    margin: { left: 14, right: 14 },
    pageBreak: 'auto',
    showHead: 'everyPage'
  });

  // 下載檔案
  const fileName = `${filename}_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
};

// 匯出單一病患的詳細報告
export const exportPatientReport = (records, patientName, filename = '病患詳細報告') => {
  if (records.length === 0) {
    alert('沒有資料可以匯出');
    return;
  }

  const doc = new jsPDF('p', 'mm', 'a4'); // 直向 A4

  // 設定中文字體
  doc.addFont('https://fonts.gstatic.com/s/notosanstc/v1/-nF7OG829O4rOjIZ5irWmWZgJ8I0.ttf', 'NotoSansTC', 'normal');
  doc.setFont('NotoSansTC');

  // 標題
  doc.setFontSize(18);
  doc.text(`${patientName} 長照詳細報告`, 20, 30);
  
  // 報告資訊
  doc.setFontSize(12);
  doc.text(`報告日期: ${new Date().toLocaleString('zh-TW')}`, 20, 45);
  doc.text(`病患姓名: ${patientName}`, 20, 55);
  doc.text(`房號: ${records[0]?.room || 'N/A'}`, 20, 65);
  doc.text(`總計紀錄: ${records.length} 筆`, 20, 75);

  // 分隔線
  doc.line(20, 85, 190, 85);

  let yPosition = 100;

  // 逐筆顯示詳細紀錄
  records.forEach((record, index) => {
    if (yPosition > 250) {
      doc.addPage();
      yPosition = 30;
    }

    doc.setFontSize(14);
    doc.text(`紀錄 ${index + 1} - ${record.date}`, 20, yPosition);
    yPosition += 15;

    doc.setFontSize(10);
    
    // 基本資料
    doc.text(`姓名: ${record.name}`, 20, yPosition);
    doc.text(`年齡: ${record.age}`, 100, yPosition);
    doc.text(`房號: ${record.room}`, 150, yPosition);
    yPosition += 10;

    // 用餐狀況
    doc.text(`早餐: ${record.breakfast || '-'}`, 20, yPosition);
    doc.text(`午餐: ${record.lunch || '-'}`, 80, yPosition);
    doc.text(`晚餐: ${record.dinner || '-'}`, 140, yPosition);
    yPosition += 10;

    // 健康監測
    doc.text(`喝水量: ${record.water ? record.water + 'ml' : '-'}`, 20, yPosition);
    doc.text(`血壓: ${record.systolic && record.diastolic ? record.systolic + '/' + record.diastolic : '-'}`, 80, yPosition);
    doc.text(`脈搏: ${record.pulse || '-'}`, 140, yPosition);
    yPosition += 10;

    doc.text(`體溫: ${record.temperature ? record.temperature + '°C' : '-'}`, 20, yPosition);
    doc.text(`睡眠: ${record.sleep || '-'}`, 80, yPosition);
    yPosition += 10;

    // 備註
    if (record.note) {
      doc.text(`備註: ${record.note}`, 20, yPosition);
      yPosition += 10;
    }

    yPosition += 10; // 紀錄間距
  });

  // 下載檔案
  const fileName = `${filename}_${patientName}_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
};
