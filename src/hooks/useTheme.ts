import { useState, useEffect } from 'react'
import Taro from '@tarojs/taro'
import { getItemSync, setItemSync } from '@/utils/storage'

type Theme = 'light' | 'dark' | 'auto'

/**
 * 主题管理 Hook
 * 支持浅色、深色、自动三种模式
 */
export const useTheme = () => {
  const [theme, setThemeState] = useState<Theme>('auto')
  const [isDark, setIsDark] = useState(false)

  // 检测系统主题
  const checkSystemTheme = (): boolean => {
    if (Taro.getEnv() === Taro.ENV_TYPE.WEAPP) {
      // 小程序使用 Taro.getSystemInfoSync
      const systemInfo = Taro.getSystemInfoSync()
      return systemInfo.theme === 'dark'
    } else if (typeof window !== 'undefined' && window.matchMedia) {
      // H5 和原生应用使用 matchMedia
      return window.matchMedia('(prefers-color-scheme: dark)').matches
    }
    return false
  }

  // 应用主题
  const applyTheme = (currentTheme: Theme) => {
    const shouldBeDark = currentTheme === 'dark' || (currentTheme === 'auto' && checkSystemTheme())

    // 添加 dark 类到 document
    if (typeof document !== 'undefined') {
      if (shouldBeDark) {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }
    }

    // 更新状态
    setIsDark(shouldBeDark)

    // 更新小程序状态栏（仅小程序）
    if (Taro.getEnv() === Taro.ENV_TYPE.WEAPP) {
      Taro.setNavigationBarColor({
        frontColor: shouldBeDark ? '#ffffff' : '#000000',
        backgroundColor: shouldBeDark ? '#000000' : '#ffffff'
      })
    }
  }

  // 初始化主题
  useEffect(() => {
    // 读取保存的主题设置
    const savedTheme = getItemSync<Theme>('theme') || 'auto'
    setThemeState(savedTheme)
    applyTheme(savedTheme)

    // 监听系统主题变化
    if (typeof window !== 'undefined' && window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      const handleChange = () => {
        if (theme === 'auto') {
          applyTheme('auto')
        }
      }

      mediaQuery.addEventListener('change', handleChange)
      return () => mediaQuery.removeEventListener('change', handleChange)
    }
  }, [])

  // 切换主题
  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme)
    setItemSync('theme', newTheme)
    applyTheme(newTheme)
  }

  // 循环切换主题
  const toggleTheme = () => {
    const themes: Theme[] = ['light', 'dark', 'auto']
    const currentIndex = themes.indexOf(theme)
    const nextIndex = (currentIndex + 1) % themes.length
    setTheme(themes[nextIndex])
  }

  return {
    theme,
    isDark,
    setTheme,
    toggleTheme
  }
}
