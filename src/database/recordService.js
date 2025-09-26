import { getDB } from './db';

const STORE_NAME = 'careRecords';

// 新增紀錄
export const addRecord = async (record) => {
  try {
    const db = await getDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    
    // 添加時間戳
    const recordWithTimestamp = {
      ...record,
      id: Date.now(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    const id = await store.add(recordWithTimestamp);
    await tx.done;
    
    console.log('紀錄已成功新增，ID:', id);
    return { success: true, id };
  } catch (error) {
    console.error('新增紀錄失敗:', error);
    return { success: false, error: error.message };
  }
};

// 取得所有紀錄
export const getAllRecords = async () => {
  try {
    const db = await getDB();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    
    const records = await store.getAll();
    await tx.done;
    
    // 按日期排序（最新的在前）
    records.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    return { success: true, data: records };
  } catch (error) {
    console.error('取得紀錄失敗:', error);
    return { success: false, error: error.message, data: [] };
  }
};

// 根據病患姓名取得紀錄
export const getRecordsByPatient = async (patientName) => {
  try {
    const db = await getDB();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const index = store.index('name');
    
    const records = await index.getAll(patientName);
    await tx.done;
    
    // 按日期排序（最新的在前）
    records.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    return { success: true, data: records };
  } catch (error) {
    console.error('取得病患紀錄失敗:', error);
    return { success: false, error: error.message, data: [] };
  }
};

// 更新紀錄
export const updateRecord = async (id, updatedRecord) => {
  try {
    const db = await getDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    
    // 添加更新時間戳
    const recordWithTimestamp = {
      ...updatedRecord,
      id,
      updatedAt: new Date().toISOString()
    };
    
    await store.put(recordWithTimestamp);
    await tx.done;
    
    console.log('紀錄已成功更新，ID:', id);
    return { success: true };
  } catch (error) {
    console.error('更新紀錄失敗:', error);
    return { success: false, error: error.message };
  }
};

// 刪除紀錄
export const deleteRecord = async (id) => {
  try {
    const db = await getDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    
    await store.delete(id);
    await tx.done;
    
    console.log('紀錄已成功刪除，ID:', id);
    return { success: true };
  } catch (error) {
    console.error('刪除紀錄失敗:', error);
    return { success: false, error: error.message };
  }
};

// 取得所有病患姓名
export const getPatientNames = async () => {
  try {
    const result = await getAllRecords();
    if (!result.success) {
      return { success: false, data: [] };
    }
    
    const names = [...new Set(result.data.map(record => record.name))];
    return { success: true, data: names };
  } catch (error) {
    console.error('取得病患姓名失敗:', error);
    return { success: false, error: error.message, data: [] };
  }
};

// 搜尋紀錄
export const searchRecords = async (searchTerm) => {
  try {
    const result = await getAllRecords();
    if (!result.success) {
      return { success: false, data: [] };
    }
    
    const filteredRecords = result.data.filter(record => 
      record.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.room.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (record.note && record.note.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    
    return { success: true, data: filteredRecords };
  } catch (error) {
    console.error('搜尋紀錄失敗:', error);
    return { success: false, error: error.message, data: [] };
  }
};

// 取得統計資料
export const getStatistics = async () => {
  try {
    const result = await getAllRecords();
    if (!result.success) {
      return { success: false, data: {} };
    }
    
    const records = result.data;
    const stats = {
      totalRecords: records.length,
      totalPatients: new Set(records.map(r => r.name)).size,
      recordsByPatient: {},
      recordsByDate: {},
      averageWaterIntake: 0,
      averageTemperature: 0
    };
    
    // 按病患統計
    records.forEach(record => {
      if (!stats.recordsByPatient[record.name]) {
        stats.recordsByPatient[record.name] = 0;
      }
      stats.recordsByPatient[record.name]++;
    });
    
    // 按日期統計
    records.forEach(record => {
      const date = record.date.split(' ')[0]; // 只取日期部分
      if (!stats.recordsByDate[date]) {
        stats.recordsByDate[date] = 0;
      }
      stats.recordsByDate[date]++;
    });
    
    // 計算平均值
    const waterRecords = records.filter(r => r.water && !isNaN(r.water));
    if (waterRecords.length > 0) {
      stats.averageWaterIntake = Math.round(
        waterRecords.reduce((sum, r) => sum + parseInt(r.water), 0) / waterRecords.length
      );
    }
    
    const tempRecords = records.filter(r => r.temperature && !isNaN(r.temperature));
    if (tempRecords.length > 0) {
      stats.averageTemperature = Math.round(
        tempRecords.reduce((sum, r) => sum + parseFloat(r.temperature), 0) / tempRecords.length * 10
      ) / 10;
    }
    
    return { success: true, data: stats };
  } catch (error) {
    console.error('取得統計資料失敗:', error);
    return { success: false, error: error.message, data: {} };
  }
};

// 備份資料（匯出為 JSON）
export const backupData = async () => {
  try {
    const result = await getAllRecords();
    if (!result.success) {
      return { success: false, error: result.error };
    }
    
    const backup = {
      version: '1.0',
      exportDate: new Date().toISOString(),
      totalRecords: result.data.length,
      records: result.data
    };
    
    return { success: true, data: backup };
  } catch (error) {
    console.error('備份資料失敗:', error);
    return { success: false, error: error.message };
  }
};

// 還原資料（從 JSON 匯入）
export const restoreData = async (backupData) => {
  try {
    if (!backupData || !backupData.records || !Array.isArray(backupData.records)) {
      return { success: false, error: '無效的備份資料格式' };
    }
    
    const db = await getDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    
    // 清空現有資料
    await store.clear();
    
    // 匯入備份資料
    for (const record of backupData.records) {
      await store.add(record);
    }
    
    await tx.done;
    
    console.log(`已成功還原 ${backupData.records.length} 筆紀錄`);
    return { success: true, count: backupData.records.length };
  } catch (error) {
    console.error('還原資料失敗:', error);
    return { success: false, error: error.message };
  }
};
