import { format, parseISO, isValid, subDays } from 'date-fns';
import { zhTW } from 'date-fns/locale';

// 通用日期解析函數
const parseRecordDate = (dateString) => {
  if (dateString.includes('T')) {
    // ISO 格式
    return parseISO(dateString);
  } else {
    // 本地化格式，提取日期部分
    const datePart = dateString.split(' ')[0];
    // 將 2024/9/26 轉換為 2024-09-26
    const normalizedDate = datePart.replace(/\//g, '-');
    return parseISO(normalizedDate);
  }
};

// 處理血壓資料
export const processBloodPressureData = (records, days = 30) => {
  const endDate = new Date();
  const startDate = subDays(endDate, days);
  
  const filteredRecords = records.filter(record => {
    const recordDate = parseRecordDate(record.date);
    return isValid(recordDate) && recordDate >= startDate && recordDate <= endDate;
  });

  // 按日期分組
  const groupedData = {};
  filteredRecords.forEach(record => {
    const date = record.date.split(' ')[0];
    if (!groupedData[date]) {
      groupedData[date] = [];
    }
    groupedData[date].push(record);
  });

  // 計算每日平均值
  const chartData = Object.keys(groupedData)
    .sort()
    .map(date => {
      const dayRecords = groupedData[date];
      const validRecords = dayRecords.filter(r => r.systolic && r.diastolic);
      
      if (validRecords.length === 0) return null;
      
      const avgSystolic = validRecords.reduce((sum, r) => sum + parseInt(r.systolic), 0) / validRecords.length;
      const avgDiastolic = validRecords.reduce((sum, r) => sum + parseInt(r.diastolic), 0) / validRecords.length;
      
      return {
        date: format(parseRecordDate(date + ' 00:00:00'), 'MM/dd', { locale: zhTW }),
        fullDate: date,
        systolic: Math.round(avgSystolic),
        diastolic: Math.round(avgDiastolic),
        count: validRecords.length
      };
    })
    .filter(item => item !== null);

  return {
    labels: chartData.map(item => item.date),
    datasets: [
      {
        label: '收縮壓',
        data: chartData.map(item => item.systolic),
        borderColor: 'rgb(239, 68, 68)',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        tension: 0.4,
        yAxisID: 'y'
      },
      {
        label: '舒張壓',
        data: chartData.map(item => item.diastolic),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
        yAxisID: 'y'
      }
    ]
  };
};

// 處理體溫資料
export const processTemperatureData = (records, days = 30) => {
  const endDate = new Date();
  const startDate = subDays(endDate, days);
  
  const filteredRecords = records.filter(record => {
    const recordDate = parseRecordDate(record.date);
    return isValid(recordDate) && recordDate >= startDate && recordDate <= endDate && record.temperature;
  });

  const chartData = filteredRecords
    .map(record => ({
      date: record.date.split(' ')[0],
      temperature: parseFloat(record.temperature),
      time: record.date.split(' ')[1] || '00:00'
    }))
    .sort((a, b) => new Date(a.date + ' ' + a.time) - new Date(b.date + ' ' + b.time));

  return {
    labels: chartData.map(item => format(parseRecordDate(item.fullDate + ' 00:00:00'), 'MM/dd', { locale: zhTW })),
    datasets: [
      {
        label: '體溫 (°C)',
        data: chartData.map(item => item.temperature),
        borderColor: 'rgb(34, 197, 94)',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        tension: 0.4,
        pointRadius: 4,
        pointHoverRadius: 6
      }
    ]
  };
};

// 處理喝水量資料
export const processWaterIntakeData = (records, days = 30) => {
  const endDate = new Date();
  const startDate = subDays(endDate, days);
  
  const filteredRecords = records.filter(record => {
    const recordDate = parseRecordDate(record.date);
    return isValid(recordDate) && recordDate >= startDate && recordDate <= endDate && record.water;
  });

  // 按日期分組並計算每日總量
  const groupedData = {};
  filteredRecords.forEach(record => {
    const date = record.date.split(' ')[0];
    if (!groupedData[date]) {
      groupedData[date] = 0;
    }
    groupedData[date] += parseInt(record.water);
  });

  const chartData = Object.keys(groupedData)
    .sort()
    .map(date => ({
      date: format(parseISO(date), 'MM/dd', { locale: zhTW }),
      water: groupedData[date]
    }));

  return {
    labels: chartData.map(item => item.date),
    datasets: [
      {
        label: '喝水量 (ml)',
        data: chartData.map(item => item.water),
        backgroundColor: 'rgba(168, 85, 247, 0.2)',
        borderColor: 'rgb(168, 85, 247)',
        borderWidth: 2,
        borderRadius: 4,
        borderSkipped: false
      }
    ]
  };
};

// 處理睡眠品質資料
export const processSleepQualityData = (records, days = 30) => {
  const endDate = new Date();
  const startDate = subDays(endDate, days);
  
  const filteredRecords = records.filter(record => {
    const recordDate = parseRecordDate(record.date);
    return isValid(recordDate) && recordDate >= startDate && recordDate <= endDate && record.sleep;
  });

  // 按日期分組
  const groupedData = {};
  filteredRecords.forEach(record => {
    const date = record.date.split(' ')[0];
    if (!groupedData[date]) {
      groupedData[date] = [];
    }
    groupedData[date].push(record);
  });

  // 計算每日睡眠品質分數
  const sleepScoreMap = { '好': 3, '中': 2, '差': 1 };
  const chartData = Object.keys(groupedData)
    .sort()
    .map(date => {
      const dayRecords = groupedData[date];
      const validRecords = dayRecords.filter(r => r.sleep && sleepScoreMap[r.sleep]);
      
      if (validRecords.length === 0) return null;
      
      const avgScore = validRecords.reduce((sum, r) => sum + sleepScoreMap[r.sleep], 0) / validRecords.length;
      
      return {
        date: format(parseRecordDate(date + ' 00:00:00'), 'MM/dd', { locale: zhTW }),
        score: Math.round(avgScore * 10) / 10,
        count: validRecords.length
      };
    })
    .filter(item => item !== null);

  return {
    labels: chartData.map(item => item.date),
    datasets: [
      {
        label: '睡眠品質分數',
        data: chartData.map(item => item.score),
        borderColor: 'rgb(245, 158, 11)',
        backgroundColor: 'rgba(245, 158, 11, 0.1)',
        tension: 0.4,
        pointRadius: 4,
        pointHoverRadius: 6
      }
    ]
  };
};

// 處理用餐狀況資料
export const processMealData = (records, days = 30) => {
  const endDate = new Date();
  const startDate = subDays(endDate, days);
  
  const filteredRecords = records.filter(record => {
    const recordDate = parseRecordDate(record.date);
    return isValid(recordDate) && recordDate >= startDate && recordDate <= endDate;
  });

  // 統計用餐狀況
  const mealStats = {
    breakfast: { finished: 0, half: 0, none: 0 },
    lunch: { finished: 0, half: 0, none: 0 },
    dinner: { finished: 0, half: 0, none: 0 }
  };

  filteredRecords.forEach(record => {
    ['breakfast', 'lunch', 'dinner'].forEach(meal => {
      if (record[meal]) {
        const status = record[meal] === '吃完' ? 'finished' : 
                     record[meal] === '吃一半' ? 'half' : 'none';
        mealStats[meal][status]++;
      }
    });
  });

  return {
    labels: ['早餐', '午餐', '晚餐'],
    datasets: [
      {
        label: '吃完',
        data: [
          mealStats.breakfast.finished,
          mealStats.lunch.finished,
          mealStats.dinner.finished
        ],
        backgroundColor: 'rgba(34, 197, 94, 0.8)',
        borderColor: 'rgb(34, 197, 94)',
        borderWidth: 1
      },
      {
        label: '吃一半',
        data: [
          mealStats.breakfast.half,
          mealStats.lunch.half,
          mealStats.dinner.half
        ],
        backgroundColor: 'rgba(245, 158, 11, 0.8)',
        borderColor: 'rgb(245, 158, 11)',
        borderWidth: 1
      },
      {
        label: '未進食',
        data: [
          mealStats.breakfast.none,
          mealStats.lunch.none,
          mealStats.dinner.none
        ],
        backgroundColor: 'rgba(239, 68, 68, 0.8)',
        borderColor: 'rgb(239, 68, 68)',
        borderWidth: 1
      }
    ]
  };
};

// 取得圖表選項
export const getChartOptions = (type) => {
  const baseOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          usePointStyle: true,
          padding: 20
        }
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: 'white',
        bodyColor: 'white',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1
      }
    },
    scales: {
      x: {
        display: true,
        title: {
          display: true,
          text: '日期'
        },
        grid: {
          display: false
        }
      },
      y: {
        display: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.1)'
        }
      }
    },
    interaction: {
      mode: 'nearest',
      axis: 'x',
      intersect: false
    }
  };

  if (type === 'bloodPressure') {
    return {
      ...baseOptions,
      scales: {
        ...baseOptions.scales,
        y: {
          ...baseOptions.scales.y,
          title: {
            display: true,
            text: '血壓 (mmHg)'
          },
          min: 60,
          max: 200
        }
      }
    };
  }

  if (type === 'temperature') {
    return {
      ...baseOptions,
      scales: {
        ...baseOptions.scales,
        y: {
          ...baseOptions.scales.y,
          title: {
            display: true,
            text: '體溫 (°C)'
          },
          min: 35,
          max: 40
        }
      }
    };
  }

  if (type === 'waterIntake') {
    return {
      ...baseOptions,
      scales: {
        ...baseOptions.scales,
        y: {
          ...baseOptions.scales.y,
          title: {
            display: true,
            text: '喝水量 (ml)'
          },
          beginAtZero: true
        }
      }
    };
  }

  if (type === 'sleepQuality') {
    return {
      ...baseOptions,
      scales: {
        ...baseOptions.scales,
        y: {
          ...baseOptions.scales.y,
          title: {
            display: true,
            text: '睡眠品質分數'
          },
          min: 0,
          max: 3,
          ticks: {
            stepSize: 1,
            callback: function(value) {
              const labels = ['', '差', '中', '好'];
              return labels[value] || '';
            }
          }
        }
      }
    };
  }

  return baseOptions;
};
