// 資料庫重置工具
export const resetDatabase = async () => {
  try {
    // 刪除現有資料庫
    if ('indexedDB' in window) {
      return new Promise((resolve, reject) => {
        const deleteRequest = indexedDB.deleteDatabase('LongCareRecordsDB');
        
        deleteRequest.onsuccess = () => {
          console.log('資料庫已成功刪除');
          resolve({ success: true });
        };
        
        deleteRequest.onerror = () => {
          console.error('刪除資料庫失敗');
          reject(new Error('刪除資料庫失敗'));
        };
        
        deleteRequest.onblocked = () => {
          console.warn('資料庫刪除被阻擋，請關閉所有相關頁面');
          reject(new Error('資料庫刪除被阻擋'));
        };
      });
    } else {
      return { success: false, error: '瀏覽器不支援 IndexedDB' };
    }
  } catch (error) {
    console.error('重置資料庫失敗:', error);
    return { success: false, error: error.message };
  }
};

// 檢查資料庫狀態
export const checkDatabaseStatus = async () => {
  try {
    if (!('indexedDB' in window)) {
      return { available: false, error: '瀏覽器不支援 IndexedDB' };
    }

    // 嘗試開啟資料庫
    const request = indexedDB.open('LongCareRecordsDB');
    
    return new Promise((resolve) => {
      request.onsuccess = () => {
        const db = request.result;
        const stores = Array.from(db.objectStoreNames);
        db.close();
        
        resolve({
          available: true,
          version: db.version,
          stores: stores,
          hasPatientsStore: stores.includes('patients'),
          hasRecordsStore: stores.includes('careRecords')
        });
      };
      
      request.onerror = () => {
        resolve({
          available: false,
          error: '無法開啟資料庫'
        });
      };
      
      request.onupgradeneeded = () => {
        resolve({
          available: true,
          needsUpgrade: true,
          version: request.result.version
        });
      };
    });
  } catch (error) {
    return {
      available: false,
      error: error.message
    };
  }
};
