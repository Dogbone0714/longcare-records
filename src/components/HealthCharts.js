import React, { useState, useEffect, useRef } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  TimeScale
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import 'chartjs-adapter-date-fns';
import {
  processBloodPressureData,
  processTemperatureData,
  processWaterIntakeData,
  processSleepQualityData,
  processMealData,
  getChartOptions
} from '../utils/chartDataProcessor';

// 註冊 Chart.js 組件
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  TimeScale
);


const HealthCharts = ({ records, selectedPatient, onClose }) => {
  const [chartType, setChartType] = useState('bloodPressure');
  const [timeRange, setTimeRange] = useState(30);
  const [chartData, setChartData] = useState(null);
  const chartRef = useRef(null);

  // 處理圖表資料
  useEffect(() => {
    if (!records || records.length === 0) {
      setChartData(null);
      return;
    }

    let data = null;
    let type = 'line';

    switch (chartType) {
      case 'bloodPressure':
        data = processBloodPressureData(records, timeRange);
        type = 'line';
        break;
      case 'temperature':
        data = processTemperatureData(records, timeRange);
        type = 'line';
        break;
      case 'waterIntake':
        data = processWaterIntakeData(records, timeRange);
        type = 'bar';
        break;
      case 'sleepQuality':
        data = processSleepQualityData(records, timeRange);
        type = 'line';
        break;
      case 'mealStatus':
        data = processMealData(records, timeRange);
        type = 'bar';
        break;
      default:
        data = processBloodPressureData(records, timeRange);
        type = 'line';
    }

    setChartData({ data, type });
  }, [records, chartType, timeRange]);

  // 清理圖表實例
  useEffect(() => {
    const currentChart = chartRef.current;
    return () => {
      if (currentChart) {
        currentChart.destroy();
      }
    };
  }, []);

  const chartTypes = [
    { value: 'bloodPressure', label: '血壓趨勢', icon: '🩺' },
    { value: 'temperature', label: '體溫變化', icon: '🌡️' },
    { value: 'waterIntake', label: '喝水量統計', icon: '💧' },
    { value: 'sleepQuality', label: '睡眠品質', icon: '😴' },
    { value: 'mealStatus', label: '用餐狀況', icon: '🍽️' }
  ];

  const timeRanges = [
    { value: 7, label: '最近 7 天' },
    { value: 30, label: '最近 30 天' },
    { value: 90, label: '最近 3 個月' }
  ];

  const renderChart = () => {
    if (!chartData || !chartData.data) {
      return (
        <div className="flex items-center justify-center h-64 text-gray-500">
          <div className="text-center">
            <div className="text-4xl mb-2">📊</div>
            <p>沒有足夠的資料來顯示圖表</p>
            <p className="text-sm">請確保有足夠的紀錄資料</p>
          </div>
        </div>
      );
    }

    const options = getChartOptions(chartType);

    if (chartData.type === 'line') {
      return <Line ref={chartRef} data={chartData.data} options={options} />;
    } else {
      return <Bar ref={chartRef} data={chartData.data} options={options} />;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-700">
          {selectedPatient ? `${selectedPatient} 的健康趨勢` : '健康趨勢圖表'}
        </h2>
        <button
          onClick={onClose}
          className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition duration-200"
        >
          關閉
        </button>
      </div>

      {/* 圖表控制項 */}
      <div className="mb-6 space-y-4">
        {/* 圖表類型選擇 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">圖表類型</label>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            {chartTypes.map(type => (
              <button
                key={type.value}
                onClick={() => setChartType(type.value)}
                className={`px-3 py-2 rounded-md text-sm transition duration-200 ${
                  chartType === type.value
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <span className="mr-1">{type.icon}</span>
                {type.label}
              </button>
            ))}
          </div>
        </div>

        {/* 時間範圍選擇 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">時間範圍</label>
          <div className="flex gap-2">
            {timeRanges.map(range => (
              <button
                key={range.value}
                onClick={() => setTimeRange(range.value)}
                className={`px-4 py-2 rounded-md text-sm transition duration-200 ${
                  timeRange === range.value
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {range.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 圖表顯示區域 */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="h-80">
          {renderChart()}
        </div>
      </div>

      {/* 圖表說明 */}
      <div className="mt-4 text-sm text-gray-600">
        {chartType === 'bloodPressure' && (
          <p>💡 血壓趨勢圖顯示收縮壓和舒張壓的變化，幫助觀察血壓控制情況</p>
        )}
        {chartType === 'temperature' && (
          <p>💡 體溫變化圖顯示每日體溫記錄，正常範圍為 36.5-37.5°C</p>
        )}
        {chartType === 'waterIntake' && (
          <p>💡 喝水量統計顯示每日總攝水量，建議每日 1500-2000ml</p>
        )}
        {chartType === 'sleepQuality' && (
          <p>💡 睡眠品質分數：好(3分)、中(2分)、差(1分)，分數越高表示睡眠品質越好</p>
        )}
        {chartType === 'mealStatus' && (
          <p>💡 用餐狀況統計顯示各餐的進食情況，幫助評估營養攝取</p>
        )}
      </div>
    </div>
  );
};

export default HealthCharts;
