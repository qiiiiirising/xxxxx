import { useState, useEffect } from 'react'
import { View, Text, Button, ScrollView, Input } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { UserPlus, Ban, Shield, Trash2, Check } from 'lucide-react-taro'
import { Network } from '@/network'
import './index.css'

interface UserProfile {
  id: string
  username: string
  name?: string
  avatar?: string
  role: 'admin' | 'user'
  status: 'active' | 'disabled'
  createdAt: string
  updatedAt: string
}

export default function AdminPage() {
  const [users, setUsers] = useState<UserProfile[]>([])
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newUsername, setNewUsername] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [newName, setNewName] = useState('')
  const [newRole, setNewRole] = useState<'admin' | 'user'>('user')

  // 加载用户列表
  const loadUsers = async () => {
    try {
      const res = await Network.request<{ data: UserProfile[] }>({
        url: '/api/admin/users',
        method: 'GET'
      })
      if (res.data && res.data.data) {
        setUsers(res.data.data)
      }
    } catch (error) {
      console.error('加载用户列表失败:', error)
      Taro.showToast({ title: '加载失败', icon: 'none' })
    }
  }

  useEffect(() => {
    loadUsers()
  }, [])

  // 创建用户
  const handleCreateUser = async () => {
    if (!newUsername || !newPassword) {
      Taro.showToast({ title: '请填写完整信息', icon: 'none' })
      return
    }

    if (newPassword.length < 6) {
      Taro.showToast({ title: '密码至少6位', icon: 'none' })
      return
    }

    try {
      await Network.request({
        url: '/api/admin/users',
        method: 'POST',
        data: {
          username: newUsername,
          password: newPassword,
          name: newName,
          role: newRole,
        }
      })
      
      Taro.showToast({ title: '创建成功', icon: 'success' })
      setShowCreateModal(false)
      setNewUsername('')
      setNewPassword('')
      setNewName('')
      setNewRole('user')
      loadUsers()
    } catch (error) {
      console.error('创建用户失败:', error)
      Taro.showToast({ title: '创建失败', icon: 'none' })
    }
  }

  // 更新用户状态
  const handleUpdateUserStatus = async (userId: string, status: 'active' | 'disabled') => {
    try {
      await Network.request({
        url: `/api/admin/users/${userId}/status`,
        method: 'PUT',
        data: { status }
      })
      
      Taro.showToast({ title: status === 'active' ? '已启用' : '已禁用', icon: 'success' })
      loadUsers()
    } catch (error) {
      console.error('更新用户状态失败:', error)
      Taro.showToast({ title: '操作失败', icon: 'none' })
    }
  }

  // 删除用户
  const handleDeleteUser = async (userId: string, username: string) => {
    Taro.showModal({
      title: '确认删除',
      content: `确定要删除用户 ${username} 吗？`,
      success: async (res) => {
        if (res.confirm) {
          try {
            await Network.request({
              url: `/api/admin/users/${userId}`,
              method: 'DELETE'
            })
            
            Taro.showToast({ title: '删除成功', icon: 'success' })
            loadUsers()
          } catch (error) {
            console.error('删除用户失败:', error)
            Taro.showToast({ title: '删除失败', icon: 'none' })
          }
        }
      }
    })
  }

  return (
    <ScrollView className="h-full bg-slate-50" scrollY>
      <View className="px-4 py-6">
        {/* 页面标题 */}
        <View className="mb-6">
          <Text className="text-2xl font-bold text-slate-800 block">用户管理</Text>
          <Text className="text-sm text-slate-500 block mt-1">管理系统用户和权限</Text>
        </View>

        {/* 创建用户按钮 */}
        <Button
          className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl py-4 mb-6"
          onClick={() => setShowCreateModal(true)}
        >
          <View className="flex items-center justify-center">
            <UserPlus size={20} color="#ffffff" className="mr-2" />
            <Text className="font-medium">创建用户</Text>
          </View>
        </Button>

        {/* 用户列表 */}
        <View className="space-y-3">
          {users.map((user) => (
            <View key={user.id} className="user-card">
              <View className="user-info-header">
                <View className="user-info-content">
                  <View className="user-avatar mr-3">
                    <Text className="user-avatar-text">{user.name?.[0] || user.username[0]}</Text>
                  </View>
                  <View className="user-info-details">
                    <Text className="user-name">
                      {user.name || '未设置昵称'}
                    </Text>
                    <Text className="user-username">
                      @{user.username}
                    </Text>
                  </View>
                </View>
                <View className="user-badges">
                  {user.role === 'admin' && (
                    <View className="user-badge user-badge-admin">
                      <Shield size={12} className="mr-1" />
                      管理员
                    </View>
                  )}
                  {user.status === 'active' ? (
                    <View className="user-badge user-badge-active">
                      <Check size={12} className="mr-1" />
                      正常
                    </View>
                  ) : (
                    <View className="user-badge user-badge-disabled">
                      <Ban size={12} className="mr-1" />
                      已禁用
                    </View>
                  )}
                </View>
              </View>

              <View className="user-card-footer">
                <Text className="user-card-time">
                  创建于 {new Date(user.createdAt).toLocaleDateString('zh-CN')}
                </Text>
                <View className="user-card-actions">
                  {user.status === 'active' ? (
                    <Button
                      className="user-action-button bg-orange-100 text-orange-600"
                      onClick={() => handleUpdateUserStatus(user.id, 'disabled')}
                    >
                      <View className="flex items-center">
                        <Ban size={14} className="mr-1" />
                        <Text>禁用</Text>
                      </View>
                    </Button>
                  ) : (
                    <Button
                      className="user-action-button bg-green-100 text-green-600"
                      onClick={() => handleUpdateUserStatus(user.id, 'active')}
                    >
                      <View className="flex items-center">
                        <Check size={14} className="mr-1" />
                        <Text>启用</Text>
                      </View>
                    </Button>
                  )}
                  <Button
                    className="user-action-button bg-red-100 text-red-600"
                    onClick={() => handleDeleteUser(user.id, user.username)}
                  >
                    <View className="flex items-center">
                      <Trash2 size={14} className="mr-1" />
                      <Text>删除</Text>
                    </View>
                  </Button>
                </View>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* 创建用户弹窗 */}
      {showCreateModal && (
        <View className="create-modal">
          <View className="create-modal-content">
            <Text className="text-xl font-bold text-slate-800 block mb-6 text-center">创建用户</Text>
            
            <View className="form-input-wrapper">
              <Text className="form-label">用户名</Text>
              <View className="fix-bg-transparent">
                <Input
                  className="form-input"
                  placeholder="请输入用户名"
                  placeholderClass="text-slate-400"
                  value={newUsername}
                  onInput={(e) => {
                    const username = e.detail.value
                    setNewUsername(username)
                  }}
                />
              </View>
            </View>

            <View className="form-input-wrapper">
              <Text className="form-label">密码</Text>
              <View className="fix-bg-transparent">
                <Input
                  className="form-input"
                  placeholder="请输入密码（至少6位）"
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

            <View className="form-input-wrapper">
              <Text className="form-label">昵称</Text>
              <View className="fix-bg-transparent">
                <Input
                  className="form-input"
                  placeholder="请输入昵称（可选）"
                  placeholderClass="text-slate-400"
                  value={newName}
                  onInput={(e) => {
                    const name = e.detail.value
                    setNewName(name)
                  }}
                />
              </View>
            </View>

            <View className="mb-6">
              <Text className="form-label">角色</Text>
              <View className="flex gap-3">
                <Button
                  className={`role-button ${newRole === 'user' ? 'role-button-active' : 'role-button-inactive'}`}
                  onClick={() => setNewRole('user')}
                >
                  <Text>普通用户</Text>
                </Button>
                <Button
                  className={`role-button ${newRole === 'admin' ? 'role-button-active' : 'role-button-inactive'}`}
                  onClick={() => setNewRole('admin')}
                >
                  <Text>管理员</Text>
                </Button>
              </View>
            </View>

            <View className="flex gap-3">
              <Button
                className="flex-1 bg-slate-100 text-slate-700 rounded-lg py-3"
                onClick={() => setShowCreateModal(false)}
              >
                取消
              </Button>
              <Button
                className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg py-3"
                onClick={handleCreateUser}
              >
                创建
              </Button>
            </View>
          </View>
        </View>
      )}
    </ScrollView>
  )
}
