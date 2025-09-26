import { useState, useEffect } from "react";
import { exportToExcel, exportToPDF, exportPatientReport } from "../utils/exportUtils";
import { useDatabase } from "../hooks/useDatabase";
import PatientManagement from "./PatientManagement";

export default function RecordForm() {
  const [form, setForm] = useState({
    name: "",
    age: "",
    room: "",
    breakfast: "",
    lunch: "",
    dinner: "",
    water: "",
    systolic: "",
    diastolic: "",
    pulse: "",
    temperature: "",
    sleep: "",
    note: ""
  });

  const [selectedPatient, setSelectedPatient] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredRecords, setFilteredRecords] = useState([]);
  const [showPatientManagement, setShowPatientManagement] = useState(false);
  const [selectedPatientInfo, setSelectedPatientInfo] = useState(null);

  // 使用資料庫 Hook
  const {
    isInitialized,
    isLoading,
    error,
    records,
    patientNames,
    statistics,
    createRecord,
    refreshData
  } = useDatabase();

  // 當 records 或 selectedPatient 改變時，更新過濾後的紀錄
  useEffect(() => {
    let filtered = records;
    
    if (selectedPatient) {
      filtered = records.filter(record => record.name === selectedPatient);
    }
    
    if (searchTerm) {
      filtered = filtered.filter(record => 
        record.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.room.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (record.note && record.note.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    
    setFilteredRecords(filtered);
  }, [records, selectedPatient, searchTerm]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.age || !form.room) return alert("請填寫基本資料");
    
    const recordData = {
      ...form,
      date: new Date().toLocaleString('zh-TW'),
      patientId: selectedPatientInfo?.id || null // 關聯個案 ID
    };
    
    const result = await createRecord(recordData);
    
    if (result.success) {
      setForm({
        name: "",
        age: "",
        room: "",
        breakfast: "",
        lunch: "",
        dinner: "",
        water: "",
        systolic: "",
        diastolic: "",
        pulse: "",
        temperature: "",
        sleep: "",
        note: ""
      });
      setSelectedPatientInfo(null);
      alert("紀錄已成功儲存到本地資料庫！");
    } else {
      alert(`儲存失敗：${result.error}`);
    }
  };

  // 取得選定病患的紀錄
  const getPatientRecords = () => {
    return filteredRecords;
  };

  // 匯出所有紀錄
  const handleExportAll = (format) => {
    if (format === 'excel') {
      exportToExcel(records, '長照紀錄表');
    } else if (format === 'pdf') {
      exportToPDF(records, '長照紀錄表');
    }
  };

  // 匯出單一病患紀錄
  const handleExportPatient = (format) => {
    if (!selectedPatient) {
      alert('請先選擇病患');
      return;
    }
    
    const patientRecords = getPatientRecords();
    if (format === 'excel') {
      exportToExcel(patientRecords, `${selectedPatient}_長照紀錄`);
    } else if (format === 'pdf') {
      exportToPDF(patientRecords, `${selectedPatient}_長照紀錄`);
    } else if (format === 'detailed') {
      exportPatientReport(patientRecords, selectedPatient, `${selectedPatient}_詳細報告`);
    }
  };

  // 處理搜尋
  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  // 清除搜尋
  const clearSearch = () => {
    setSearchTerm("");
  };

  // 處理個案選擇
  const handlePatientSelect = (patient) => {
    setSelectedPatientInfo(patient);
    setForm(prev => ({
      ...prev,
      name: patient.name,
      age: patient.age,
      room: patient.room
    }));
  };

  // 清除個案選擇
  const clearPatientSelection = () => {
    setSelectedPatientInfo(null);
    setForm(prev => ({
      ...prev,
      name: "",
      age: "",
      room: ""
    }));
  };

  // 載入狀態
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">正在初始化資料庫...</p>
        </div>
      </div>
    );
  }

  // 錯誤狀態
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-lg shadow-md max-w-md">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">資料庫初始化失敗</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={refreshData}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            重新嘗試
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-4 sm:mb-0">長照紀錄表</h1>
        
        {/* 統計資訊 */}
        {isInitialized && (
          <div className="text-sm text-gray-600 text-center sm:text-right">
            <p>總計紀錄: {statistics.totalRecords || 0} 筆</p>
            <p>病患數量: {statistics.totalPatients || 0} 人</p>
          </div>
        )}
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 表單區域 */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-700">新增紀錄</h2>
            <button
              type="button"
              onClick={() => setShowPatientManagement(true)}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition duration-200"
            >
              👥 個案管理
            </button>
          </div>
          
          {/* 個案選擇區域 */}
          {selectedPatientInfo ? (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-blue-900">已選擇個案</h3>
                  <p className="text-sm text-blue-700">
                    {selectedPatientInfo.name} | 年齡: {selectedPatientInfo.age} | 房號: {selectedPatientInfo.room}
                    {selectedPatientInfo.diagnosis && ` | 診斷: ${selectedPatientInfo.diagnosis}`}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={clearPatientSelection}
                  className="px-3 py-1 text-sm bg-blue-100 text-blue-800 rounded hover:bg-blue-200"
                >
                  清除選擇
                </button>
              </div>
            </div>
          ) : (
            <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <div className="text-center">
                <p className="text-gray-600 mb-2">尚未選擇個案</p>
                <button
                  type="button"
                  onClick={() => setShowPatientManagement(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition duration-200"
                >
                  選擇個案
                </button>
              </div>
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* 基本資料 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="姓名 *"
                className="border border-gray-300 p-3 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              <input
                name="age"
                value={form.age}
                onChange={handleChange}
                placeholder="年齡 *"
                type="number"
                className="border border-gray-300 p-3 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              <input
                name="room"
                value={form.room}
                onChange={handleChange}
                placeholder="房號 *"
                className="border border-gray-300 p-3 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            {/* 用餐狀況 */}
            <div>
              <h3 className="text-lg font-medium text-gray-700 mb-3">用餐狀況</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">早餐</label>
                  <select name="breakfast" value={form.breakfast} onChange={handleChange} className="w-full border border-gray-300 p-3 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">選擇</option>
                    <option value="吃完">吃完</option>
                    <option value="吃一半">吃一半</option>
                    <option value="未進食">未進食</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">午餐</label>
                  <select name="lunch" value={form.lunch} onChange={handleChange} className="w-full border border-gray-300 p-3 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">選擇</option>
                    <option value="吃完">吃完</option>
                    <option value="吃一半">吃一半</option>
                    <option value="未進食">未進食</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">晚餐</label>
                  <select name="dinner" value={form.dinner} onChange={handleChange} className="w-full border border-gray-300 p-3 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">選擇</option>
                    <option value="吃完">吃完</option>
                    <option value="吃一半">吃一半</option>
                    <option value="未進食">未進食</option>
                  </select>
                </div>
              </div>
            </div>

            {/* 喝水量 */}
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">喝水量 (ml)</label>
              <input
                name="water"
                value={form.water}
                onChange={handleChange}
                placeholder="請輸入喝水量"
                type="number"
                className="w-full border border-gray-300 p-3 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* 生命徵象 */}
            <div>
              <h3 className="text-lg font-medium text-gray-700 mb-3">生命徵象</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">收縮壓</label>
                  <input
                    name="systolic"
                    value={form.systolic}
                    onChange={handleChange}
                    placeholder="120"
                    type="number"
                    className="w-full border border-gray-300 p-3 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">舒張壓</label>
                  <input
                    name="diastolic"
                    value={form.diastolic}
                    onChange={handleChange}
                    placeholder="80"
                    type="number"
                    className="w-full border border-gray-300 p-3 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">脈搏</label>
                  <input
                    name="pulse"
                    value={form.pulse}
                    onChange={handleChange}
                    placeholder="72"
                    type="number"
                    className="w-full border border-gray-300 p-3 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">體溫 (°C)</label>
                  <input
                    name="temperature"
                    value={form.temperature}
                    onChange={handleChange}
                    placeholder="36.5"
                    type="number"
                    step="0.1"
                    className="w-full border border-gray-300 p-3 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* 睡眠狀況 */}
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">睡眠狀況</label>
              <select name="sleep" value={form.sleep} onChange={handleChange} className="w-full border border-gray-300 p-3 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">選擇</option>
                <option value="好">好</option>
                <option value="中">中</option>
                <option value="差">差</option>
              </select>
            </div>

            {/* 備註 */}
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">備註</label>
              <textarea
                name="note"
                value={form.note}
                onChange={handleChange}
                placeholder="請輸入備註..."
                rows={3}
                className="w-full border border-gray-300 p-3 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <button type="submit" className="w-full bg-blue-600 text-white p-3 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition duration-200">
              新增紀錄
            </button>
          </form>
        </div>

        {/* 歷史紀錄區域 */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-700 mb-4 sm:mb-0">歷史紀錄</h2>
            
            {/* 搜尋和篩選區域 */}
            <div className="space-y-4">
              {/* 搜尋和篩選控制項 */}
              <div className="flex flex-col sm:flex-row gap-3">
                {/* 搜尋框 */}
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={handleSearch}
                    placeholder="搜尋姓名、房號或備註..."
                    className="w-full px-3 py-2 pl-8 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <div className="absolute left-2 top-2.5 text-gray-400">
                    🔍
                  </div>
                  {searchTerm && (
                    <button
                      onClick={clearSearch}
                      className="absolute right-2 top-2.5 text-gray-400 hover:text-gray-600"
                    >
                      ✕
                    </button>
                  )}
                </div>
                
                {/* 病患選擇 */}
                {patientNames.length > 0 && (
                  <select
                    value={selectedPatient}
                    onChange={(e) => setSelectedPatient(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[120px]"
                  >
                    <option value="">所有病患</option>
                    {patientNames.map(name => (
                      <option key={name} value={name}>{name}</option>
                    ))}
                  </select>
                )}
              </div>
              
              {/* 匯出選項區域 */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-gray-700">匯出選項</h3>
                  <div className="text-xs text-gray-500">
                    顯示 {filteredRecords.length} 筆紀錄
                  </div>
                </div>
                
                <div className="space-y-4">
                  {/* 全部資料匯出 */}
                  <div>
                    <div className="text-xs font-medium text-gray-600 mb-2">全部資料</div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleExportAll('excel')}
                        disabled={records.length === 0}
                        className="flex-1 px-4 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition duration-200 flex items-center justify-center gap-2"
                      >
                        <span>📊</span>
                        <span>Excel</span>
                      </button>
                      <button
                        onClick={() => handleExportAll('pdf')}
                        disabled={records.length === 0}
                        className="flex-1 px-4 py-2 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition duration-200 flex items-center justify-center gap-2"
                      >
                        <span>📄</span>
                        <span>PDF</span>
                      </button>
                    </div>
                  </div>
                  
                  {/* 篩選結果匯出 */}
                  <div>
                    <div className="text-xs font-medium text-gray-600 mb-2">篩選結果</div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleExportPatient('excel')}
                        disabled={filteredRecords.length === 0}
                        className="flex-1 px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition duration-200 flex items-center justify-center gap-2"
                      >
                        <span>📊</span>
                        <span>Excel</span>
                      </button>
                      <button
                        onClick={() => handleExportPatient('pdf')}
                        disabled={filteredRecords.length === 0}
                        className="flex-1 px-4 py-2 bg-purple-600 text-white text-sm rounded-md hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition duration-200 flex items-center justify-center gap-2"
                      >
                        <span>📄</span>
                        <span>PDF</span>
                      </button>
                    </div>
                  </div>
                  
                  {/* 詳細報告 */}
                  <div>
                    <div className="text-xs font-medium text-gray-600 mb-2">詳細報告</div>
                    <button
                      onClick={() => handleExportPatient('detailed')}
                      disabled={!selectedPatient || filteredRecords.length === 0}
                      className="w-full px-4 py-2 bg-indigo-600 text-white text-sm rounded-md hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition duration-200 flex items-center justify-center gap-2"
                    >
                      <span>📋</span>
                      <span>{selectedPatient ? `${selectedPatient} 報告` : '選擇病患'}</span>
                    </button>
                  </div>
                </div>
                
                {/* 匯出提示 */}
                <div className="mt-4 text-xs text-gray-500">
                  💡 提示：篩選結果會根據搜尋條件和病患選擇動態更新
                </div>
              </div>
            </div>
          </div>
          {getPatientRecords().length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              {searchTerm || selectedPatient ? '沒有符合條件的紀錄' : '尚無歷史紀錄'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b">
                    <th className="text-left p-2 font-medium text-gray-600">日期</th>
                    <th className="text-left p-2 font-medium text-gray-600">姓名</th>
                    <th className="text-left p-2 font-medium text-gray-600">房號</th>
                    <th className="text-left p-2 font-medium text-gray-600">早餐</th>
                    <th className="text-left p-2 font-medium text-gray-600">午餐</th>
                    <th className="text-left p-2 font-medium text-gray-600">晚餐</th>
                    <th className="text-left p-2 font-medium text-gray-600">水量</th>
                    <th className="text-left p-2 font-medium text-gray-600">血壓</th>
                    <th className="text-left p-2 font-medium text-gray-600">脈搏</th>
                    <th className="text-left p-2 font-medium text-gray-600">體溫</th>
                    <th className="text-left p-2 font-medium text-gray-600">睡眠</th>
                    <th className="text-left p-2 font-medium text-gray-600">備註</th>
                  </tr>
                </thead>
                <tbody>
                  {getPatientRecords().map((r, i) => (
                    <tr key={i} className="border-b hover:bg-gray-50">
                      <td className="p-2 text-gray-700">{r.date}</td>
                      <td className="p-2 font-medium text-gray-900">{r.name}</td>
                      <td className="p-2 text-gray-700">{r.room}</td>
                      <td className="p-2 text-gray-700">{r.breakfast || '-'}</td>
                      <td className="p-2 text-gray-700">{r.lunch || '-'}</td>
                      <td className="p-2 text-gray-700">{r.dinner || '-'}</td>
                      <td className="p-2 text-gray-700">{r.water ? `${r.water}ml` : '-'}</td>
                      <td className="p-2 text-gray-700">
                        {r.systolic && r.diastolic ? `${r.systolic}/${r.diastolic}` : '-'}
                      </td>
                      <td className="p-2 text-gray-700">{r.pulse || '-'}</td>
                      <td className="p-2 text-gray-700">{r.temperature ? `${r.temperature}°C` : '-'}</td>
                      <td className="p-2 text-gray-700">{r.sleep || '-'}</td>
                      <td className="p-2 text-gray-700 max-w-xs truncate">{r.note || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* 個案管理模態框 */}
      {showPatientManagement && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <PatientManagement
              onPatientSelect={handlePatientSelect}
              selectedPatientId={selectedPatientInfo?.id}
              onClose={() => setShowPatientManagement(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
