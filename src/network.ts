import Taro from '@tarojs/taro'
import { getItemSync } from '@/utils/storage'

/**
 * 网络请求模块
 * 封装 Taro.request、Taro.uploadFile、Taro.downloadFile，自动添加项目域名前缀
 * 如果请求的 url 以 http:// 或 https:// 开头，则不会添加域名前缀
 *
 * IMPORTANT: 项目已经全局注入 PROJECT_DOMAIN
 * IMPORTANT: 除非你需要添加全局参数，如给所有请求加上 header，否则不能修改此文件
 */

// 获取存储的 token
const getToken = (): string => {
  try {
    return getItemSync('token') || ''
  } catch (error) {
    return ''
  }
}

const createUrl = (url: string): string => {
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url
  }
  return `${PROJECT_DOMAIN}${url}`
}

export namespace Network {
    export const request: typeof Taro.request = option => {
        const token = getToken()
        // 所有 API 请求都需要 token（除了登录接口）
        const isAuthRequest = option.url.startsWith('/api/') && !option.url.startsWith('/api/auth/login')

        return Taro.request({
            ...option,
            url: createUrl(option.url),
            header: {
                ...option.header,
                ...(token && isAuthRequest ? { 'Authorization': `Bearer ${token}` } : {}),
            },
        })
    }

    export const uploadFile: typeof Taro.uploadFile = option => {
        return Taro.uploadFile({
            ...option,
            url: createUrl(option.url),
        })
    }

    export const downloadFile: typeof Taro.downloadFile = option => {
        return Taro.downloadFile({
            ...option,
            url: createUrl(option.url),
        })
    }
}
