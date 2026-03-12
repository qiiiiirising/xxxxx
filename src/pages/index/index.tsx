import { useState, useEffect } from 'react'
import { View, Text, Button, ScrollView } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { TrendingUp, LogOut, Zap, Wallet, User, TrendingDown, Minus, ArrowUpRight, ArrowDownRight, DollarSign } from 'lucide-react-taro'
import { Network } from '@/network'
import './index.css'

interface IndexData {
  indices: {
    code: string
    name: string
    price: number
    change: number
    changePercent: number
    open: number
    high: number
    low: number
    volume: number
    amount: number
  }[]
  updateTime: string
}

interface MarketStats {
  total: number
  rise: number
  fall: number
  flat: number
  riseRate: string
  fallRate: string
  updateTime: string
}

interface TopTraderStock {
  code: string
  name: string
  price: number
  change: number
  changePercent: number
  reason: string
  netInflow: number
  volume: number
}

interface TopTradersData {
  stocks: TopTraderStock[]
  updateTime: string
}

export default function IndexPage() {
  const [marketData, setMarketData] = useState<IndexData | null>(null)
  const [marketStats, setMarketStats] = useState<MarketStats | null>(null)
  const [topTraders, setTopTraders] = useState<TopTradersData | null>(null)
  const [loading, setLoading] = useState(true)

  // 登录状态检查
  useEffect(() => {
    const token = Taro.getStorageSync('token')

    if (!token) {
      Taro.showToast({ title: '请先登录', icon: 'none' })
      setTimeout(() => {
        Taro.redirectTo({ url: '/pages/login/index' })
      }, 1000)
      return
    }

    loadData()
  }, [])

  // 加载数据
  const loadData = async () => {
    setLoading(true)
    try {
      const [marketRes, statsRes, tradersRes] = await Promise.all([
        Network.request<{ data: IndexData }>({ url: '/api/stock/market', method: 'GET' }),
        Network.request<{ data: MarketStats }>({ url: '/api/stock/market-stats', method: 'GET' }),
        Network.request<{ data: TopTradersData }>({ url: '/api/stock/top-traders', method: 'GET' }),
      ])

      if (marketRes.data.data) setMarketData(marketRes.data.data)
      if (statsRes.data.data) setMarketStats(statsRes.data.data)
      if (tradersRes.data.data) setTopTraders(tradersRes.data.data)
    } catch (error) {
      console.error('加载数据失败:', error)
    } finally {
      setLoading(false)
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

  // 获取涨跌颜色
  const getChangeColor = (value: number) => {
    return value > 0 ? 'text-red-500' : value < 0 ? 'text-green-500' : 'text-gray-500'
  }

  // 格式化金额
  const formatAmount = (amount: number) => {
    if (amount >= 100000000) {
      return (amount / 100000000).toFixed(2) + '亿'
    } else if (amount >= 10000) {
      return (amount / 10000).toFixed(2) + '万'
    }
    return amount.toString()
  }

  return (
    <ScrollView className="h-full bg-gradient-to-b from-blue-50 to-indigo-50" scrollY>
      <View className="px-4 py-6 min-h-full">
        {/* 页面标题和用户信息 */}
        <View className="mb-6">
          <View className="flex justify-between items-center">
            <View className="flex items-center gap-3">
              <View className="bg-gradient-to-br from-blue-500 to-indigo-600 p-3 rounded-2xl shadow-lg">
                <TrendingUp size={32} color="#ffffff" strokeWidth={2.5} />
              </View>
              <View>
                <Text className="text-3xl font-bold text-slate-800 block mb-1">智能股票分析</Text>
                <Text className="text-sm text-slate-500 block">AI 驱动 · 专业分析 · 实时数据</Text>
              </View>
            </View>
            <View className="flex gap-2">
              <Button
                className="bg-white/80 text-slate-600 rounded-lg px-3 py-2 text-xs shadow-sm"
                onClick={loadData}
              >
                刷新
              </Button>
              <Button
                className="bg-white/80 text-slate-600 rounded-lg px-3 py-2 text-xs shadow-sm"
                onClick={handleLogout}
              >
                <View className="flex items-center">
                  <LogOut size={14} color="#64748b" />
                </View>
              </Button>
            </View>
          </View>
        </View>

        {loading ? (
          <View className="flex items-center justify-center py-20">
            <Text className="text-slate-500">加载中...</Text>
          </View>
        ) : (
          <>
            {/* 大盘行情 */}
            <View className="bg-white rounded-2xl p-5 mb-4 shadow-sm">
              <View className="flex justify-between items-center mb-4">
                <Text className="text-lg font-bold text-slate-800 block">大盘行情</Text>
                <Text className="text-xs text-slate-500">{marketData?.updateTime || ''}</Text>
              </View>

              {marketData?.indices.map((index) => (
                <View key={index.code} className="border-b border-slate-100 pb-3 mb-3 last:border-0 last:pb-0 last:mb-0">
                  <View className="flex justify-between items-center">
                    <View>
                      <Text className="text-base font-semibold text-slate-800 block">{index.name}</Text>
                      <Text className="text-xs text-slate-500">{index.code}</Text>
                    </View>
                    <View className="text-right">
                      <Text className={`text-2xl font-bold ${getChangeColor(index.change)} block`}>
                        {index.price.toFixed(2)}
                      </Text>
                      <View className="flex items-center justify-end">
                        {index.change > 0 && <ArrowUpRight size={14} color="#ef4444" className="mr-1" />}
                        {index.change < 0 && <ArrowDownRight size={14} color="#22c55e" className="mr-1" />}
                        <Text className={`text-sm ${getChangeColor(index.change)}`}>
                          {index.change > 0 ? '+' : ''}{index.change.toFixed(2)} ({index.changePercent > 0 ? '+' : ''}{index.changePercent.toFixed(2)}%)
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
              ))}
            </View>

            {/* 涨跌平盘统计 */}
            <View className="bg-white rounded-2xl p-5 mb-4 shadow-sm">
              <View className="flex justify-between items-center mb-4">
                <Text className="text-lg font-bold text-slate-800 block">涨跌平盘</Text>
                <Text className="text-xs text-slate-500">{marketStats?.updateTime || ''}</Text>
              </View>

              <View className="grid grid-cols-3 gap-4">
                <View className="bg-red-50 rounded-xl p-4">
                  <View className="flex items-center justify-center mb-2">
                    <TrendingUp size={24} color="#ef4444" />
                  </View>
                  <Text className="text-2xl font-bold text-red-500 block text-center">{marketStats?.rise || 0}</Text>
                  <Text className="text-xs text-slate-600 block text-center mt-1">上涨</Text>
                  <Text className="text-xs text-red-500 block text-center">{marketStats?.riseRate || 0}%</Text>
                </View>

                <View className="bg-green-50 rounded-xl p-4">
                  <View className="flex items-center justify-center mb-2">
                    <TrendingDown size={24} color="#22c55e" />
                  </View>
                  <Text className="text-2xl font-bold text-green-500 block text-center">{marketStats?.fall || 0}</Text>
                  <Text className="text-xs text-slate-600 block text-center mt-1">下跌</Text>
                  <Text className="text-xs text-green-500 block text-center">{marketStats?.fallRate || 0}%</Text>
                </View>

                <View className="bg-gray-50 rounded-xl p-4">
                  <View className="flex items-center justify-center mb-2">
                    <Minus size={24} color="#6b7280" />
                  </View>
                  <Text className="text-2xl font-bold text-gray-500 block text-center">{marketStats?.flat || 0}</Text>
                  <Text className="text-xs text-slate-600 block text-center mt-1">平盘</Text>
                  <Text className="text-xs text-gray-500 block text-center">--</Text>
                </View>
              </View>

              <View className="mt-3 text-center">
                <Text className="text-xs text-slate-500">共统计 {marketStats?.total || 0} 只股票</Text>
              </View>
            </View>

            {/* 龙虎榜 */}
            <View className="bg-white rounded-2xl p-5 mb-4 shadow-sm">
              <View className="flex justify-between items-center mb-4">
                <Text className="text-lg font-bold text-slate-800 block">龙虎榜</Text>
                <Text className="text-xs text-slate-500">{topTraders?.updateTime || ''}</Text>
              </View>

              <View className="space-y-3">
                {topTraders?.stocks.slice(0, 10).map((stock, index) => (
                  <View key={stock.code} className="flex justify-between items-center border-b border-slate-100 pb-3 last:border-0 last:pb-0">
                    <View className="flex items-center">
                      <View
                        className={`w-6 h-6 rounded-full flex items-center justify-center mr-3 ${
                          index < 3
                            ? 'bg-gradient-to-br from-yellow-400 to-orange-500 text-white'
                            : 'bg-slate-200 text-slate-600'
                        }`}
                      >
                        <Text className="text-xs font-bold">{index + 1}</Text>
                      </View>
                      <View>
                        <Text className="text-sm font-semibold text-slate-800 block">{stock.name}</Text>
                        <Text className="text-xs text-slate-500">{stock.code} · {stock.reason}</Text>
                      </View>
                    </View>
                    <View className="text-right">
                      <Text className={`text-lg font-bold ${getChangeColor(stock.change)} block`}>
                        {stock.price.toFixed(2)}
                      </Text>
                      <View className="flex items-center justify-end">
                        <DollarSign size={12} className="mr-1" />
                        <Text className={`text-xs ${stock.netInflow > 0 ? 'text-red-500' : 'text-green-500'}`}>
                          {stock.netInflow > 0 ? '+' : ''}{formatAmount(stock.netInflow)}
                        </Text>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          </>
        )}

        {/* 功能入口按钮 */}
        <View className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-4 py-3 z-50">
          <View className="max-w-2xl mx-auto">
            {/* 四个功能并排 */}
            <View className="flex gap-2">
              {/* 股票分析入口 */}
              <Button
                className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg py-2 shadow-lg"
                onClick={() => Taro.navigateTo({ url: '/pages/analysis/index' })}
              >
                <View className="flex items-center justify-center">
                  <TrendingUp size={18} color="#ffffff" className="mr-1" />
                  <Text className="text-sm font-medium">股票分析</Text>
                </View>
              </Button>

              {/* 智能选股入口 */}
              <Button
                className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg py-2 shadow-lg"
                onClick={() => Taro.navigateTo({ url: '/pages/stock-picker/index' })}
              >
                <View className="flex items-center justify-center">
                  <Zap size={18} color="#ffffff" className="mr-1" />
                  <Text className="text-sm font-medium">智能选股</Text>
                </View>
              </Button>

              {/* 模拟交易入口 */}
              <Button
                className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg py-2 shadow-lg"
                onClick={() => Taro.navigateTo({ url: '/pages/trading/index' })}
              >
                <View className="flex items-center justify-center">
                  <Wallet size={18} color="#ffffff" className="mr-1" />
                  <Text className="text-sm font-medium">模拟交易</Text>
                </View>
              </Button>

              {/* 个人中心入口 */}
              <Button
                className="flex-1 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-lg py-2 shadow-lg"
                onClick={() => Taro.navigateTo({ url: '/pages/profile/index' })}
              >
                <View className="flex items-center justify-center">
                  <User size={18} color="#ffffff" className="mr-1" />
                  <Text className="text-sm font-medium">个人中心</Text>
                </View>
              </Button>
            </View>
          </View>
        </View>

        {/* 底部占位，避免内容被按钮遮挡 */}
        <View className="h-32"></View>
      </View>
    </ScrollView>
  )
}
