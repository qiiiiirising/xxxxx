import { useState, useEffect } from 'react'
import { View, Text, Button, ScrollView } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { TrendingUp, Search, Info, Heart } from 'lucide-react-taro'
import { Network } from '@/network'
import './index.css'

interface StockPickerItem {
  code: string
  name: string
  price: number
  changePercent: number
  reason: string[]
  score: number
  industry: string
  fiveDayTrend: string
  riseProbability: number
}

interface PickerResult {
  stocks: StockPickerItem[]
  totalCount: number
  updateTime: string
  strategy: string
}

export default function StockPickerPage() {
  const [stocks, setStocks] = useState<StockPickerItem[]>([])
  const [loading, setLoading] = useState(false)
  const [totalCount, setTotalCount] = useState(0)
  const [updateTime, setUpdateTime] = useState('')
  const [selectedStrategy, setSelectedStrategy] = useState('5day_ma_jiuyun')
  const [predictionDays] = useState(3)
  const [favoriteStocks, setFavoriteStocks] = useState<string[]>([])

  const strategies = [
    { value: '5day_ma_jiuyun', label: '5日均线 + 九运', desc: '结合5日均线和九紫离火运产业趋势' },
    { value: 'macd', label: 'MACD金叉', desc: 'MACD金叉和多头排列策略' },
    { value: 'rsi', label: 'RSI超卖', desc: 'RSI超卖反弹策略' },
    { value: 'combination', label: '综合策略', desc: '多指标共振，信号最强' },
  ]

  useEffect(() => {
    // 加载自选股
    const favorites = Taro.getStorageSync('favoriteStocks') || []
    setFavoriteStocks(favorites)
  }, [])

  useEffect(() => {
    handlePickStocks()
  }, [])

  // 切换自选股
  const toggleFavorite = (code: string, name: string) => {
    let newFavorites = [...favoriteStocks]

    if (newFavorites.includes(code)) {
      newFavorites = newFavorites.filter(c => c !== code)
      Taro.showToast({
        title: `已移除自选：${name}`,
        icon: 'none'
      })
    } else {
      newFavorites.push(code)
      Taro.showToast({
        title: `已添加自选：${name}`,
        icon: 'success'
      })
    }

    setFavoriteStocks(newFavorites)
    Taro.setStorageSync('favoriteStocks', newFavorites)
  }

  // 执行智能选股
  const handlePickStocks = async () => {
    setLoading(true)
    try {
      const response = await Network.request<{ data: PickerResult }>({
        url: '/api/stock/pick',
        method: 'POST',
        data: {
          strategy: selectedStrategy,
          days: predictionDays
        }
      })

      console.log('选股结果:', response.data)

      if (response.data && response.data.data) {
        setStocks(response.data.data.stocks || [])
        setTotalCount(response.data.data.totalCount || 0)
        setUpdateTime(response.data.data.updateTime || '')
      }

      const strategyName = strategies.find(s => s.value === selectedStrategy)?.label || selectedStrategy
      Taro.showToast({
        title: `${strategyName}选出 ${response.data?.data?.stocks?.length || 0} 只`,
        icon: 'success'
      })
    } catch (error) {
      console.error('选股失败:', error)
      Taro.showToast({
        title: '选股失败，请重试',
        icon: 'none'
      })
    } finally {
      setLoading(false)
    }
  }

  // 点击股票查看详情
  const handleStockClick = (code: string) => {
    Taro.setStorageSync('pickerCode', code)
    Taro.redirectTo({
      url: `/pages/analysis/index?code=${code}`
    })
  }

  // 历史回测
  const handleBacktest = async () => {
    setLoading(true)
    try {
      const res = await Network.request<{ data: {
        startDate: string
        endDate: string
        totalReturn: number
        winRate: number
        totalTrades: number
        profitableTrades: number
        avgHoldDays: number
        bestTrade: { code: string; name: string; profit: number }
        worstTrade: { code: string; name: string; profit: number }
        monthlyReturns: Array<{ month: string; return: number }>
      } }>({
        url: '/api/stock/backtest',
        method: 'POST',
        data: {
          strategy: selectedStrategy,
          days: predictionDays
        }
      })

      const backtestData = res.data.data

      if (!backtestData) {
        throw new Error('回测数据为空')
      }

      Taro.showModal({
        title: '历史回测结果',
        content: `回测期间: ${backtestData.startDate} - ${backtestData.endDate}\n\n总收益率: ${backtestData.totalReturn.toFixed(2)}%\n胜率: ${backtestData.winRate.toFixed(2)}%\n总交易次数: ${backtestData.totalTrades}\n盈利交易: ${backtestData.profitableTrades}\n平均持仓天数: ${backtestData.avgHoldDays.toFixed(1)}\n\n最佳交易: ${backtestData.bestTrade.name} (${backtestData.bestTrade.code})\n收益: ${backtestData.bestTrade.profit.toFixed(2)}%\n\n最差交易: ${backtestData.worstTrade.name} (${backtestData.worstTrade.code})\n收益: ${backtestData.worstTrade.profit.toFixed(2)}%`,
        showCancel: false,
        confirmText: '确定'
      })
    } catch (error) {
      console.error('回测失败:', error)
      Taro.showToast({
        title: '回测失败，请重试',
        icon: 'none'
      })
    } finally {
      setLoading(false)
    }
  }

  // 获取涨跌颜色
  const getChangeColor = (value: number) => {
    return value > 0 ? 'text-red-500' : value < 0 ? 'text-green-500' : 'text-slate-500'
  }

  // 获取评分颜色
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'bg-red-500'
    if (score >= 60) return 'bg-orange-500'
    return 'bg-yellow-500'
  }

  return (
    <ScrollView className="h-full bg-slate-50" scrollY>
      <View className="px-4 py-4">
        {/* 页面标题 */}
        <View className="flex items-center mb-6">
          <View className="bg-gradient-to-br from-purple-500 to-pink-500 p-2.5 rounded-xl mr-3">
            <Search size={24} color="#ffffff" />
          </View>
          <View>
            <Text className="text-2xl font-bold text-slate-800 block">智能选股</Text>
            <Text className="text-xs text-slate-500 block">5日均线 + 九紫离火运策略</Text>
          </View>
        </View>

        {/* 策略选择 */}
        <View className="bg-white rounded-xl p-4 mb-4 shadow-sm border border-slate-200">
          <Text className="text-sm font-medium text-slate-700 block mb-3">选择选股策略</Text>
          <View className="space-y-2">
            {strategies.map((strategy) => (
              <View
                key={strategy.value}
                className={`p-3 rounded-lg border-2 ${
                  selectedStrategy === strategy.value
                    ? 'border-purple-500 bg-purple-50'
                    : 'border-slate-200 bg-slate-50'
                }`}
                onClick={() => setSelectedStrategy(strategy.value)}
              >
                <View className="flex justify-between items-center">
                  <View>
                    <Text className={`text-sm font-medium block ${
                      selectedStrategy === strategy.value ? 'text-purple-700' : 'text-slate-700'
                    }`}
                    >
                      {strategy.label}
                    </Text>
                    <Text className="text-xs text-slate-500 block mt-1">
                      {strategy.desc}
                    </Text>
                  </View>
                  <View className={`w-5 h-5 rounded-full border-2 ${
                    selectedStrategy === strategy.value
                      ? 'bg-purple-500 border-purple-500'
                      : 'border-slate-300'
                  }`}
                  />
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* 操作按钮 */}
        <View className="flex gap-3 mb-4">
          <Button
            className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg py-3 text-base font-medium"
            onClick={handlePickStocks}
            disabled={loading}
          >
            {loading ? '分析中...' : '开始选股'}
          </Button>
          {stocks.length > 0 && (
            <Button
              className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg px-4 text-base font-medium"
              onClick={handleBacktest}
              disabled={loading}
            >
              历史回测
            </Button>
          )}
        </View>

        {/* 统计信息 */}
        {totalCount > 0 && (
          <View className="bg-white rounded-xl p-4 mb-4 shadow-sm border border-slate-200">
            <View className="flex justify-between items-center">
              <Text className="text-sm text-slate-600 block">
                共筛选 {totalCount} 只股票
              </Text>
              <Text className="text-xs text-slate-400 block">
                更新时间：{updateTime}
              </Text>
            </View>
          </View>
        )}

        {/* 选股结果列表 */}
        {stocks.length > 0 ? (
          <View className="space-y-3">
            {stocks.map((stock) => (
              <View
                key={stock.code}
                className="bg-white rounded-xl p-4 shadow-sm border border-slate-200 active:bg-slate-50"
                onClick={() => handleStockClick(stock.code)}
              >
                {/* 股票头部 */}
                <View className="flex justify-between items-start mb-3">
                  <View className="flex items-center">
                    <Text className="text-base font-bold text-slate-800 block">
                      {stock.name}
                    </Text>
                    <Text className="text-sm text-slate-500 block ml-2">
                      {stock.code}
                    </Text>
                  </View>
                  <View className="flex items-center gap-2">
                    {/* 自选股按钮 */}
                    <View
                      className="p-2 active:bg-slate-100 rounded-full"
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleFavorite(stock.code, stock.name)
                      }}
                    >
                      <Heart
                        size={20}
                        color={favoriteStocks.includes(stock.code) ? '#ef4444' : '#94a3b8'}
                      />
                    </View>
                    <View className={`${getScoreColor(stock.score)} text-white px-3 py-1 rounded-full text-xs font-medium`}>
                      评分 {stock.score}
                    </View>
                  </View>
                </View>

                {/* 价格和涨幅 */}
                <View className="flex items-baseline gap-3 mb-3">
                  <Text className="text-xl font-bold text-slate-800 block">
                    {stock.price.toFixed(2)}
                  </Text>
                  <Text className={`text-sm font-medium ${getChangeColor(stock.changePercent)} block`}>
                    {stock.changePercent > 0 ? '+' : ''}{stock.changePercent.toFixed(2)}%
                  </Text>
                  <Text className="text-xs text-slate-400 block ml-auto">
                    行业：{stock.industry}
                  </Text>
                </View>

                {/* 5日趋势 */}
                <View className="flex items-center gap-2 mb-3">
                  <TrendingUp size={14} color="#64748b" />
                  <Text className="text-xs text-slate-600 block">
                    5日趋势：{stock.fiveDayTrend}
                  </Text>
                </View>

                {/* 上涨概率 */}
                <View className="bg-slate-50 rounded-lg p-3 mb-3">
                  <View className="flex justify-between items-center mb-1">
                    <Text className="text-xs text-slate-600 block">
                      3日上涨概率
                    </Text>
                    <Text className="text-sm font-bold text-purple-600 block">
                      {stock.riseProbability}%
                    </Text>
                  </View>
                  <View className="w-full bg-slate-200 rounded-full h-2">
                    <View
                      className={`h-2 rounded-full ${stock.riseProbability >= 70 ? 'bg-red-500' : stock.riseProbability >= 50 ? 'bg-orange-500' : 'bg-yellow-500'}`}
                      style={{ width: `${stock.riseProbability}%` }}
                    />
                  </View>
                </View>

                {/* 买入理由 */}
                <View>
                  <Text className="text-xs font-medium text-slate-700 block mb-2">
                    买入理由：
                  </Text>
                  <View className="space-y-1">
                    {stock.reason.map((reason, idx) => (
                      <View key={idx} className="flex items-start">
                        <View className="w-1.5 h-1.5 bg-purple-500 rounded-full mt-1.5 mr-2" />
                        <Text className="text-xs text-slate-600 block">
                          {reason}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              </View>
            ))}
          </View>
        ) : (
          /* 空状态 */
          <View className="bg-white rounded-xl p-8 shadow-sm border border-slate-200 text-center">
            <Info size={48} color="#94a3b8" className="mx-auto mb-3" />
            <Text className="text-base text-slate-500 block mb-2">
              暂无选股结果
            </Text>
            <Text className="text-sm text-slate-400 block">
              点击&ldquo;开始选股&rdquo;按钮分析市场
            </Text>
          </View>
        )}

        {/* 风险提示 */}
        <View className="mt-6 bg-yellow-50 rounded-xl p-4 border border-yellow-200">
          <Text className="text-xs text-yellow-700 block leading-relaxed">
            ⚠️ 风险提示：本选股系统仅供参考，不构成投资建议。股市有风险，投资需谨慎。选股结果基于历史数据和技术分析，无法保证未来收益。
          </Text>
        </View>
      </View>
    </ScrollView>
  )
}
