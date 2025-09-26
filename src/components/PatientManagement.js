import React, { useState, useEffect } from 'react';
import { 
  addPatient, 
  getAllPatients, 
  updatePatient, 
  deletePatient, 
  searchPatients,
  getPatientStatistics 
} from '../database/patientService';

const PatientManagement = ({ onPatientSelect, selectedPatientId, onClose }) => {
  const [patients, setPatients] = useState([]);
  const [filteredPatients, setFilteredPatients] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingPatient, setEditingPatient] = useState(null);
  const [statistics, setStatistics] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  const [formData, setFormData] = useState({
    name: '',
    age: '',
    room: '',
    gender: '',
    diagnosis: '',
    notes: '',
    emergencyContact: '',
    emergencyPhone: ''
  });

  // 載入個案資料
  const loadPatients = async () => {
    try {
      setIsLoading(true);
      const result = await getAllPatients();
      if (result.success) {
        setPatients(result.data);
        setFilteredPatients(result.data);
      }
      
      // 載入統計資料
      const statsResult = await getPatientStatistics();
      if (statsResult.success) {
        setStatistics(statsResult.data);
      }
    } catch (error) {
      console.error('載入個案資料失敗:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 搜尋個案
  const handleSearch = async (e) => {
    const term = e.target.value;
    setSearchTerm(term);
    
    if (term.trim() === '') {
      setFilteredPatients(patients);
    } else {
      const result = await searchPatients(term);
      if (result.success) {
        setFilteredPatients(result.data);
      }
    }
  };

  // 處理表單變更
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // 提交表單
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.age || !formData.room) {
      alert('請填寫姓名、年齡和房號');
      return;
    }

    try {
      let result;
      if (editingPatient) {
        result = await updatePatient(editingPatient.id, formData);
      } else {
        result = await addPatient(formData);
      }

      if (result.success) {
        await loadPatients();
        resetForm();
        alert(editingPatient ? '個案已更新' : '個案已新增');
      } else {
        alert(`操作失敗：${result.error}`);
      }
    } catch (error) {
      console.error('提交失敗:', error);
      alert('操作失敗，請重試');
    }
  };

  // 重置表單
  const resetForm = () => {
    setFormData({
      name: '',
      age: '',
      room: '',
      gender: '',
      diagnosis: '',
      notes: '',
      emergencyContact: '',
      emergencyPhone: ''
    });
    setEditingPatient(null);
    setShowForm(false);
  };

  // 編輯個案
  const handleEdit = (patient) => {
    setEditingPatient(patient);
    setFormData({
      name: patient.name,
      age: patient.age,
      room: patient.room,
      gender: patient.gender || '',
      diagnosis: patient.diagnosis || '',
      notes: patient.notes || '',
      emergencyContact: patient.emergencyContact || '',
      emergencyPhone: patient.emergencyPhone || ''
    });
    setShowForm(true);
  };

  // 刪除個案
  const handleDelete = async (patient) => {
    if (window.confirm(`確定要刪除個案「${patient.name}」嗎？`)) {
      const result = await deletePatient(patient.id);
      if (result.success) {
        await loadPatients();
        alert('個案已刪除');
      } else {
        alert(`刪除失敗：${result.error}`);
      }
    }
  };

  // 選擇個案
  const handleSelectPatient = (patient) => {
    onPatientSelect(patient);
    onClose();
  };

  // 初始化
  useEffect(() => {
    loadPatients();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">載入中...</span>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-700">個案管理</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition duration-200"
          >
            + 新增個案
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition duration-200"
          >
            關閉
          </button>
        </div>
      </div>

      {/* 統計資訊 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-blue-600">{statistics.totalPatients || 0}</div>
          <div className="text-sm text-gray-600">總個案數</div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-green-600">{statistics.activePatients || 0}</div>
          <div className="text-sm text-gray-600">活躍個案</div>
        </div>
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-gray-600">{statistics.inactivePatients || 0}</div>
          <div className="text-sm text-gray-600">非活躍個案</div>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-purple-600">{statistics.averageAge || 0}</div>
          <div className="text-sm text-gray-600">平均年齡</div>
        </div>
      </div>

      {/* 搜尋框 */}
      <div className="mb-4">
        <input
          type="text"
          value={searchTerm}
          onChange={handleSearch}
          placeholder="搜尋個案姓名、房號或診斷..."
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* 個案列表 */}
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {filteredPatients.map(patient => (
          <div
            key={patient.id}
            className={`p-4 border rounded-lg cursor-pointer transition duration-200 ${
              selectedPatientId === patient.id
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
            }`}
            onClick={() => handleSelectPatient(patient)}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-medium text-gray-900">{patient.name}</h3>
                  <span className="text-sm text-gray-500">房號: {patient.room}</span>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    patient.status === 'active' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {patient.status === 'active' ? '活躍' : '非活躍'}
                  </span>
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  年齡: {patient.age} | 性別: {patient.gender || '未設定'} | 診斷: {patient.diagnosis || '未設定'}
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEdit(patient);
                  }}
                  className="px-3 py-1 text-sm bg-yellow-100 text-yellow-800 rounded hover:bg-yellow-200"
                >
                  編輯
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(patient);
                  }}
                  className="px-3 py-1 text-sm bg-red-100 text-red-800 rounded hover:bg-red-200"
                >
                  刪除
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 新增/編輯表單 */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">
              {editingPatient ? '編輯個案' : '新增個案'}
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">姓名 *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleFormChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">年齡 *</label>
                  <input
                    type="number"
                    name="age"
                    value={formData.age}
                    onChange={handleFormChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">性別</label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleFormChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">選擇性別</option>
                    <option value="男">男</option>
                    <option value="女">女</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">房號 *</label>
                <input
                  type="text"
                  name="room"
                  value={formData.room}
                  onChange={handleFormChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">診斷</label>
                <input
                  type="text"
                  name="diagnosis"
                  value={formData.diagnosis}
                  onChange={handleFormChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">緊急聯絡人</label>
                <input
                  type="text"
                  name="emergencyContact"
                  value={formData.emergencyContact}
                  onChange={handleFormChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">緊急聯絡電話</label>
                <input
                  type="tel"
                  name="emergencyPhone"
                  value={formData.emergencyPhone}
                  onChange={handleFormChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">備註</label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleFormChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div className="flex gap-2 pt-4">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition duration-200"
                >
                  {editingPatient ? '更新' : '新增'}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition duration-200"
                >
                  取消
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientManagement;
