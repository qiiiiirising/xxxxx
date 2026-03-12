import { useState, useEffect } from 'react'
import { View, Text, Button, ScrollView, Input, Image } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { User, Key, Camera, LogOut, Shield } from 'lucide-react-taro'
import { Network } from '@/network'
import './index.css'

interface UserProfile {
  id: string
  username: string
  name?: string
  avatar?: string
  role: 'admin' | 'user'
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [editName, setEditName] = useState('')
  const [editAvatar, setEditAvatar] = useState('')
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  // 加载用户信息
  const loadProfile = async () => {
    try {
      const res = await Network.request<{ data: UserProfile }>({
        url: '/api/user/profile',
        method: 'GET'
      })
      if (res.data && res.data.data) {
        setProfile(res.data.data)
        setEditName(res.data.data.name || '')
        setEditAvatar(res.data.data.avatar || '')
      }
    } catch (error) {
      console.error('加载用户信息失败:', error)
      Taro.showToast({ title: '加载失败', icon: 'none' })
    }
  }

  useEffect(() => {
    loadProfile()
  }, [])

  // 更新个人信息
  const handleUpdateProfile = async () => {
    try {
      await Network.request({
        url: '/api/user/profile',
        method: 'PUT',
        data: {
          name: editName,
          avatar: editAvatar,
        }
      })
      
      Taro.showToast({ title: '更新成功', icon: 'success' })
      setShowEditModal(false)
      loadProfile()
    } catch (error) {
      console.error('更新个人信息失败:', error)
      Taro.showToast({ title: '更新失败', icon: 'none' })
    }
  }

  // 修改密码
  const handleChangePassword = async () => {
    if (!oldPassword || !newPassword || !confirmPassword) {
      Taro.showToast({ title: '请填写完整信息', icon: 'none' })
      return
    }

    if (newPassword !== confirmPassword) {
      Taro.showToast({ title: '两次密码不一致', icon: 'none' })
      return
    }

    if (newPassword.length < 6) {
      Taro.showToast({ title: '密码至少6位', icon: 'none' })
      return
    }

    try {
      await Network.request({
        url: '/api/user/password',
        method: 'PUT',
        data: {
          oldPassword,
          newPassword,
        }
      })
      
      Taro.showToast({ title: '密码修改成功', icon: 'success' })
      setShowPasswordModal(false)
      setOldPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (error) {
      console.error('修改密码失败:', error)
      Taro.showToast({ title: '修改失败', icon: 'none' })
    }
  }

  // 退出登录
  const handleLogout = () => {
    Taro.showModal({
      title: '提示',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          Taro.removeStorageSync('token')
          Taro.removeStorageSync('user')
          Taro.showToast({ title: '已退出登录', icon: 'success' })
          setTimeout(() => {
            Taro.redirectTo({ url: '/pages/login/index' })
          }, 1000)
        }
      }
    })
  }

  return (
    <ScrollView className="h-full bg-slate-50" scrollY>
      <View className="px-4 py-6">
        {/* 用户信息卡片 */}
        <View className="bg-white rounded-2xl p-6 mb-6 shadow-sm">
          <View className="flex items-center mb-6">
            <View className="bg-gradient-to-br from-blue-500 to-indigo-600 w-20 h-20 rounded-full flex items-center justify-center mr-4">
              {profile?.avatar ? (
                <Image src={profile.avatar} className="w-20 h-20 rounded-full" />
              ) : (
                <User size={40} color="#ffffff" />
              )}
            </View>
            <View className="flex-1">
              <Text className="text-2xl font-bold text-slate-800 block mb-1">
                {profile?.name || '未设置昵称'}
              </Text>
              <Text className="text-sm text-slate-500 block">
                @{profile?.username}
              </Text>
              {profile?.role === 'admin' && (
                <View className="bg-red-100 text-red-600 text-xs px-2 py-1 rounded-full inline-block mt-2">
                  <Shield size={12} className="inline mr-1" />
                  管理员
                </View>
              )}
            </View>
          </View>

          <View className="grid grid-cols-2 gap-4">
            <Button
              className="bg-slate-100 text-slate-700 rounded-xl py-3"
              onClick={() => setShowEditModal(true)}
            >
              <View className="flex items-center justify-center">
                <Camera size={18} color="#475569" className="mr-2" />
                <Text>编辑资料</Text>
              </View>
            </Button>
            <Button
              className="bg-slate-100 text-slate-700 rounded-xl py-3"
              onClick={() => setShowPasswordModal(true)}
            >
              <View className="flex items-center justify-center">
                <Key size={18} color="#475569" className="mr-2" />
                <Text>修改密码</Text>
              </View>
            </Button>
          </View>
        </View>

        {/* 管理员入口 */}
        {profile?.role === 'admin' && (
          <Button
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl py-4 mb-6"
            onClick={() => Taro.navigateTo({ url: '/pages/admin/index' })}
          >
            <View className="flex items-center justify-center">
              <Shield size={20} color="#ffffff" className="mr-2" />
              <Text className="font-medium">用户管理</Text>
            </View>
          </Button>
        )}

        {/* 退出登录 */}
        <Button
          className="w-full bg-white text-red-500 rounded-xl py-4 border border-red-200"
          onClick={handleLogout}
        >
          <View className="flex items-center justify-center">
            <LogOut size={20} color="#ef4444" className="mr-2" />
            <Text className="font-medium">退出登录</Text>
          </View>
        </Button>
      </View>

      {/* 编辑资料弹窗 */}
      {showEditModal && (
        <View className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <View className="bg-white w-4/5 rounded-2xl p-6">
            <Text className="text-xl font-bold text-slate-800 block mb-6 text-center">编辑资料</Text>
            
            <View className="mb-4">
              <Text className="text-sm text-slate-600 block mb-2">昵称</Text>
              <View className="bg-slate-50 rounded-lg px-4 py-3">
                <View style={{ width: '100%' }}>
                  <Input
                    className="w-full bg-transparent text-base text-slate-800"
                    placeholder="请输入昵称"
                    placeholderClass="text-slate-400"
                    value={editName}
                    onInput={(e) => {
                      const name = e.detail.value
                      setEditName(name)
                    }}
                  />
                </View>
              </View>
            </View>

            <View className="mb-6">
              <Text className="text-sm text-slate-600 block mb-2">头像URL</Text>
              <View className="bg-slate-50 rounded-lg px-4 py-3">
                <View style={{ width: '100%' }}>
                  <Input
                    className="w-full bg-transparent text-base text-slate-800"
                    placeholder="请输入头像URL"
                    placeholderClass="text-slate-400"
                    value={editAvatar}
                    onInput={(e) => {
                      const avatar = e.detail.value
                      setEditAvatar(avatar)
                    }}
                  />
                </View>
              </View>
            </View>

            <View className="flex gap-3">
              <Button
                className="flex-1 bg-slate-100 text-slate-700 rounded-lg py-3"
                onClick={() => setShowEditModal(false)}
              >
                取消
              </Button>
              <Button
                className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg py-3"
                onClick={handleUpdateProfile}
              >
                保存
              </Button>
            </View>
          </View>
        </View>
      )}

      {/* 修改密码弹窗 */}
      {showPasswordModal && (
        <View className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <View className="bg-white w-4/5 rounded-2xl p-6">
            <Text className="text-xl font-bold text-slate-800 block mb-6 text-center">修改密码</Text>
            
            <View className="mb-4">
              <Text className="text-sm text-slate-600 block mb-2">原密码</Text>
              <View className="bg-slate-50 rounded-lg px-4 py-3">
                <View style={{ width: '100%' }}>
                  <Input
                    className="w-full bg-transparent text-base text-slate-800"
                    placeholder="请输入原密码"
                    placeholderClass="text-slate-400"
                    password
                    value={oldPassword}
                    onInput={(e) => {
                      const password = e.detail.value
                      setOldPassword(password)
                    }}
                  />
                </View>
              </View>
            </View>

            <View className="mb-4">
              <Text className="text-sm text-slate-600 block mb-2">新密码</Text>
              <View className="bg-slate-50 rounded-lg px-4 py-3">
                <View style={{ width: '100%' }}>
                  <Input
                    className="w-full bg-transparent text-base text-slate-800"
                    placeholder="请输入新密码（至少6位）"
                    placeholderClass="text-slate-400"
                    password
                    value={newPassword}
                    onInput={(e) => {
                      const password = e.detail.value
                      setNewPassword(password)
                    }}
                  />
                </View>
              </View>
            </View>

            <View className="mb-6">
              <Text className="text-sm text-slate-600 block mb-2">确认密码</Text>
              <View className="bg-slate-50 rounded-lg px-4 py-3">
                <View style={{ width: '100%' }}>
                  <Input
                    className="w-full bg-transparent text-base text-slate-800"
                    placeholder="请再次输入新密码"
                    placeholderClass="text-slate-400"
                    password
                    value={confirmPassword}
                    onInput={(e) => {
                      const password = e.detail.value
                      setConfirmPassword(password)
                    }}
                  />
                </View>
              </View>
            </View>

            <View className="flex gap-3">
              <Button
                className="flex-1 bg-slate-100 text-slate-700 rounded-lg py-3"
                onClick={() => setShowPasswordModal(false)}
              >
                取消
              </Button>
              <Button
                className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg py-3"
                onClick={handleChangePassword}
              >
                确认修改
              </Button>
            </View>
          </View>
        </View>
      )}
    </ScrollView>
  )
}
