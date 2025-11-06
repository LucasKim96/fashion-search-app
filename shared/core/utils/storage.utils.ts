export type StorageType = "local" | "session";

const getStorage = (type: StorageType) =>
  type === "local" ? localStorage : sessionStorage;

export const storageUtils = {
  set: (key: string, value: any, type: StorageType = "local") => {
    try {
      const serialized = JSON.stringify(value);
      getStorage(type).setItem(key, serialized);
    } catch (error) {
      console.error("Storage set error:", error);
    }
  },

  get: <T = any>(key: string, type: StorageType = "local"): T | null => {
    try {
      const data = getStorage(type).getItem(key);
      return data ? (JSON.parse(data) as T) : null;
    } catch (error) {
      console.error("Storage get error:", error);
      return null;
    }
  },

  remove: (key: string, type: StorageType = "local") => {
    try {
      getStorage(type).removeItem(key);
    } catch (error) {
      console.error("Storage remove error:", error);
    }
  },

  clear: (type: StorageType = "local") => {
    try {
      getStorage(type).clear();
    } catch (error) {
      console.error("Storage clear error:", error);
    }
  },
};
