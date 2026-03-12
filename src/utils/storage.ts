import { Preferences } from '@capacitor/preferences'
import Taro from '@tarojs/taro'

/**
 * 统一存储工具
 * 支持多平台：H5、小程序、原生应用
 *
 * - 原生应用：使用 @capacitor/preferences
 * - 小程序：使用 Taro.setStorageSync/getStorageSync
 * - H5：使用 localStorage（降级）
 */

const isCapacitor = () => {
  return typeof (window as any).Capacitor !== 'undefined'
}

class Storage {
  /**
   * 设置数据
   * @param key 键名
   * @param value 值（会自动 JSON.stringify）
   */
  async setItem(key: string, value: any): Promise<void> {
    const stringValue = JSON.stringify(value)

    if (isCapacitor()) {
      // 原生应用使用 Capacitor Preferences
      await Preferences.set({ key, value: stringValue })
    } else {
      // 小程序和 H5 使用 Taro 存储
      try {
        Taro.setStorageSync(key, stringValue)
      } catch (error) {
        console.error('Storage.setItem error:', error)
      }
    }
  }

  /**
   * 获取数据
   * @param key 键名
   * @param defaultValue 默认值（可选）
   */
  async getItem<T = any>(key: string, defaultValue?: T): Promise<T | null> {
    try {
      let value: string | null

      if (isCapacitor()) {
        // 原生应用使用 Capacitor Preferences
        const result = await Preferences.get({ key })
        value = result.value
      } else {
        // 小程序和 H5 使用 Taro 存储
        value = Taro.getStorageSync(key) || null
      }

      if (value === null) {
        return defaultValue !== undefined ? defaultValue : null
      }

      return JSON.parse(value)
    } catch (error) {
      console.error('Storage.getItem error:', error)
      return defaultValue !== undefined ? defaultValue : null
    }
  }

  /**
   * 删除数据
   * @param key 键名
   */
  async removeItem(key: string): Promise<void> {
    if (isCapacitor()) {
      await Preferences.remove({ key })
    } else {
      try {
        Taro.removeStorageSync(key)
      } catch (error) {
        console.error('Storage.removeItem error:', error)
      }
    }
  }

  /**
   * 清空所有数据
   */
  async clear(): Promise<void> {
    if (isCapacitor()) {
      await Preferences.clear()
    } else {
      try {
        Taro.clearStorageSync()
      } catch (error) {
        console.error('Storage.clear error:', error)
      }
    }
  }

  /**
   * 同步设置数据（兼容旧代码）
   * @param key 键名
   * @param value 值
   */
  setItemSync(key: string, value: any): void {
    const stringValue = JSON.stringify(value)
    Taro.setStorageSync(key, stringValue)
  }

  /**
   * 同步获取数据（兼容旧代码）
   * @param key 键名
   */
  getItemSync<T = any>(key: string): T | null {
    try {
      const value = Taro.getStorageSync(key)
      return value ? JSON.parse(value) : null
    } catch (error) {
      console.error('Storage.getItemSync error:', error)
      return null
    }
  }

  /**
   * 同步删除数据（兼容旧代码）
   * @param key 键名
   */
  removeItemSync(key: string): void {
    try {
      Taro.removeStorageSync(key)
    } catch (error) {
      console.error('Storage.removeItemSync error:', error)
    }
  }
}

// 导出单例
export const storage = new Storage()

// 导出便捷方法
export const setItem = (key: string, value: any) => storage.setItem(key, value)
export const getItem = <T = any>(key: string, defaultValue?: T) => storage.getItem<T>(key, defaultValue)
export const removeItem = (key: string) => storage.removeItem(key)
export const clear = () => storage.clear()

// 同步方法（兼容旧代码）
export const setItemSync = (key: string, value: any) => storage.setItemSync(key, value)
export const getItemSync = <T = any>(key: string) => storage.getItemSync<T>(key)
export const removeItemSync = (key: string) => storage.removeItemSync(key)
