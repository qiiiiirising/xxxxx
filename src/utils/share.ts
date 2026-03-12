import { Share } from '@capacitor/share'
import Taro from '@tarojs/taro'

/**
 * 分享工具
 * 支持多平台：H5、小程序、原生应用
 *
 * - 原生应用：使用 @capacitor/share
 * - 小程序：使用 Taro.shareAppMessage
 * - H5：使用 Web Share API 或降级
 */

interface ShareOptions {
  title?: string
  text?: string
  url?: string
  dialogTitle?: string
}

/**
 * 分享内容到社交平台
 */
export const shareContent = async (options: ShareOptions = {}): Promise<boolean> => {
  const isCapacitor = typeof (window as any).Capacitor !== 'undefined'

  if (isCapacitor) {
    // 原生应用使用 Capacitor Share
    try {
      await Share.share({
        title: options.title || '智能股票分析',
        text: options.text || '',
        url: options.url || 'https://example.com',
        dialogTitle: options.dialogTitle || '分享到'
      })
      return true
    } catch (error: any) {
      // 用户取消分享，不视为错误
      if (error.message?.includes('canceled') || error.message?.includes('cancel')) {
        return false
      }
      console.error('Share error:', error)
      return false
    }
  } else if (Taro.getEnv() === Taro.ENV_TYPE.WEAPP) {
    // 小程序使用 Taro 分享
    // 注意：小程序需要在页面中配置 onShareAppMessage
    // 这里只是触发分享，具体分享内容由页面配置决定
    return false
  } else {
    // H5 使用 Web Share API
    if (navigator.share) {
      try {
        await navigator.share({
          title: options.title || '智能股票分析',
          text: options.text || '',
          url: options.url || window.location.href
        })
        return true
      } catch (error: any) {
        // 用户取消分享
        if (error.name === 'AbortError') {
          return false
        }
        console.error('Web Share error:', error)
        return false
      }
    } else {
      // 降级：复制到剪贴板
      try {
        const textToShare = `${options.title || ''} - ${options.text || ''} ${options.url || ''}`
        await Taro.setClipboardData({ data: textToShare })
        Taro.showToast({ title: '已复制到剪贴板', icon: 'success' })
        return true
      } catch (error) {
        console.error('Copy to clipboard error:', error)
        return false
      }
    }
  }
}

/**
 * 分享股票信息
 */
export const shareStock = async (stockCode: string, stockName: string, price: number): Promise<boolean> => {
  return shareContent({
    title: `${stockName}(${stockCode})`,
    text: `当前价格: ¥${price.toFixed(2)}，快来智能股票分析看看吧！`,
    url: `${window.location.href}?code=${stockCode}`,
    dialogTitle: '分享股票'
  })
}

/**
 * 分享分析结果
 */
export const shareAnalysis = async (stockCode: string, analysis: string): Promise<boolean> => {
  return shareContent({
    title: '智能股票分析结果',
    text: analysis.substring(0, 200) + '...',
    url: `${window.location.href}?code=${stockCode}`,
    dialogTitle: '分享分析结果'
  })
}
