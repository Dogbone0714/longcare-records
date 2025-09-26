import { openDB } from 'idb';

const DB_NAME = 'LongCareRecordsDB';
const DB_VERSION = 1;
const STORE_NAME = 'careRecords';

// 建立或開啟資料庫
export const openDatabase = async () => {
  try {
    const db = await openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // 建立資料表
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, {
            keyPath: 'id',
            autoIncrement: true
          });
          
          // 建立索引以便查詢
          store.createIndex('name', 'name', { unique: false });
          store.createIndex('date', 'date', { unique: false });
          store.createIndex('room', 'room', { unique: false });
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
    await openDatabase();
    return true;
  } catch (error) {
    console.error('資料庫初始化失敗:', error);
    return false;
  }
};
