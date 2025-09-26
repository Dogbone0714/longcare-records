import { useState, useEffect, useCallback } from 'react';
import { initDatabase } from '../database/db';
import { 
  addRecord, 
  getAllRecords, 
  getRecordsByPatient, 
  getPatientNames,
  updateRecord,
  deleteRecord,
  searchRecords,
  getStatistics
} from '../database/recordService';

export const useDatabase = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [records, setRecords] = useState([]);
  const [patientNames, setPatientNames] = useState([]);
  const [statistics, setStatistics] = useState({});

  // 初始化資料庫
  const initializeDatabase = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const success = await initDatabase();
      if (success) {
        setIsInitialized(true);
        await loadRecords();
        await loadPatientNames();
        await loadStatistics();
      } else {
        setError('資料庫初始化失敗，請檢查瀏覽器支援');
      }
    } catch (err) {
      console.error('資料庫初始化錯誤:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 載入所有紀錄
  const loadRecords = useCallback(async () => {
    try {
      const result = await getAllRecords();
      if (result.success) {
        setRecords(result.data);
      } else {
        setError(result.error);
      }
    } catch (err) {
      console.error('載入紀錄錯誤:', err);
      setError(err.message);
    }
  }, []);

  // 載入病患姓名
  const loadPatientNames = useCallback(async () => {
    try {
      const result = await getPatientNames();
      if (result.success) {
        setPatientNames(result.data);
      }
    } catch (err) {
      console.error('載入病患姓名錯誤:', err);
    }
  }, []);

  // 載入統計資料
  const loadStatistics = useCallback(async () => {
    try {
      const result = await getStatistics();
      if (result.success) {
        setStatistics(result.data);
      }
    } catch (err) {
      console.error('載入統計資料錯誤:', err);
    }
  }, []);

  // 新增紀錄
  const createRecord = useCallback(async (recordData) => {
    try {
      const result = await addRecord(recordData);
      if (result.success) {
        await loadRecords();
        await loadPatientNames();
        await loadStatistics();
        return { success: true };
      } else {
        return { success: false, error: result.error };
      }
    } catch (err) {
      console.error('新增紀錄錯誤:', err);
      return { success: false, error: err.message };
    }
  }, [loadRecords, loadPatientNames, loadStatistics]);

  // 更新紀錄
  const updateRecordData = useCallback(async (id, recordData) => {
    try {
      const result = await updateRecord(id, recordData);
      if (result.success) {
        await loadRecords();
        await loadStatistics();
        return { success: true };
      } else {
        return { success: false, error: result.error };
      }
    } catch (err) {
      console.error('更新紀錄錯誤:', err);
      return { success: false, error: err.message };
    }
  }, [loadRecords, loadStatistics]);

  // 刪除紀錄
  const removeRecord = useCallback(async (id) => {
    try {
      const result = await deleteRecord(id);
      if (result.success) {
        await loadRecords();
        await loadPatientNames();
        await loadStatistics();
        return { success: true };
      } else {
        return { success: false, error: result.error };
      }
    } catch (err) {
      console.error('刪除紀錄錯誤:', err);
      return { success: false, error: err.message };
    }
  }, [loadRecords, loadPatientNames, loadStatistics]);

  // 搜尋紀錄
  const searchRecordsData = useCallback(async (searchTerm) => {
    try {
      const result = await searchRecords(searchTerm);
      return result;
    } catch (err) {
      console.error('搜尋紀錄錯誤:', err);
      return { success: false, error: err.message, data: [] };
    }
  }, []);

  // 根據病患取得紀錄
  const getRecordsByPatientName = useCallback(async (patientName) => {
    try {
      const result = await getRecordsByPatient(patientName);
      return result;
    } catch (err) {
      console.error('取得病患紀錄錯誤:', err);
      return { success: false, error: err.message, data: [] };
    }
  }, []);

  // 重新整理資料
  const refreshData = useCallback(async () => {
    await loadRecords();
    await loadPatientNames();
    await loadStatistics();
  }, [loadRecords, loadPatientNames, loadStatistics]);

  // 初始化效果
  useEffect(() => {
    initializeDatabase();
  }, [initializeDatabase]);

  return {
    // 狀態
    isInitialized,
    isLoading,
    error,
    records,
    patientNames,
    statistics,
    
    // 方法
    createRecord,
    updateRecordData,
    removeRecord,
    searchRecordsData,
    getRecordsByPatientName,
    refreshData,
    loadRecords,
    loadPatientNames,
    loadStatistics
  };
};
