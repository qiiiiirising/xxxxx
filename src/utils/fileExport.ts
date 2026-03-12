import { Filesystem, FilesystemDirectory, FilesystemEncoding } from '@capacitor/filesystem'
import { Share } from '@capacitor/share'
import Taro from '@tarojs/taro'

/**
 * 文件导出工具
 * 支持多平台：H5、小程序、原生应用
 */

interface ExportOptions {
  content: string
  filename: string
  mimeType?: string
  shareAfterExport?: boolean
}

/**
 * 导出文件
 */
export const exportFile = async (options: ExportOptions): Promise<boolean> => {
  const isCapacitor = typeof (window as any).Capacitor !== 'undefined'

  try {
    if (isCapacitor) {
      // 原生应用使用 Capacitor Filesystem
      const fileName = options.filename
      const filePath = `Download/${fileName}`

      // 写入文件
      await Filesystem.writeFile({
        path: filePath,
        data: options.content,
        directory: FilesystemDirectory.External,
        encoding: FilesystemEncoding.UTF8
      })

      // 询问是否分享
      if (options.shareAfterExport !== false) {
        const result = await Filesystem.getUri({
          directory: FilesystemDirectory.External,
          path: filePath
        })

        await Share.share({
          title: '导出文件',
          text: options.filename,
          url: result.uri
        })
      }

      Taro.showToast({ title: '导出成功', icon: 'success' })
      return true
    } else if (Taro.getEnv() === Taro.ENV_TYPE.WEAPP) {
      // 小程序：复制到剪贴板
      await Taro.setClipboardData({ data: options.content })
      Taro.showToast({ title: '已复制到剪贴板', icon: 'success' })
      return true
    } else {
      // H5：下载文件
      const blob = new Blob([options.content], { type: options.mimeType || 'text/plain' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = options.filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      Taro.showToast({ title: '下载已开始', icon: 'success' })
      return true
    }
  } catch (error) {
    console.error('Export file error:', error)
    Taro.showToast({ title: '导出失败', icon: 'error' })
    return false
  }
}

/**
 * 导出股票分析报告
 */
export const exportStockReport = async (
  stockCode: string,
  stockName: string,
  analysis: string,
  buySignal?: string,
  sellSignal?: string,
  supportPrice?: number,
  resistancePrice?: number
): Promise<boolean> => {
  const content = `
智能股票分析报告
================
股票名称: ${stockName}
股票代码: ${stockCode}
生成时间: ${new Date().toLocaleString('zh-CN')}

【分析结论】
${analysis}

【买卖建议】
${buySignal ? `买入建议: ${buySignal}` : ''}
${sellSignal ? `卖出建议: ${sellSignal}` : ''}

【关键价位】
${supportPrice ? `支撑位: ¥${supportPrice.toFixed(2)}` : ''}
${resistancePrice ? `压力位: ¥${resistancePrice.toFixed(2)}` : ''}

---
本报告由智能股票分析应用生成
`.trim()

  const filename = `股票分析_${stockName}_${stockCode}_${new Date().getTime()}.txt`

  return exportFile({
    content,
    filename,
    mimeType: 'text/plain',
    shareAfterExport: true
  })
}

/**
 * 导出交易记录
 */
export const exportTradingRecord = async (records: any[]): Promise<boolean> => {
  if (records.length === 0) {
    Taro.showToast({ title: '暂无交易记录', icon: 'none' })
    return false
  }

  let content = '交易记录\n'
  content += '================\n'
  content += '时间\t股票\t操作\t价格\t数量\t金额\n'

  records.forEach((record: any) => {
    content += `${record.date}\t${record.stockName}\t${record.action}\t¥${record.price}\t${record.quantity}\t¥${record.amount}\n`
  })

  const filename = `交易记录_${new Date().getTime()}.csv`

  return exportFile({
    content,
    filename,
    mimeType: 'text/csv',
    shareAfterExport: true
  })
}

/**
 * 导出JSON数据
 */
export const exportJSON = async (data: any, filename: string): Promise<boolean> => {
  const content = JSON.stringify(data, null, 2)
  return exportFile({
    content,
    filename: `${filename}.json`,
    mimeType: 'application/json',
    shareAfterExport: true
  })
}
