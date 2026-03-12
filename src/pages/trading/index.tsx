import { useState, useEffect } from 'react'
import { View, Text, Button, ScrollView, Input } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { Wallet, ArrowUpRight, ArrowDownRight, History, ShoppingCart, DollarSign } from 'lucide-react-taro'
import { Network } from '@/network'
import './index.css'

interface Position {
  id: string
  code: string
  name: string
  quantity: number
  costPrice: number
  currentPrice: number
  marketValue: number
  profit: number
  profitRate: number
  updateTime: string
}

interface Account {
  userId: string
  username: string
  totalAssets: number
  availableFunds: number
  marketValue: number
  totalProfit: number
  profitRate: number
  initialFunds: number
}

interface TradeRecord {
  id: string
  code: string
  name: string
  type: 'buy' | 'sell'
  quantity: number
  price: number
  amount: number
  timestamp: string
}

export default function TradingPage() {
  const [account, setAccount] = useState<Account | null>(null)
  const [positions, setPositions] = useState<Position[]>([])
  const [tradeRecords, setTradeRecords] = useState<TradeRecord[]>([])
  const [activeTab, setActiveTab] = useState<'positions' | 'history'>('positions')
  
  // 交易弹窗
  const [showTradeModal, setShowTradeModal] = useState(false)
  const [tradeType, setTradeType] = useState<'buy' | 'sell'>('buy')
  const [tradeStock, setTradeStock] = useState({ code: '', name: '' })
  const [tradeQuantity, setTradeQuantity] = useState('')
  const [tradePrice, setTradePrice] = useState('')

  // 加载账户信息
  const loadAccount = async () => {
    try {
      console.log('[模拟交易] 开始加载账户信息')
      const res = await Network.request<{ data: Account }>({
        url: '/api/trading/account',
        method: 'GET'
      })
      console.log('[模拟交易] 账户信息响应:', res)
      if (res.data && res.data.data) {
        setAccount(res.data.data)
        console.log('[模拟交易] 账户信息设置成功:', res.data.data)
      } else {
        console.error('[模拟交易] 账户信息响应格式错误:', res)
      }
    } catch (error) {
      console.error('[模拟交易] 加载账户信息失败:', error)
    }
  }

  // 加载持仓列表
  const loadPositions = async () => {
    try {
      const res = await Network.request<{ data: Position[] }>({
        url: '/api/trading/positions',
        method: 'GET'
      })
      if (res.data.data) {
        setPositions(res.data.data)
      }
    } catch (error) {
      console.error('加载持仓失败:', error)
    }
  }

  // 加载交易记录
  const loadTradeRecords = async () => {
    try {
      const res = await Network.request<{ data: TradeRecord[] }>({
        url: '/api/trading/records',
        method: 'GET'
      })
      if (res.data.data) {
        setTradeRecords(res.data.data)
      }
    } catch (error) {
      console.error('加载交易记录失败:', error)
    }
  }

  // 初始化
  useEffect(() => {
    loadAccount()
    loadPositions()
    loadTradeRecords()
  }, [])

  // 刷新数据
  const handleRefresh = () => {
    loadAccount()
    loadPositions()
  }

  // 打开买入弹窗
  const openBuyModal = () => {
    setTradeType('buy')
    setTradeStock({ code: '', name: '' })
    setTradeQuantity('')
    setTradePrice('')
    setShowTradeModal(true)
  }

  // 打开卖出弹窗
  const openSellModal = (position: Position) => {
    setTradeType('sell')
    setTradeStock({ code: position.code, name: position.name })
    setTradeQuantity('')
    setTradePrice('')
    setShowTradeModal(true)
  }

  // 获取实时股价
  const getStockPrice = async (code: string) => {
    try {
      const res = await Network.request<{ data: { price: number; name: string } }>({
        url: '/api/stock/data',
        method: 'POST',
        data: { code }
      })
      return res.data.data
    } catch (error) {
      return null
    }
  }

  // 执行交易
  const executeTrade = async () => {
    if (!tradeStock.code || !tradeQuantity || !tradePrice) {
      Taro.showToast({ title: '请填写完整信息', icon: 'none' })
      return
    }

    const quantity = parseInt(tradeQuantity)
    const price = parseFloat(tradePrice)

    if (Number.isNaN(quantity) || quantity <= 0 || Number.isNaN(price) || price <= 0) {
      Taro.showToast({ title: '请输入有效的数量和价格', icon: 'none' })
      return
    }

    // 买入数量必须是100的整数倍
    if (tradeType === 'buy' && quantity % 100 !== 0) {
      Taro.showToast({ title: '买入数量必须是100的整数倍', icon: 'none' })
      return
    }

    const amount = quantity * price

    // 验证
    if (tradeType === 'buy') {
      if (!account) return
      if (amount > account.availableFunds) {
        Taro.showToast({ title: '可用资金不足', icon: 'none' })
        return
      }
    } else {
      const position = positions.find(p => p.code === tradeStock.code)
      if (!position || quantity > position.quantity) {
        Taro.showToast({ title: '持仓数量不足', icon: 'none' })
        return
      }
    }

    try {
      await Network.request({
        url: '/api/trading/trade',
        method: 'POST',
        data: {
          type: tradeType,
          code: tradeStock.code,
          name: tradeStock.name,
          quantity,
          price,
          amount
        }
      })

      Taro.showToast({
        title: `${tradeType === 'buy' ? '买入' : '卖出'}成功`,
        icon: 'success'
      })

      setShowTradeModal(false)
      // 刷新数据
      loadAccount()
      loadPositions()
      loadTradeRecords()
    } catch (error) {
      console.error('交易失败:', error)
      Taro.showToast({ title: '交易失败，请重试', icon: 'none' })
    }
  }

  // 格式化数字
  const formatNumber = (num: number, decimals: number = 2): string => {
    return num.toFixed(decimals)
  }

  // 格式化金额（自动转换为万元）
  const formatAmount = (amount: number): string => {
    if (Math.abs(amount) >= 10000) {
      return (amount / 10000).toFixed(2) + '万'
    }
    return amount.toFixed(2)
  }

  // 获取涨跌颜色
  const getChangeColor = (value: number): string => {
    return value >= 0 ? 'text-red-500' : 'text-green-500'
  }

  return (
    <ScrollView className="h-full bg-slate-50" scrollY>
      <View className="px-4 py-4">
        {/* 账户总览 */}
        <View className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-5 mb-4 shadow-lg text-white">
          <View className="flex justify-between items-start mb-4">
            <View>
              <Text className="text-sm opacity-80 block mb-1">总资产</Text>
              <Text className="text-3xl font-bold block">
                {account ? formatAmount(account.totalAssets) : '--'}
              </Text>
            </View>
            <Button
              className="bg-white/20 text-white rounded-lg px-3 py-1 text-xs"
              onClick={handleRefresh}
            >
              刷新
            </Button>
          </View>

          <View className="grid grid-cols-2 gap-4 mb-4">
            <View className="bg-white/10 rounded-xl p-3">
              <Text className="text-xs opacity-70 block mb-1">可用资金</Text>
              <Text className="text-lg font-semibold block">
                {account ? formatAmount(account.availableFunds) : '--'}
              </Text>
            </View>
            <View className="bg-white/10 rounded-xl p-3">
              <Text className="text-xs opacity-70 block mb-1">持仓市值</Text>
              <Text className="text-lg font-semibold block">
                {account ? formatAmount(account.marketValue) : '--'}
              </Text>
            </View>
          </View>

          <View className="flex justify-between items-center pt-3 border-t border-white/20">
            <View>
              <Text className="text-xs opacity-70 block">总收益</Text>
              <Text className={`text-lg font-semibold ${account && account.totalProfit >= 0 ? '' : 'text-green-200'} block`}>
                {account ? (account.totalProfit >= 0 ? '+' : '') + formatAmount(account.totalProfit) : '--'}
              </Text>
            </View>
            <View className="text-right">
              <Text className="text-xs opacity-70 block">收益率</Text>
              <Text className={`text-lg font-semibold ${account && account.profitRate >= 0 ? '' : 'text-green-200'} block`}>
                {account ? (account.profitRate >= 0 ? '+' : '') + formatNumber(account.profitRate) + '%' : '--'}
              </Text>
            </View>
          </View>
        </View>

        {/* 操作按钮 */}
        <View className="flex gap-3 mb-4">
          <Button
            className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl py-3"
            onClick={openBuyModal}
          >
            <View className="flex items-center justify-center">
              <ShoppingCart size={20} color="#ffffff" className="mr-2" />
              <Text className="font-medium">买入股票</Text>
            </View>
          </Button>
        </View>

        {/* 标签页切换 */}
        <View className="bg-white rounded-xl p-1 mb-4 shadow-sm flex">
          <Button
            className={`flex-1 py-2 text-sm font-medium ${activeTab === 'positions' ? 'bg-indigo-50 text-indigo-600 rounded-lg' : 'text-slate-500'}`}
            onClick={() => setActiveTab('positions')}
          >
            持仓 ({positions.length})
          </Button>
          <Button
            className={`flex-1 py-2 text-sm font-medium ${activeTab === 'history' ? 'bg-indigo-50 text-indigo-600 rounded-lg' : 'text-slate-500'}`}
            onClick={() => setActiveTab('history')}
          >
            交易记录
          </Button>
        </View>

        {/* 持仓列表 */}
        {activeTab === 'positions' && (
          <View className="space-y-3">
            {positions.length === 0 ? (
              <View className="bg-white rounded-xl p-8 text-center">
                <Wallet size={48} color="#94a3b8" className="mx-auto mb-3" />
                <Text className="text-slate-500 text-base block mb-2">暂无持仓</Text>
                <Text className="text-slate-400 text-sm block">点击买入股票开始交易</Text>
              </View>
            ) : (
              positions.map((position) => (
                <View key={position.id} className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
                  <View className="flex justify-between items-start mb-3">
                    <View>
                      <Text className="text-lg font-bold text-slate-800 block mb-1">
                        {position.name}
                      </Text>
                      <Text className="text-sm text-slate-500 block">
                        {position.code} · {position.quantity}股
                      </Text>
                    </View>
                    <View className="text-right">
                      <Text className="text-xl font-bold text-slate-800 block">
                        {formatNumber(position.currentPrice)}
                      </Text>
                      <Text className={`text-sm ${getChangeColor(position.profitRate)} block`}>
                        {position.profitRate >= 0 ? '+' : ''}{formatNumber(position.profitRate)}%
                      </Text>
                    </View>
                  </View>

                  <View className="grid grid-cols-2 gap-3 mb-3">
                    <View className="bg-slate-50 rounded-lg p-2">
                      <Text className="text-xs text-slate-500 block">成本价</Text>
                      <Text className="text-sm font-medium text-slate-700 block">
                        {formatNumber(position.costPrice)}
                      </Text>
                    </View>
                    <View className="bg-slate-50 rounded-lg p-2">
                      <Text className="text-xs text-slate-500 block">市值</Text>
                      <Text className="text-sm font-medium text-slate-700 block">
                        {formatAmount(position.marketValue)}
                      </Text>
                    </View>
                  </View>

                  <View className="flex justify-between items-center">
                    <View className={`${position.profit >= 0 ? 'bg-red-50' : 'bg-green-50'} rounded-lg px-3 py-2`}>
                      <Text className={`text-xs ${getChangeColor(position.profitRate)} block`}>
                        盈亏 {position.profit >= 0 ? '+' : ''}{formatAmount(position.profit)}
                      </Text>
                    </View>
                    <Button
                      className="bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg px-4 py-2 text-sm"
                      onClick={() => openSellModal(position)}
                    >
                      <View className="flex items-center">
                        <DollarSign size={14} color="#ffffff" className="mr-1" />
                        <Text>卖出</Text>
                      </View>
                    </Button>
                  </View>
                </View>
              ))
            )}
          </View>
        )}

        {/* 交易记录 */}
        {activeTab === 'history' && (
          <View className="space-y-3">
            {tradeRecords.length === 0 ? (
              <View className="bg-white rounded-xl p-8 text-center">
                <History size={48} color="#94a3b8" className="mx-auto mb-3" />
                <Text className="text-slate-500 text-base block mb-2">暂无交易记录</Text>
                <Text className="text-slate-400 text-sm block">开始交易后查看记录</Text>
              </View>
            ) : (
              tradeRecords.map((record) => (
                <View key={record.id} className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
                  <View className="flex justify-between items-center">
                    <View className="flex items-center">
                      <View className={`${record.type === 'buy' ? 'bg-red-100' : 'bg-green-100'} rounded-lg p-2 mr-3`}>
                        {record.type === 'buy' ? (
                          <ArrowUpRight size={20} color="#ef4444" />
                        ) : (
                          <ArrowDownRight size={20} color="#22c55e" />
                        )}
                      </View>
                      <View>
                        <Text className="text-base font-semibold text-slate-800 block">
                          {record.name} ({record.code})
                        </Text>
                        <Text className="text-xs text-slate-500 block">
                          {record.type === 'buy' ? '买入' : '卖出'} · {record.timestamp}
                        </Text>
                      </View>
                    </View>
                    <View className="text-right">
                      <Text className={`text-lg font-bold ${record.type === 'buy' ? 'text-red-500' : 'text-green-500'} block`}>
                        {record.type === 'buy' ? '-' : '+'}{formatAmount(record.amount)}
                      </Text>
                      <Text className="text-xs text-slate-500 block">
                        {record.quantity}股 @ {formatNumber(record.price)}
                      </Text>
                    </View>
                  </View>
                </View>
              ))
            )}
          </View>
        )}
      </View>

      {/* 交易弹窗 */}
      {showTradeModal && (
        <View className="fixed inset-0 bg-black/50 z-50 flex items-end">
          <View className="bg-white w-full rounded-t-3xl p-5">
            <View className="flex justify-between items-center mb-6">
              <Text className="text-xl font-bold text-slate-800 block">
                {tradeType === 'buy' ? '买入股票' : '卖出股票'}
              </Text>
              <Button
                className="bg-slate-100 text-slate-600 rounded-full p-2"
                onClick={() => setShowTradeModal(false)}
              >
                ×
              </Button>
            </View>

            {tradeType === 'buy' && (
              <View className="mb-4">
                <Text className="text-sm text-slate-600 block mb-2">股票代码</Text>
                <View className="input-wrapper">
                  <View style={{ width: '100%' }}>
                    <Input
                      className="trade-input-fix"
                      placeholder="请输入股票代码（如 600519）"
                      placeholderClass="text-slate-400"
                      value={tradeStock.code}
                      onInput={(e) => {
                        const code = e.detail.value
                        setTradeStock({ code: code, name: '' })
                        // 自动获取股票名称和价格
                        if (code && code.length >= 6) {
                          getStockPrice(code).then(data => {
                            if (data) {
                              setTradeStock({ code: code, name: data.name })
                              setTradePrice(String(data.price))
                            }
                          })
                        }
                      }}
                    />
                  </View>
                </View>
                {tradeStock.name && (
                  <Text className="text-sm text-slate-500 block mt-1">
                    {tradeStock.name}
                  </Text>
                )}
              </View>
            )}

            <View className="mb-4">
              <Text className="text-sm text-slate-600 block mb-2">
                {tradeType === 'buy' ? '买入价格' : '卖出价格'}
              </Text>
              <View className="input-wrapper">
                <View style={{ width: '100%' }}>
                  <Input
                    className="trade-input-fix"
                    placeholder="请输入价格"
                    placeholderClass="text-slate-400"
                    type="digit"
                    value={tradePrice}
                    onInput={(e) => {
                      const price = e.detail.value
                      setTradePrice(price)
                    }}
                  />
                </View>
              </View>
            </View>

            <View className="mb-4">
              <Text className="text-sm text-slate-600 block mb-2">
                {tradeType === 'buy' ? '买入数量' : '卖出数量'}
              </Text>
              <View className="input-wrapper">
                <View style={{ width: '100%' }}>
                  <Input
                    className="trade-input-fix"
                    placeholder={tradeType === 'buy' ? '请输入数量（100的整数倍）' : '请输入数量'}
                    placeholderClass="text-slate-400"
                    type="number"
                    value={tradeQuantity}
                    onInput={(e) => {
                      const quantity = e.detail.value
                      setTradeQuantity(quantity)
                    }}
                  />
                </View>
              </View>
            </View>

            <View className="bg-indigo-50 rounded-lg p-4 mb-6">
              <View className="flex justify-between items-center">
                <Text className="text-sm text-slate-600 block">交易金额</Text>
                <Text className="text-xl font-bold text-indigo-600 block">
                  {tradeQuantity && tradePrice ? formatAmount(parseFloat(tradeQuantity) * parseFloat(tradePrice)) : '0.00'}
                </Text>
              </View>
            </View>

            <Button
              className={`w-full ${tradeType === 'buy' ? 'bg-gradient-to-r from-green-500 to-emerald-600' : 'bg-gradient-to-r from-orange-500 to-red-500'} text-white rounded-xl py-4 text-base font-medium`}
              onClick={executeTrade}
            >
              {tradeType === 'buy' ? '确认买入' : '确认卖出'}
            </Button>
          </View>
        </View>
      )}
    </ScrollView>
  )
}
