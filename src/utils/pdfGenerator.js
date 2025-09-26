// 使用 HTML 轉 PDF 的方式來確保中文字體正常顯示
export const generatePDFFromHTML = (records, filename = '長照紀錄表', isDetailed = false, patientName = '') => {
  if (records.length === 0) {
    alert('沒有資料可以匯出');
    return;
  }

  // 建立 HTML 內容
  let htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body {
          font-family: 'Microsoft JhengHei', 'PingFang TC', 'Helvetica Neue', Arial, sans-serif;
          margin: 20px;
          font-size: 12px;
          line-height: 1.4;
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
          border-bottom: 2px solid #333;
          padding-bottom: 10px;
        }
        .title {
          font-size: 24px;
          font-weight: bold;
          margin-bottom: 10px;
        }
        .subtitle {
          font-size: 14px;
          color: #666;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 20px;
        }
        th, td {
          border: 1px solid #ddd;
          padding: 8px;
          text-align: left;
          font-size: 10px;
        }
        th {
          background-color: #f5f5f5;
          font-weight: bold;
        }
        .record-item {
          margin-bottom: 20px;
          padding: 15px;
          border: 1px solid #ddd;
          border-radius: 5px;
        }
        .record-header {
          font-weight: bold;
          font-size: 14px;
          margin-bottom: 10px;
          color: #333;
        }
        .record-row {
          display: flex;
          margin-bottom: 5px;
        }
        .record-label {
          font-weight: bold;
          width: 100px;
          flex-shrink: 0;
        }
        .record-value {
          flex: 1;
        }
        @media print {
          body { margin: 0; }
          .page-break { page-break-before: always; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="title">${isDetailed ? `${patientName} - 長照詳細報告` : '長照紀錄表'}</div>
        <div class="subtitle">生成日期: ${new Date().toLocaleString('zh-TW')} | 總計紀錄: ${records.length} 筆</div>
      </div>
  `;

  if (isDetailed) {
    // 詳細報告格式
    records.forEach((record, index) => {
      htmlContent += `
        <div class="record-item ${index > 0 ? 'page-break' : ''}">
          <div class="record-header">紀錄 ${index + 1} - ${record.date}</div>
          <div class="record-row">
            <div class="record-label">姓名:</div>
            <div class="record-value">${record.name}</div>
            <div class="record-label">年齡:</div>
            <div class="record-value">${record.age}</div>
            <div class="record-label">房號:</div>
            <div class="record-value">${record.room}</div>
          </div>
          <div class="record-row">
            <div class="record-label">早餐:</div>
            <div class="record-value">${record.breakfast || '-'}</div>
            <div class="record-label">午餐:</div>
            <div class="record-value">${record.lunch || '-'}</div>
            <div class="record-label">晚餐:</div>
            <div class="record-value">${record.dinner || '-'}</div>
          </div>
          <div class="record-row">
            <div class="record-label">喝水量:</div>
            <div class="record-value">${record.water ? record.water + 'ml' : '-'}</div>
            <div class="record-label">血壓:</div>
            <div class="record-value">${record.systolic && record.diastolic ? record.systolic + '/' + record.diastolic : '-'}</div>
            <div class="record-label">脈搏:</div>
            <div class="record-value">${record.pulse || '-'}</div>
          </div>
          <div class="record-row">
            <div class="record-label">體溫:</div>
            <div class="record-value">${record.temperature ? record.temperature + '°C' : '-'}</div>
            <div class="record-label">睡眠:</div>
            <div class="record-value">${record.sleep || '-'}</div>
          </div>
          ${record.note ? `
            <div class="record-row">
              <div class="record-label">備註:</div>
              <div class="record-value">${record.note}</div>
            </div>
          ` : ''}
        </div>
      `;
    });
  } else {
    // 表格格式
    htmlContent += `
      <table>
        <thead>
          <tr>
            <th>日期時間</th>
            <th>姓名</th>
            <th>年齡</th>
            <th>房號</th>
            <th>早餐</th>
            <th>午餐</th>
            <th>晚餐</th>
            <th>喝水量</th>
            <th>血壓</th>
            <th>脈搏</th>
            <th>體溫</th>
            <th>睡眠</th>
            <th>備註</th>
          </tr>
        </thead>
        <tbody>
    `;

    records.forEach(record => {
      htmlContent += `
        <tr>
          <td>${record.date}</td>
          <td>${record.name}</td>
          <td>${record.age}</td>
          <td>${record.room}</td>
          <td>${record.breakfast || '-'}</td>
          <td>${record.lunch || '-'}</td>
          <td>${record.dinner || '-'}</td>
          <td>${record.water ? record.water + 'ml' : '-'}</td>
          <td>${record.systolic && record.diastolic ? record.systolic + '/' + record.diastolic : '-'}</td>
          <td>${record.pulse || '-'}</td>
          <td>${record.temperature ? record.temperature + '°C' : '-'}</td>
          <td>${record.sleep || '-'}</td>
          <td>${record.note || '-'}</td>
        </tr>
      `;
    });

    htmlContent += `
        </tbody>
      </table>
    `;
  }

  htmlContent += `
    </body>
    </html>
  `;

  // 建立新視窗並列印
  const printWindow = window.open('', '_blank');
  printWindow.document.write(htmlContent);
  printWindow.document.close();
  
  // 等待內容載入完成後列印
  printWindow.onload = () => {
    printWindow.print();
  };
};
