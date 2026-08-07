/**
 * LocalStorage Utility Wrapper
 * Handles safe JSON parsing and standardized storage operations with generic type casting
 */

// 1. We use a Generic Type <T> here. This tells TypeScript that whatever type of data 
// we expect back (like a string, an object, or a user array), it will return exactly that type.
export const getFromLocalStorage = <T>(key: string): T | null => {
  try {
    const item = localStorage.getItem(key);
    // If item exists, parse it as type T, otherwise return null
    return item ? (JSON.parse(item) as T) : null;
  } catch (error) {
    console.error(`Error reading localStorage key "${key}":`, error);
    return null;
  }
};

// 2. The value parameter can be anything (object, array, string), so we use type 'unknown' 
// which is safer than 'any' in TypeScript.
export const saveToLocalStorage = (key: string, value: unknown): void => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error setting localStorage key "${key}":`, error);
  }
};

// 3. Functions that don't return anything are explicitly typed with ': void'
export const removeFromLocalStorage = (key: string): void => {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error(`Error removing localStorage key "${key}":`, error);
  }
};

export const clearLocalStorage = () => {
  try {
    localStorage.clear();
  } catch (error) {
    console.error("Error clearing localStorage:", error);
  }
};