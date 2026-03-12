import { useState } from 'react'
import { View, Text, Input, Button } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { Lock, User, TrendingUp } from 'lucide-react-taro'
import { Network } from '@/network'
import './index.css'

interface LoginFormData {
  username: string
  password: string
}

export default function LoginPage() {
  const [formData, setFormData] = useState<LoginFormData>({
    username: '',
    password: '',
  })
  const [loading, setLoading] = useState(false)

  const handleLogin = async () => {
    if (!formData.username.trim()) {
      Taro.showToast({ title: '请输入账号', icon: 'none' })
      return
    }

    if (!formData.password.trim()) {
      Taro.showToast({ title: '请输入密码', icon: 'none' })
      return
    }

    setLoading(true)
    try {
      const response = await Network.request<{
        code: number
        msg: string
        data: {
          token: string
          user: { id: string; username: string }
        }
      }>({
        url: '/api/auth/login',
        method: 'POST',
        data: formData,
      })

      console.log('完整响应对象:', JSON.stringify(response))
      console.log('响应数据:', response.data)

      // 检查响应结构
      if (!response || !response.data) {
        console.error('响应数据为空:', response)
        throw new Error('登录响应数据为空')
      }

      const token = response.data.data?.token
      const user = response.data.data?.user

      console.log('提取的 token:', token)
      console.log('提取的 user:', user)

      if (!token || !user) {
        console.error('token 或 user 为空:', { token, user })
        throw new Error('登录数据不完整')
      }

      // 存储 token 和用户信息
      try {
        Taro.setStorageSync('token', token)
        Taro.setStorageSync('user', user)

        // 验证存储是否成功
        const storedToken = Taro.getStorageSync('token')
        const storedUser = Taro.getStorageSync('user')

        console.log('存储验证 - token:', storedToken)
        console.log('存储验证 - user:', storedUser)

        if (!storedToken || !storedUser) {
          throw new Error('存储验证失败')
        }

        console.log('存储成功，准备跳转')
      } catch (storageError) {
        console.error('存储失败:', storageError)
        throw new Error('存储用户信息失败')
      }

      Taro.showToast({ title: '登录成功', icon: 'success' })

      // 跳转到首页（使用 redirectTo 而不是 switchTab）
      setTimeout(() => {
        console.log('开始跳转到首页')
        try {
          Taro.redirectTo({ url: '/pages/index/index' })
        } catch (navError) {
          console.error('跳转失败:', navError)
          Taro.showToast({ title: '页面跳转失败', icon: 'none' })
        }
      }, 1500)
    } catch (error) {
      console.error('登录失败:', error)
      const errorMsg = error instanceof Error ? error.message : '登录失败，请检查账号密码'
      Taro.showToast({ title: errorMsg, icon: 'none' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <View className="login-page">
      {/* Logo 区域 */}
      <View className="logo-section">
        <View className="logo-icon">
          <TrendingUp size={52} color="#ffffff" strokeWidth={2.5} />
        </View>
        <Text className="logo-title">股票智能分析</Text>
        <Text className="logo-subtitle">专业的股票技术分析工具</Text>
      </View>

      {/* 登录表单 */}
      <View className="login-form">
        <View className="form-group">
          <View className="input-wrapper">
            <User size={20} color="#94a3b8" />
            <Input
              className="form-input"
              placeholder="请输入账号"
              value={formData.username}
              onInput={(e) => setFormData({ ...formData, username: e.detail.value })}
            />
          </View>
        </View>

        <View className="form-group">
          <View className="input-wrapper">
            <Lock size={20} color="#94a3b8" />
            <Input
              className="form-input"
              placeholder="请输入密码"
              password
              value={formData.password}
              onInput={(e) => setFormData({ ...formData, password: e.detail.value })}
            />
          </View>
        </View>

        <Button
          className="login-button"
          onClick={handleLogin}
          disabled={loading}
        >
          {loading ? '登录中...' : '登录'}
        </Button>
      </View>
    </View>
  )
}
