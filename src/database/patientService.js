import { getDB, getPatientsStoreName } from './db';

const PATIENTS_STORE = getPatientsStoreName();

// 新增個案
export const addPatient = async (patientData) => {
  try {
    const db = await getDB();
    const tx = db.transaction(PATIENTS_STORE, 'readwrite');
    const store = tx.objectStore(PATIENTS_STORE);
    
    // 添加時間戳
    const patientWithTimestamp = {
      ...patientData,
      id: Date.now(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'active' // 預設為活躍狀態
    };
    
    const id = await store.add(patientWithTimestamp);
    await tx.done;
    
    console.log('個案已成功新增，ID:', id);
    return { success: true, id };
  } catch (error) {
    console.error('新增個案失敗:', error);
    return { success: false, error: error.message };
  }
};

// 取得所有個案
export const getAllPatients = async () => {
  try {
    const db = await getDB();
    const tx = db.transaction(PATIENTS_STORE, 'readonly');
    const store = tx.objectStore(PATIENTS_STORE);
    
    const patients = await store.getAll();
    await tx.done;
    
    // 按姓名排序
    patients.sort((a, b) => a.name.localeCompare(b.name, 'zh-TW'));
    
    return { success: true, data: patients };
  } catch (error) {
    console.error('取得個案列表失敗:', error);
    return { success: false, error: error.message, data: [] };
  }
};

// 取得活躍個案
export const getActivePatients = async () => {
  try {
    const db = await getDB();
    const tx = db.transaction(PATIENTS_STORE, 'readonly');
    const store = tx.objectStore(PATIENTS_STORE);
    const index = store.index('status');
    
    const patients = await index.getAll('active');
    await tx.done;
    
    // 按姓名排序
    patients.sort((a, b) => a.name.localeCompare(b.name, 'zh-TW'));
    
    return { success: true, data: patients };
  } catch (error) {
    console.error('取得活躍個案失敗:', error);
    return { success: false, error: error.message, data: [] };
  }
};

// 根據 ID 取得個案
export const getPatientById = async (id) => {
  try {
    const db = await getDB();
    const tx = db.transaction(PATIENTS_STORE, 'readonly');
    const store = tx.objectStore(PATIENTS_STORE);
    
    const patient = await store.get(id);
    await tx.done;
    
    return { success: true, data: patient };
  } catch (error) {
    console.error('取得個案失敗:', error);
    return { success: false, error: error.message };
  }
};

// 更新個案
export const updatePatient = async (id, updatedData) => {
  try {
    const db = await getDB();
    const tx = db.transaction(PATIENTS_STORE, 'readwrite');
    const store = tx.objectStore(PATIENTS_STORE);
    
    // 取得現有個案資料
    const existingPatient = await store.get(id);
    if (!existingPatient) {
      return { success: false, error: '個案不存在' };
    }
    
    // 合併資料並添加更新時間戳
    const patientWithTimestamp = {
      ...existingPatient,
      ...updatedData,
      id,
      updatedAt: new Date().toISOString()
    };
    
    await store.put(patientWithTimestamp);
    await tx.done;
    
    console.log('個案已成功更新，ID:', id);
    return { success: true };
  } catch (error) {
    console.error('更新個案失敗:', error);
    return { success: false, error: error.message };
  }
};

// 刪除個案（軟刪除）
export const deletePatient = async (id) => {
  try {
    const db = await getDB();
    const tx = db.transaction(PATIENTS_STORE, 'readwrite');
    const store = tx.objectStore(PATIENTS_STORE);
    
    // 軟刪除：將狀態改為 inactive
    const existingPatient = await store.get(id);
    if (!existingPatient) {
      return { success: false, error: '個案不存在' };
    }
    
    const updatedPatient = {
      ...existingPatient,
      status: 'inactive',
      updatedAt: new Date().toISOString()
    };
    
    await store.put(updatedPatient);
    await tx.done;
    
    console.log('個案已成功刪除，ID:', id);
    return { success: true };
  } catch (error) {
    console.error('刪除個案失敗:', error);
    return { success: false, error: error.message };
  }
};

// 搜尋個案
export const searchPatients = async (searchTerm) => {
  try {
    const result = await getAllPatients();
    if (!result.success) {
      return { success: false, data: [] };
    }
    
    console.log('搜尋關鍵字:', searchTerm);
    console.log('所有個案資料:', result.data);
    
    const filteredPatients = result.data.filter(patient => {
      const nameMatch = patient.name.toLowerCase().includes(searchTerm.toLowerCase());
      const roomMatch = patient.room.toLowerCase().includes(searchTerm.toLowerCase());
      const diagnosisMatch = patient.diagnosis && patient.diagnosis.toLowerCase().includes(searchTerm.toLowerCase());
      const notesMatch = patient.notes && patient.notes.toLowerCase().includes(searchTerm.toLowerCase());
      
      console.log(`個案 ${patient.name}:`, {
        name: patient.name,
        room: patient.room,
        diagnosis: patient.diagnosis,
        notes: patient.notes,
        nameMatch,
        roomMatch,
        diagnosisMatch,
        notesMatch
      });
      
      return nameMatch || roomMatch || diagnosisMatch || notesMatch;
    });
    
    console.log('搜尋結果:', filteredPatients);
    return { success: true, data: filteredPatients };
  } catch (error) {
    console.error('搜尋個案失敗:', error);
    return { success: false, error: error.message, data: [] };
  }
};

// 取得個案統計
export const getPatientStatistics = async () => {
  try {
    const result = await getAllPatients();
    if (!result.success) {
      return { success: false, data: {} };
    }
    
    const patients = result.data;
    const stats = {
      totalPatients: patients.length,
      activePatients: patients.filter(p => p.status === 'active').length,
      inactivePatients: patients.filter(p => p.status === 'inactive').length,
      patientsByRoom: {},
      averageAge: 0
    };
    
    // 按房號統計
    patients.forEach(patient => {
      if (!stats.patientsByRoom[patient.room]) {
        stats.patientsByRoom[patient.room] = 0;
      }
      stats.patientsByRoom[patient.room]++;
    });
    
    // 計算平均年齡
    const ageRecords = patients.filter(p => p.age && !isNaN(p.age));
    if (ageRecords.length > 0) {
      stats.averageAge = Math.round(
        ageRecords.reduce((sum, p) => sum + parseInt(p.age), 0) / ageRecords.length
      );
    }
    
    return { success: true, data: stats };
  } catch (error) {
    console.error('取得個案統計失敗:', error);
    return { success: false, error: error.message, data: {} };
  }
};
