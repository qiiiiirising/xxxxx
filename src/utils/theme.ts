/**
 * 主题配置
 */

// 深色模式颜色映射
export const darkColors = {
  // 主色
  primary: '#1890ff',
  'primary-light': '#40a9ff',
  'primary-dark': '#096dd9',

  // 背景色
  'bg-primary': '#121212',
  'bg-secondary': '#1e1e1e',
  'bg-tertiary': '#2c2c2c',
  'bg-elevated': '#383838',

  // 文字色
  'text-primary': '#ffffff',
  'text-secondary': '#b0b0b0',
  'text-tertiary': '#808080',

  // 边框色
  'border-color': '#404040',

  // 功能色
  success: '#52c41a',
  warning: '#faad14',
  error: '#ff4d4f',
  info: '#1890ff'
}

// 浅色模式颜色映射（参考 design_guidelines.md）
export const lightColors = {
  // 主色
  primary: '#1890ff',
  'primary-light': '#40a9ff',
  'primary-dark': '#096dd9',

  // 背景色
  'bg-primary': '#ffffff',
  'bg-secondary': '#f5f5f5',
  'bg-tertiary': '#fafafa',
  'bg-elevated': '#ffffff',

  // 文字色
  'text-primary': '#1f1f1f',
  'text-secondary': '#666666',
  'text-tertiary': '#999999',

  // 边框色
  'border-color': '#e5e5e5',

  // 功能色
  success: '#52c41a',
  warning: '#faad14',
  error: '#ff4d4f',
  info: '#1890ff'
}

/**
 * Tailwind CSS 深色模式配置
 *
 * 在 Tailwind 中使用:
 * - dark:bg-gray-900: 深色模式使用深灰色背景
 * - dark:text-white: 深色模式使用白色文字
 *
 * 配置示例（在 class 中）:
 * className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
 */

/**
 * 获取主题颜色
 */
export const getThemeColor = (colorName: string, isDark: boolean): string => {
  const colors = isDark ? darkColors : lightColors
  return (colors as any)[colorName] || colorName
}

/**
 * 应用主题到 CSS 变量
 */
export const applyThemeVariables = (isDark: boolean) => {
  const colors = isDark ? darkColors : lightColors

  if (typeof document !== 'undefined') {
    Object.entries(colors).forEach(([key, value]) => {
      document.documentElement.style.setProperty(`--color-${key}`, value)
    })
  }
}

/**
 * 重置主题变量
 */
export const resetThemeVariables = () => {
  if (typeof document !== 'undefined') {
    const colorNames = Object.keys(lightColors)
    colorNames.forEach((key) => {
      document.documentElement.style.removeProperty(`--color-${key}`)
    })
  }
}
