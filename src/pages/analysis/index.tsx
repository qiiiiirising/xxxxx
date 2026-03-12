import { useState, useEffect } from 'react'
import { View, Text, Input, Button, ScrollView } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { TrendingUp, TrendingDown, Activity, Target, DollarSign, Newspaper, ArrowUp, ArrowDown, Heart, ArrowLeft } from 'lucide-react-taro'
import { Network } from '@/network'
import './index.css'

interface StockData {
  code: string
  name: string
  price: number
  change: number
  changePercent: number
  volume: number
  high: number
  low: number
  open: number
  prevClose: number
  turnoverRate: number
  pe: number
  marketCap: number
}

interface TechnicalIndicators {
  ma5: number
  ma10: number
  ma20: number
  ema12: number
  ema26: number
  macd: number
  signal: number
  histogram: number
  rsi: number
  bollUpper: number
  bollMiddle: number
  bollLower: number
  kdjK: number
  kdjD: number
  kdjJ: number
  obv: number
  atr: number
  netInflow: number
  mainInflow: number
  retailInflow: number
}

interface TradingAdvice {
  signal: string
  confidence: number
  reason: string
  riskLevel: string
}

interface KeyLevels {
  resistance1: number
  resistance2: number
  support1: number
  support2: number
  currentPrice: number
}

interface NewsItem {
  id: number
  title: string
  summary: string
  publishTime: string
  source: string
  impact: 'positive' | 'negative' | 'neutral'
  tags: string[]
}

interface NewsData {
  code: string
  name: string
  news: NewsItem[]
  sentiment: {
    positive: number
    negative: number
    neutral: number
  }
}

interface Level2CapitalFlow {
  netInflow: number
  mainInflow: number
  mainOutflow: number
  retailInflow: number
  retailOutflow: number
  superLargeInflow: number
  superLargeOutflow: number
  largeInflow: number
  largeOutflow: number
  mediumInflow: number
  mediumOutflow: number
  smallInflow: number
  smallOutflow: number
  unit: string
}

interface Level2BidAsk {
  bid: Array<{ price: string; volume: number; orders: number }>
  ask: Array<{ price: string; volume: number; orders: number }>
  spread: string
}

export default function StockAnalysisPage() {
  const [stockCode, setStockCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [stockData, setStockData] = useState<StockData | null>(null)
  const [indicators, setIndicators] = useState<TechnicalIndicators | null>(null)
  const [advice, setAdvice] = useState<TradingAdvice | null>(null)
  const [keyLevels, setKeyLevels] = useState<KeyLevels | null>(null)
  const [newsData, setNewsData] = useState<NewsData | null>(null)
  const [level2CapitalFlow, setLevel2CapitalFlow] = useState<Level2CapitalFlow | null>(null)
  const [level2BidAsk, setLevel2BidAsk] = useState<Level2BidAsk | null>(null)
  const [username, setUsername] = useState('')
  const [favoriteStocks, setFavoriteStocks] = useState<string[]>([])
  const [alertPrice, setAlertPrice] = useState<number | undefined>()
  const [alertDirection, setAlertDirection] = useState<'above' | 'below'>('above')
  const [priceAlerts, setPriceAlerts] = useState<any[]>([])

  // 加载自选股
  useEffect(() => {
    const favorites = Taro.getStorageSync('favoriteStocks') || []
    setFavoriteStocks(favorites)
  }, [])

  // 加载价格提醒
  useEffect(() => {
    if (stockData) {
      loadPriceAlerts(stockData.code)
    }
  }, [stockData])

  // 登录状态检查
  useEffect(() => {
    const token = Taro.getStorageSync('token')
    const user = Taro.getStorageSync('user')

    if (!token) {
      Taro.showToast({ title: '请先登录', icon: 'none' })
      setTimeout(() => {
        Taro.redirectTo({ url: '/pages/login/index' })
      }, 1000)
      return
    }

    if (user) {
      setUsername(user.username)
    }

    // 检查是否从选股页面跳转过来
    const pickerCode = Taro.getStorageSync('pickerCode')
    // 从 URL 参数获取 code（用于从选股页面跳转）
    const router = Taro.getCurrentInstance().router
    const urlCode = router?.params?.code

    if (urlCode) {
      setStockCode(urlCode)
    } else if (pickerCode) {
      setStockCode(pickerCode)
      Taro.removeStorageSync('pickerCode')
    }
  }, [])

  // 返回首页
  const handleBackToHome = () => {
    Taro.switchTab({ url: '/pages/index/index' })
  }

  // 格式化数字
  const formatNumber = (num: number | null | undefined, decimals: number = 2): string => {
    if (num === null || num === undefined || Number.isNaN(num)) {
      return '--'
    }
    return num.toFixed(decimals)
  }

  // 格式化涨跌幅
  const formatChange = (value: number | null | undefined, isPercent: boolean = false): string => {
    if (value === null || value === undefined || Number.isNaN(value)) {
      return '--'
    }
    const sign = value >= 0 ? '+' : ''
    return `${sign}${formatNumber(value)}${isPercent ? '%' : ''}`
  }

  // 获取涨跌颜色
  const getChangeColor = (value: number | null | undefined): string => {
    if (value === null || value === undefined || Number.isNaN(value)) {
      return 'text-slate-500'
    }
    return value > 0 ? 'text-red-500' : value < 0 ? 'text-green-500' : 'text-slate-500'
  }

  // 获取买卖建议标签
  const getAdviceBadge = (signal: string) => {
    const badges: Record<string, { text: string; bg: string }> = {
      '强烈买入': { text: '强烈买入', bg: 'bg-red-600' },
      '买入': { text: '买入', bg: 'bg-red-500' },
      '持有': { text: '持有', bg: 'bg-yellow-500' },
      '卖出': { text: '卖出', bg: 'bg-green-500' },
      '强烈卖出': { text: '强烈卖出', bg: 'bg-green-600' }
    }
    const badge = badges[signal] || { text: signal, bg: 'bg-slate-500' }
    return (
      <View className={`${badge.bg} text-white px-3 py-1 rounded-full text-xs font-medium`}>
        {badge.text}
      </View>
    )
  }

  // 切换自选股
  const toggleFavorite = () => {
    if (!stockData) return

    let newFavorites = [...favoriteStocks]

    if (newFavorites.includes(stockData.code)) {
      newFavorites = newFavorites.filter(c => c !== stockData.code)
      Taro.showToast({
        title: `已移除自选：${stockData.name}`,
        icon: 'none'
      })
    } else {
      newFavorites.push(stockData.code)
      Taro.showToast({
        title: `已添加自选：${stockData.name}`,
        icon: 'success'
      })
    }

    setFavoriteStocks(newFavorites)
    Taro.setStorageSync('favoriteStocks', newFavorites)
  }

  // 加载价格提醒
  const loadPriceAlerts = async (code: string) => {
    try {
      const res = await Network.request<{ data: { alerts: any[] } }>({
        url: `/api/alert/stock/${code}`,
        method: 'GET'
      })
      if (res.data.data?.alerts) {
        setPriceAlerts(res.data.data.alerts.filter((alert: any) => !alert.triggered))
      } else {
        setPriceAlerts([])
      }
    } catch (error) {
      console.error('加载价格提醒失败:', error)
      setPriceAlerts([])
    }
  }

  // 添加价格提醒
  const handleAddAlert = async () => {
    if (!stockData || !alertPrice) {
      Taro.showToast({
        title: '请输入提醒价格',
        icon: 'none'
      })
      return
    }

    try {
      await Network.request({
        url: '/api/alert/add',
        method: 'POST',
        data: {
          stockCode: stockData.code,
          stockName: stockData.name,
          targetPrice: alertPrice,
          direction: alertDirection
        }
      })

      Taro.showToast({
        title: '提醒添加成功',
        icon: 'success'
      })

      setAlertPrice(undefined)
      loadPriceAlerts(stockData.code)
    } catch (error) {
      console.error('添加提醒失败:', error)
      Taro.showToast({
        title: '添加失败，请重试',
        icon: 'none'
      })
    }
  }

  // 删除价格提醒
  const handleDeleteAlert = async (id: string) => {
    try {
      await Network.request({
        url: `/api/alert/${id}`,
        method: 'DELETE'
      })

      if (stockData) {
        loadPriceAlerts(stockData.code)
      }

      Taro.showToast({
        title: '提醒已删除',
        icon: 'success'
      })
    } catch (error) {
      console.error('删除提醒失败:', error)
      Taro.showToast({
        title: '删除失败，请重试',
        icon: 'none'
      })
    }
  }

  // 格式化时间
  const formatTime = (timeStr: string): string => {
    const now = Date.now()
    const time = new Date(timeStr).getTime()
    const diff = now - time

    const minutes = Math.floor(diff / (1000 * 60))
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (minutes < 60) return `${minutes}分钟前`
    if (hours < 24) return `${hours}小时前`
    return `${days}天前`
  }

  // 查询股票数据
  const handleSearch = async () => {
    if (!stockCode.trim()) {
      Taro.showToast({ title: '请输入股票代码', icon: 'none' })
      return
    }

    setLoading(true)
    try {
      // 1. 获取股票基础数据
      const stockRes = await Network.request<{ data: StockData }>({
        url: '/api/stock/data',
        method: 'POST',
        data: { code: stockCode.trim() }
      })
      console.log('股票数据响应:', stockRes.data)
      setStockData(stockRes.data.data)

      // 2. 获取技术指标
      const indicatorsRes = await Network.request<{ data: TechnicalIndicators }>({
        url: '/api/stock/indicators',
        method: 'POST',
        data: { code: stockCode.trim() }
      })
      console.log('技术指标响应:', indicatorsRes.data)
      setIndicators(indicatorsRes.data.data)

      // 3. 获取买卖建议和关键位置
      const adviceRes = await Network.request<{
        data: {
          advice: TradingAdvice
          keyLevels: KeyLevels
        }
      }>({
        url: '/api/stock/analysis',
        method: 'POST',
        data: { code: stockCode.trim() }
      })
      console.log('买卖建议响应:', adviceRes.data)
      setAdvice(adviceRes.data.data.advice)
      setKeyLevels(adviceRes.data.data.keyLevels)

      // 4. 获取新闻数据
      const newsRes = await Network.request<{ data: NewsData }>({
        url: '/api/stock/news',
        method: 'POST',
        data: { code: stockCode.trim() }
      })
      console.log('新闻数据响应:', newsRes.data)
      setNewsData(newsRes.data.data)

      // 5. 获取 Level-2 资金流向数据
      try {
        const capitalFlowRes = await Network.request<{ data: Level2CapitalFlow }>({
          url: '/api/level2/capital-flow',
          method: 'POST',
          data: { code: stockCode.trim() }
        })
        console.log('Level-2 资金流向响应:', capitalFlowRes.data)
        setLevel2CapitalFlow(capitalFlowRes.data.data)
      } catch (error) {
        console.error('Level-2 资金流向获取失败:', error)
        // Level-2 数据获取失败不影响主要功能
      }

      // 6. 获取 Level-2 买卖五档数据
      try {
        const bidAskRes = await Network.request<{ data: Level2BidAsk }>({
          url: '/api/level2/bid-ask',
          method: 'POST',
          data: { code: stockCode.trim() }
        })
        console.log('Level-2 买卖五档响应:', bidAskRes.data)
        setLevel2BidAsk(bidAskRes.data.data)
      } catch (error) {
        console.error('Level-2 买卖五档获取失败:', error)
        // Level-2 数据获取失败不影响主要功能
      }

      Taro.showToast({ title: '分析完成', icon: 'success' })
    } catch (error) {
      console.error('查询失败:', error)
      Taro.showToast({ title: '查询失败，请重试', icon: 'none' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <ScrollView className="h-full bg-slate-50" scrollY>
      <View className="px-4 py-4">
        {/* 页面标题和用户信息 */}
        <View className="flex justify-between items-center mb-6">
          <View className="flex items-center gap-3">
            <Button
              className="bg-slate-100 text-slate-600 rounded-lg p-2"
              onClick={handleBackToHome}
            >
              <ArrowLeft size={20} color="#64748b" />
            </Button>
            <View className="bg-gradient-to-br from-blue-500 to-indigo-600 p-2.5 rounded-xl shadow-lg">
              <TrendingUp size={24} color="#ffffff" strokeWidth={2.5} />
            </View>
            <Text className="text-2xl font-bold text-slate-800 block">
              股票智能分析
            </Text>
          </View>
          <Text className="text-sm text-slate-600 block">欢迎, {username}</Text>
        </View>

        {/* 搜索输入区 */}
        <View className="bg-white rounded-xl p-4 mb-4 shadow-sm">
          <View className="bg-slate-50 rounded-xl px-4 py-3 mb-4">
            <Input
              className="w-full bg-transparent text-base text-slate-800"
              placeholder="请输入股票代码（如 600519）"
              placeholderClass="text-slate-400"
              value={stockCode}
              onInput={(e) => setStockCode(e.detail.value)}
            />
          </View>
          <Button
            className="w-full bg-blue-600 text-white rounded-lg py-3 text-base font-medium"
            onClick={handleSearch}
            disabled={loading}
          >
            {loading ? '分析中...' : '开始分析'}
          </Button>
        </View>

        {loading ? (
          <View className="flex flex-col items-center justify-center py-12">
            <Text className="text-sm text-slate-500 block">正在分析股票数据...</Text>
          </View>
        ) : stockData ? (
          <>
            {/* 股票基本信息 */}
            <View className="bg-white rounded-xl p-4 mb-4 border border-slate-200 shadow-sm">
              <View className="flex justify-between items-center mb-3">
                <View className="flex items-center gap-2">
                  <Text className="text-xl font-bold text-slate-800 block">
                    {stockData.name} ({stockData.code})
                  </Text>
                  {/* 自选股按钮 */}
                  <View
                    className="p-1 active:bg-slate-100 rounded-full"
                    onClick={toggleFavorite}
                  >
                    <Heart
                      size={20}
                      color={favoriteStocks.includes(stockData.code) ? '#ef4444' : '#94a3b8'}
                    />
                  </View>
                </View>
                {advice && getAdviceBadge(advice.signal)}
              </View>

              <View className="flex justify-between items-end mb-4">
                <View>
                  <Text className="text-3xl font-bold text-slate-800 block mb-1">
                    {formatNumber(stockData.price)}
                  </Text>
                  <Text className={`text-base font-medium ${getChangeColor(stockData.changePercent)} block`}>
                    {formatChange(stockData.change, false)} ({formatChange(stockData.changePercent, true)})
                  </Text>
                </View>
                <View className="flex flex-col items-end">
                  <View className="flex items-center mb-1">
                    {stockData.change > 0 ? <TrendingUp size={16} color="#ef4444" /> : <TrendingDown size={16} color="#22c55e" />}
                  </View>
                  <Text className="text-xs text-slate-500 block">
                    涨跌幅: {formatNumber(stockData.changePercent)}%
                  </Text>
                </View>
              </View>

              <View className="grid grid-cols-3 gap-3">
                <View className="bg-slate-50 rounded-lg p-3">
                  <Text className="text-xs text-slate-500 block mb-1">今开</Text>
                  <Text className="text-sm font-medium text-slate-700 block">{formatNumber(stockData.open)}</Text>
                </View>
                <View className="bg-slate-50 rounded-lg p-3">
                  <Text className="text-xs text-slate-500 block mb-1">最高</Text>
                  <Text className={`text-sm font-medium ${getChangeColor(stockData.high - stockData.prevClose)} block`}>
                    {formatNumber(stockData.high)}
                  </Text>
                </View>
                <View className="bg-slate-50 rounded-lg p-3">
                  <Text className="text-xs text-slate-500 block mb-1">最低</Text>
                  <Text className={`text-sm font-medium ${getChangeColor(stockData.low - stockData.prevClose)} block`}>
                    {formatNumber(stockData.low)}
                  </Text>
                </View>
                <View className="bg-slate-50 rounded-lg p-3">
                  <Text className="text-xs text-slate-500 block mb-1">换手率</Text>
                  <Text className="text-sm font-medium text-slate-700 block">{formatNumber(stockData.turnoverRate)}%</Text>
                </View>
                <View className="bg-slate-50 rounded-lg p-3">
                  <Text className="text-xs text-slate-500 block mb-1">市盈率</Text>
                  <Text className="text-sm font-medium text-slate-700 block">{formatNumber(stockData.pe)}</Text>
                </View>
                <View className="bg-slate-50 rounded-lg p-3">
                  <Text className="text-xs text-slate-500 block mb-1">总市值</Text>
                  <Text className="text-sm font-medium text-slate-700 block">
                    {(stockData.marketCap / 100000000).toFixed(2)}亿
                  </Text>
                </View>
              </View>
            </View>

            {/* 资金流向 */}
            {indicators && (
              <View className="bg-white rounded-xl p-4 mb-4 border border-slate-200 shadow-sm">
                <View className="flex items-center mb-3">
                  <DollarSign size={20} color="#2563eb" />
                  <Text className="text-base font-semibold text-slate-700 block ml-2">资金流向</Text>
                </View>

                <View className="space-y-3">
                  <View className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                    <Text className="text-sm text-slate-600 block">净流入</Text>
                    <View className="flex items-center gap-1">
                      {indicators.netInflow > 0 ? <ArrowUp size={14} color="#ef4444" /> : <ArrowDown size={14} color="#22c55e" />}
                      <Text className={`text-base font-bold ${indicators.netInflow > 0 ? 'text-red-500' : 'text-green-500'} block`}>
                        {indicators.netInflow > 0 ? '+' : ''}{formatNumber(indicators.netInflow)}万元
                      </Text>
                    </View>
                  </View>

                  <View className="grid grid-cols-2 gap-3">
                    <View className="p-3 bg-slate-50 rounded-lg">
                      <Text className="text-xs text-slate-600 block mb-1">主力流入</Text>
                      <Text className={`text-base font-bold ${indicators.mainInflow > 0 ? 'text-red-500' : 'text-green-500'} block`}>
                        {indicators.mainInflow > 0 ? '+' : ''}{formatNumber(indicators.mainInflow)}万元
                      </Text>
                    </View>
                    <View className="p-3 bg-slate-50 rounded-lg">
                      <Text className="text-xs text-slate-600 block mb-1">散户流入</Text>
                      <Text className={`text-base font-bold ${indicators.retailInflow > 0 ? 'text-red-500' : 'text-green-500'} block`}>
                        {indicators.retailInflow > 0 ? '+' : ''}{formatNumber(indicators.retailInflow)}万元
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            )}

            {/* Level-2 数据（高级行情） */}
            {(level2CapitalFlow || level2BidAsk) && (
              <View className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 mb-4 border border-blue-200 shadow-sm">
                <View className="flex items-center mb-3">
                  <Text className="text-base font-semibold text-blue-700 block">Level-2 高级行情</Text>
                  <Text className="text-xs text-blue-500 block ml-auto">实时数据</Text>
                </View>

                {/* Level-2 资金流向明细 */}
                {level2CapitalFlow && (
                  <View className="mb-4">
                    <Text className="text-sm font-medium text-blue-700 block mb-2">资金流向明细</Text>

                    {/* 超大单 */}
                    <View className="flex justify-between items-center p-2 bg-white/50 rounded-lg mb-2">
                      <Text className="text-xs text-slate-600 block">超大单</Text>
                      <View className="flex gap-4">
                        <Text className={`text-xs ${level2CapitalFlow.superLargeInflow > 0 ? 'text-red-500' : 'text-slate-400'} block`}>
                          买: {formatNumber(level2CapitalFlow.superLargeInflow)}万元
                        </Text>
                        <Text className={`text-xs ${level2CapitalFlow.superLargeOutflow < 0 ? 'text-green-500' : 'text-slate-400'} block`}>
                          卖: {formatNumber(Math.abs(level2CapitalFlow.superLargeOutflow))}万元
                        </Text>
                      </View>
                    </View>

                    {/* 大单 */}
                    <View className="flex justify-between items-center p-2 bg-white/50 rounded-lg mb-2">
                      <Text className="text-xs text-slate-600 block">大单</Text>
                      <View className="flex gap-4">
                        <Text className={`text-xs ${level2CapitalFlow.largeInflow > 0 ? 'text-red-500' : 'text-slate-400'} block`}>
                          买: {formatNumber(level2CapitalFlow.largeInflow)}万元
                        </Text>
                        <Text className={`text-xs ${level2CapitalFlow.largeOutflow < 0 ? 'text-green-500' : 'text-slate-400'} block`}>
                          卖: {formatNumber(Math.abs(level2CapitalFlow.largeOutflow))}万元
                        </Text>
                      </View>
                    </View>

                    {/* 中单 */}
                    <View className="flex justify-between items-center p-2 bg-white/50 rounded-lg mb-2">
                      <Text className="text-xs text-slate-600 block">中单</Text>
                      <View className="flex gap-4">
                        <Text className={`text-xs ${level2CapitalFlow.mediumInflow > 0 ? 'text-red-500' : 'text-slate-400'} block`}>
                          买: {formatNumber(level2CapitalFlow.mediumInflow)}万元
                        </Text>
                        <Text className={`text-xs ${level2CapitalFlow.mediumOutflow < 0 ? 'text-green-500' : 'text-slate-400'} block`}>
                          卖: {formatNumber(Math.abs(level2CapitalFlow.mediumOutflow))}万元
                        </Text>
                      </View>
                    </View>

                    {/* 小单 */}
                    <View className="flex justify-between items-center p-2 bg-white/50 rounded-lg">
                      <Text className="text-xs text-slate-600 block">小单</Text>
                      <View className="flex gap-4">
                        <Text className={`text-xs ${level2CapitalFlow.smallInflow > 0 ? 'text-red-500' : 'text-slate-400'} block`}>
                          买: {formatNumber(level2CapitalFlow.smallInflow)}万元
                        </Text>
                        <Text className={`text-xs ${level2CapitalFlow.smallOutflow < 0 ? 'text-green-500' : 'text-slate-400'} block`}>
                          卖: {formatNumber(Math.abs(level2CapitalFlow.smallOutflow))}万元
                        </Text>
                      </View>
                    </View>
                  </View>
                )}

                {/* 买卖五档 */}
                {level2BidAsk && (
                  <View>
                    <Text className="text-sm font-medium text-blue-700 block mb-2">买卖五档</Text>

                    {/* 卖五档 */}
                    <View className="space-y-1 mb-3">
                      {level2BidAsk.ask.reverse().map((item, index) => (
                        <View key={`ask-${index}`} className="flex justify-between items-center text-xs">
                          <Text className="text-green-600 block">卖{5 - index}</Text>
                          <Text className="text-green-600 block">{item.price}</Text>
                          <Text className="text-slate-500 block">{formatNumber(item.volume / 100)}手</Text>
                          <Text className="text-slate-400 block">{item.orders}笔</Text>
                        </View>
                      ))}
                    </View>

                    {/* 当前价 */}
                    <View className="text-center py-2 bg-blue-100 rounded-lg mb-3">
                      <Text className="text-base font-bold text-blue-700 block">{level2BidAsk.spread}</Text>
                      <Text className="text-xs text-blue-500 block">买卖价差</Text>
                    </View>

                    {/* 买五档 */}
                    <View className="space-y-1">
                      {level2BidAsk.bid.map((item, index) => (
                        <View key={`bid-${index}`} className="flex justify-between items-center text-xs">
                          <Text className="text-red-600 block">买{index + 1}</Text>
                          <Text className="text-red-600 block">{item.price}</Text>
                          <Text className="text-slate-500 block">{formatNumber(item.volume / 100)}手</Text>
                          <Text className="text-slate-400 block">{item.orders}笔</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}
              </View>
            )}

            {/* 技术指标 */}
            {indicators && (
              <View className="bg-white rounded-xl p-4 mb-4 border border-slate-200 shadow-sm">
                <View className="flex items-center mb-3">
                  <Activity size={20} color="#2563eb" />
                  <Text className="text-base font-semibold text-slate-700 block ml-2">技术指标</Text>
                </View>

                {/* 均线系统 */}
                <View className="mb-4">
                  <Text className="text-sm font-medium text-slate-600 block mb-2">均线系统</Text>
                  <View className="space-y-2">
                    <View className="flex justify-between items-center">
                      <Text className="text-sm text-slate-600 block">MA5</Text>
                      <Text className="text-sm font-medium text-red-500 block">{formatNumber(indicators.ma5)}</Text>
                    </View>
                    <View className="flex justify-between items-center">
                      <Text className="text-sm text-slate-600 block">MA10</Text>
                      <Text className="text-sm font-medium text-green-500 block">{formatNumber(indicators.ma10)}</Text>
                    </View>
                    <View className="flex justify-between items-center">
                      <Text className="text-sm text-slate-600 block">MA20</Text>
                      <Text className="text-sm font-medium text-yellow-500 block">{formatNumber(indicators.ma20)}</Text>
                    </View>
                  </View>
                </View>

                {/* MACD */}
                <View className="mb-4">
                  <Text className="text-sm font-medium text-slate-600 block mb-2">MACD</Text>
                  <View className="space-y-2">
                    <View className="flex justify-between items-center">
                      <Text className="text-sm text-slate-600 block">DIF</Text>
                      <Text className="text-sm font-medium text-slate-700 block">{formatNumber(indicators.macd)}</Text>
                    </View>
                    <View className="flex justify-between items-center">
                      <Text className="text-sm text-slate-600 block">DEA</Text>
                      <Text className="text-sm font-medium text-slate-700 block">{formatNumber(indicators.signal)}</Text>
                    </View>
                    <View className="flex justify-between items-center">
                      <Text className="text-sm text-slate-600 block">MACD</Text>
                      <Text className={`text-sm font-medium ${getChangeColor(indicators.histogram)} block`}>
                        {formatNumber(indicators.histogram)}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* RSI */}
                <View className="mb-4">
                  <View className="flex justify-between items-center">
                    <Text className="text-sm font-medium text-slate-600 block">RSI (14)</Text>
                    <Text className="text-sm font-medium text-slate-700 block">{formatNumber(indicators.rsi)}</Text>
                  </View>
                  <View className="mt-2 w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                    <View
                      className="h-full"
                      style={{
                        width: `${Math.min(100, Math.max(0, indicators.rsi))}%`,
                        backgroundColor: indicators.rsi > 70 ? '#ef4444' : indicators.rsi < 30 ? '#22c55e' : '#eab308'
                      }}
                    ></View>
                  </View>
                  <Text className="text-xs text-slate-400 block mt-1">
                    {indicators.rsi > 70 ? '超买区域' : indicators.rsi < 30 ? '超卖区域' : '正常区域'}
                  </Text>
                </View>

                {/* 布林带 */}
                <View className="mb-4">
                  <Text className="text-sm font-medium text-slate-600 block mb-2">布林带</Text>
                  <View className="space-y-2">
                    <View className="flex justify-between items-center">
                      <Text className="text-sm text-slate-600 block">上轨</Text>
                      <Text className="text-sm font-medium text-red-500 block">{formatNumber(indicators.bollUpper)}</Text>
                    </View>
                    <View className="flex justify-between items-center">
                      <Text className="text-sm text-slate-600 block">中轨</Text>
                      <Text className="text-sm font-medium text-slate-700 block">{formatNumber(indicators.bollMiddle)}</Text>
                    </View>
                    <View className="flex justify-between items-center">
                      <Text className="text-sm text-slate-600 block">下轨</Text>
                      <Text className="text-sm font-medium text-green-500 block">{formatNumber(indicators.bollLower)}</Text>
                    </View>
                  </View>
                </View>

                {/* KDJ 指标 */}
                <View className="mb-4">
                  <Text className="text-sm font-medium text-slate-600 block mb-2">KDJ 指标</Text>
                  <View className="space-y-2">
                    <View className="flex justify-between items-center">
                      <Text className="text-sm text-slate-600 block">K</Text>
                      <Text className="text-sm font-medium text-slate-700 block">{formatNumber(indicators.kdjK)}</Text>
                    </View>
                    <View className="flex justify-between items-center">
                      <Text className="text-sm text-slate-600 block">D</Text>
                      <Text className="text-sm font-medium text-slate-700 block">{formatNumber(indicators.kdjD)}</Text>
                    </View>
                    <View className="flex justify-between items-center">
                      <Text className="text-sm text-slate-600 block">J</Text>
                      <Text className={`text-sm font-medium ${indicators.kdjJ > 100 ? 'text-red-500' : indicators.kdjJ < 0 ? 'text-green-500' : 'text-slate-700'} block`}>
                        {formatNumber(indicators.kdjJ)}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* ATR 和 OBV */}
                <View>
                  <Text className="text-sm font-medium text-slate-600 block mb-2">波动性指标</Text>
                  <View className="space-y-2">
                    <View className="flex justify-between items-center">
                      <Text className="text-sm text-slate-600 block">ATR (平均真实波幅)</Text>
                      <Text className="text-sm font-medium text-slate-700 block">{formatNumber(indicators.atr)}</Text>
                    </View>
                    <View className="flex justify-between items-center">
                      <Text className="text-sm text-slate-600 block">OBV (能量潮)</Text>
                      <Text className={`text-sm font-medium ${indicators.obv > 0 ? 'text-red-500' : 'text-green-500'} block`}>
                        {formatNumber(indicators.obv)}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            )}

            {/* 买卖建议 */}
            {advice && (
              <View className="bg-white rounded-xl p-4 mb-4 border border-slate-200 shadow-sm">
                <View className="flex items-center mb-3">
                  <Target size={20} color="#2563eb" />
                  <Text className="text-base font-semibold text-slate-700 block ml-2">买卖建议</Text>
                </View>

                <View className="flex items-center justify-between mb-3">
                  <Text className="text-sm text-slate-600 block">操作建议</Text>
                  {getAdviceBadge(advice.signal)}
                </View>

                <View className="space-y-2 mb-3">
                  <View className="flex justify-between items-center">
                    <Text className="text-sm text-slate-600 block">信心指数</Text>
                    <Text className="text-sm font-medium text-slate-700 block">{formatNumber(advice.confidence)}%</Text>
                  </View>
                  <View className="flex justify-between items-center">
                    <Text className="text-sm text-slate-600 block">风险等级</Text>
                    <Text className="text-sm font-medium text-slate-700 block">{advice.riskLevel}</Text>
                  </View>
                </View>

                <View className="bg-slate-50 rounded-lg p-3">
                  <Text className="text-xs text-slate-500 block mb-1">分析理由</Text>
                  <Text className="text-sm text-slate-700 block leading-relaxed">{advice.reason}</Text>
                </View>
              </View>
            )}

            {/* 关键位置 */}
            {keyLevels && (
              <View className="bg-white rounded-xl p-4 mb-4 border border-slate-200 shadow-sm">
                <View className="flex items-center mb-3">
                  <DollarSign size={20} color="#2563eb" />
                  <Text className="text-base font-semibold text-slate-700 block ml-2">关键位置</Text>
                </View>

                <View className="space-y-3">
                  <View>
                    <View className="flex justify-between items-center mb-1">
                      <Text className="text-sm text-slate-600 block">压力位 1</Text>
                      <Text className="text-sm font-medium text-red-500 block">{formatNumber(keyLevels.resistance1)}</Text>
                    </View>
                    <View className="w-full h-2 bg-red-100 rounded-full overflow-hidden">
                      <View
                        className="h-full bg-red-500"
                        style={{ width: `${Math.min(100, ((keyLevels.resistance1 - keyLevels.support2) / (keyLevels.resistance2 - keyLevels.support2)) * 100)}%` }}
                      ></View>
                    </View>
                  </View>

                  <View>
                    <View className="flex justify-between items-center mb-1">
                      <Text className="text-sm text-slate-600 block">压力位 2</Text>
                      <Text className="text-sm font-medium text-red-500 block">{formatNumber(keyLevels.resistance2)}</Text>
                    </View>
                    <View className="w-full h-2 bg-red-100 rounded-full overflow-hidden">
                      <View
                        className="h-full bg-red-500"
                        style={{ width: `${Math.min(100, ((keyLevels.resistance2 - keyLevels.support2) / (keyLevels.resistance2 - keyLevels.support2)) * 100)}%` }}
                      ></View>
                    </View>
                  </View>

                  <View>
                    <View className="flex justify-between items-center mb-1">
                      <Text className="text-sm text-slate-600 block">支撑位 1</Text>
                      <Text className="text-sm font-medium text-green-500 block">{formatNumber(keyLevels.support1)}</Text>
                    </View>
                    <View className="w-full h-2 bg-green-100 rounded-full overflow-hidden">
                      <View
                        className="h-full bg-green-500"
                        style={{ width: `${Math.min(100, ((keyLevels.support1 - keyLevels.support2) / (keyLevels.resistance2 - keyLevels.support2)) * 100)}%` }}
                      ></View>
                    </View>
                  </View>

                  <View>
                    <View className="flex justify-between items-center mb-1">
                      <Text className="text-sm text-slate-600 block">支撑位 2</Text>
                      <Text className="text-sm font-medium text-green-500 block">{formatNumber(keyLevels.support2)}</Text>
                    </View>
                    <View className="w-full h-2 bg-green-100 rounded-full overflow-hidden">
                      <View
                        className="h-full bg-green-500"
                        style={{ width: `${Math.min(100, ((keyLevels.support2 - keyLevels.support2) / (keyLevels.resistance2 - keyLevels.support2)) * 100)}%` }}
                      ></View>
                    </View>
                  </View>
                </View>

                <View className="mt-4 pt-3 border-t border-slate-100">
                  <Text className="text-xs text-slate-500 block text-center">
                    当前价格: {formatNumber(keyLevels.currentPrice)} | 距离压力1: {formatNumber(((keyLevels.resistance1 - keyLevels.currentPrice) / keyLevels.currentPrice) * 100)}%
                  </Text>
                </View>
              </View>
            )}

            {/* 新闻公告 */}
            {newsData && (
              <View className="bg-white rounded-xl p-4 mb-4 border border-slate-200 shadow-sm">
                <View className="flex items-center mb-3">
                  <Newspaper size={20} color="#2563eb" />
                  <Text className="text-base font-semibold text-slate-700 block ml-2">新闻公告</Text>
                </View>

                {/* 情绪统计 */}
                {newsData.sentiment && (
                  <View className="flex gap-2 mb-4">
                    <View className="flex-1 bg-green-50 rounded-lg p-2 text-center">
                      <Text className="text-lg font-bold text-green-600 block">{newsData.sentiment.positive}</Text>
                      <Text className="text-xs text-green-600 block">利好</Text>
                    </View>
                    <View className="flex-1 bg-gray-50 rounded-lg p-2 text-center">
                      <Text className="text-lg font-bold text-gray-600 block">{newsData.sentiment.neutral}</Text>
                      <Text className="text-xs text-gray-600 block">中性</Text>
                    </View>
                    <View className="flex-1 bg-red-50 rounded-lg p-2 text-center">
                      <Text className="text-lg font-bold text-red-600 block">{newsData.sentiment.negative}</Text>
                      <Text className="text-xs text-red-600 block">利空</Text>
                    </View>
                  </View>
                )}

                {/* 新闻列表 */}
                <View className="space-y-3">
                  {newsData.news.map((news) => (
                    <View key={news.id} className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                      <View className="flex justify-between items-start mb-2">
                        <View className="flex-1 mr-2">
                          <Text className="text-sm font-medium text-slate-700 block leading-tight mb-1">
                            {news.title}
                          </Text>
                          <Text className="text-xs text-slate-500 block leading-relaxed">
                            {news.summary}
                          </Text>
                        </View>
                        {news.impact === 'positive' && (
                          <View className="bg-green-100 px-2 py-1 rounded">
                            <Text className="text-xs text-green-600 block">利好</Text>
                          </View>
                        )}
                        {news.impact === 'negative' && (
                          <View className="bg-red-100 px-2 py-1 rounded">
                            <Text className="text-xs text-red-600 block">利空</Text>
                          </View>
                        )}
                        {news.impact === 'neutral' && (
                          <View className="bg-gray-100 px-2 py-1 rounded">
                            <Text className="text-xs text-gray-600 block">中性</Text>
                          </View>
                        )}
                      </View>

                      <View className="flex justify-between items-center">
                        <Text className="text-xs text-slate-400 block">
                          {news.source} · {formatTime(news.publishTime)}
                        </Text>
                        {news.tags && news.tags.length > 0 && (
                          <View className="flex gap-1">
                            {news.tags.map((tag, index) => (
                              <View key={index} className="bg-blue-50 px-2 py-0.5 rounded">
                                <Text className="text-xs text-blue-600 block">{tag}</Text>
                              </View>
                            ))}
                          </View>
                        )}
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* 价格提醒 */}
            {stockData && (
              <View className="bg-white rounded-xl p-4 mb-4 border border-slate-200 shadow-sm">
                <View className="flex items-center justify-between mb-3">
                  <View className="flex items-center">
                    <Target size={20} color="#8b5cf6" className="mr-2" />
                    <Text className="text-sm font-medium text-slate-700 block">价格提醒</Text>
                  </View>
                  <Text className="text-xs text-slate-400 block">
                    当前: {formatNumber(stockData.price)}元
                  </Text>
                </View>

                {/* 设置价格提醒 */}
                <View className="flex gap-2 mb-3">
                  <View className="flex-1">
                    <View className="bg-slate-50 rounded-lg px-3 py-2">
                      <Input
                        className="w-full bg-transparent text-sm text-slate-800"
                        placeholder="提醒价格"
                        placeholderClass="text-slate-400"
                        type="number"
                        onInput={(e) => setAlertPrice(parseFloat(e.detail.value))}
                      />
                    </View>
                  </View>
                  <Button
                    className="bg-blue-100 text-blue-600 rounded-lg px-3 py-2 text-sm"
                    onClick={() => setAlertDirection('above')}
                  >
                    高于
                  </Button>
                  <Button
                    className="bg-green-100 text-green-600 rounded-lg px-3 py-2 text-sm"
                    onClick={() => setAlertDirection('below')}
                  >
                    低于
                  </Button>
                </View>

                <Button
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg py-2.5 text-sm font-medium"
                  onClick={handleAddAlert}
                  disabled={!alertPrice}
                >
                  添加价格提醒
                </Button>

                {/* 现有提醒列表 */}
                {priceAlerts.length > 0 && (
                  <View className="mt-4 pt-3 border-t border-slate-100">
                    <Text className="text-xs font-medium text-slate-600 block mb-2">现有提醒</Text>
                    <View className="space-y-2">
                      {priceAlerts.map((alert) => (
                        <View
                          key={alert.id}
                          className="flex justify-between items-center bg-slate-50 rounded-lg p-2"
                        >
                          <View className="flex items-center">
                            <View className={`px-2 py-0.5 rounded mr-2 ${alert.direction === 'above' ? 'bg-blue-100' : 'bg-green-100'}`}>
                              <Text className={`text-xs ${alert.direction === 'above' ? 'text-blue-600' : 'text-green-600'} block`}>
                                {alert.direction === 'above' ? '高于' : '低于'}
                              </Text>
                            </View>
                            <Text className="text-sm font-medium text-slate-700 block">
                              {formatNumber(alert.targetPrice)}
                            </Text>
                          </View>
                          {alert.triggered && (
                            <View className="bg-yellow-100 px-2 py-0.5 rounded mr-2">
                              <Text className="text-xs text-yellow-600 block">已触发</Text>
                            </View>
                          )}
                          <Button
                            className="bg-slate-200 text-slate-600 rounded px-2 py-1 text-xs"
                            onClick={() => handleDeleteAlert(alert.id)}
                          >
                            删除
                          </Button>
                        </View>
                      ))}
                    </View>
                  </View>
                )}
              </View>
            )}
          </>
        ) : (
          <View className="flex flex-col items-center justify-center py-12">
            <Text className="text-4xl mb-4">📊</Text>
            <Text className="text-base text-slate-600 mb-2 block">暂无数据</Text>
            <Text className="text-sm text-slate-400 block">请输入股票代码开始分析</Text>
          </View>
        )}
      </View>
    </ScrollView>
  )
}
