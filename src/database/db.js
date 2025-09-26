import { openDB } from 'idb';

const DB_NAME = 'LongCareRecordsDB';
const DB_VERSION = 3; // 強制升級版本以修復資料表問題
const STORE_NAME = 'careRecords';
const PATIENTS_STORE_NAME = 'patients';

// 建立或開啟資料庫
export const openDatabase = async () => {
  try {
    const db = await openDB(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion) {
        console.log('資料庫升級中，舊版本:', oldVersion, '新版本:', DB_VERSION);
        
        // 強制重新建立所有資料表
        if (oldVersion < 3) {
          console.log('強制重新建立資料表');
          
          // 刪除現有資料表（如果存在）
          if (db.objectStoreNames.contains(PATIENTS_STORE_NAME)) {
            db.deleteObjectStore(PATIENTS_STORE_NAME);
          }
          if (db.objectStoreNames.contains(STORE_NAME)) {
            db.deleteObjectStore(STORE_NAME);
          }
        }
        
        // 建立個案資料表
        if (!db.objectStoreNames.contains(PATIENTS_STORE_NAME)) {
          console.log('建立個案資料表');
          const patientsStore = db.createObjectStore(PATIENTS_STORE_NAME, {
            keyPath: 'id',
            autoIncrement: true
          });
          
          // 建立個案索引
          patientsStore.createIndex('name', 'name', { unique: true });
          patientsStore.createIndex('room', 'room', { unique: false });
          patientsStore.createIndex('status', 'status', { unique: false });
        }
        
        // 建立紀錄資料表
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          console.log('建立紀錄資料表');
          const store = db.createObjectStore(STORE_NAME, {
            keyPath: 'id',
            autoIncrement: true
          });
          
          // 建立索引以便查詢
          store.createIndex('name', 'name', { unique: false });
          store.createIndex('date', 'date', { unique: false });
          store.createIndex('room', 'room', { unique: false });
          store.createIndex('patientId', 'patientId', { unique: false });
          store.createIndex('name_date', ['name', 'date'], { unique: false });
        }
      },
    });
    
    console.log('資料庫已成功開啟');
    return db;
  } catch (error) {
    console.error('開啟資料庫失敗:', error);
    throw error;
  }
};

// 取得資料庫實例
export const getDB = async () => {
  return await openDatabase();
};

// 取得個案資料表名稱
export const getPatientsStoreName = () => {
  return PATIENTS_STORE_NAME;
};

// 檢查資料庫是否可用
export const isDatabaseAvailable = () => {
  return 'indexedDB' in window;
};

// 資料庫初始化
export const initDatabase = async () => {
  if (!isDatabaseAvailable()) {
    console.warn('此瀏覽器不支援 IndexedDB，將使用 localStorage 作為備用方案');
    return false;
  }
  
  try {
    const db = await openDatabase();
    
    // 檢查必要的資料表是否存在
    const requiredStores = [STORE_NAME, PATIENTS_STORE_NAME];
    const existingStores = Array.from(db.objectStoreNames);
    
    const missingStores = requiredStores.filter(store => !existingStores.includes(store));
    
    if (missingStores.length > 0) {
      console.error('缺少必要的資料表:', missingStores);
      console.log('現有資料表:', existingStores);
      return false;
    }
    
    console.log('資料庫初始化成功，現有資料表:', existingStores);
    return true;
  } catch (error) {
    console.error('資料庫初始化失敗:', error);
    
    // 如果是資料表不存在的錯誤，提供重置建議
    if (error.message.includes('object stores was not found')) {
      console.error('資料庫結構不完整，建議重置資料庫');
      console.log('請在瀏覽器控制台執行以下指令重置資料庫：');
      console.log('localStorage.clear(); location.reload();');
    }
    
    return false;
  }
};
