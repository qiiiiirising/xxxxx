export default typeof definePageConfig === 'function'
  ? definePageConfig({
      navigationBarTitleText: '模拟交易'
    })
  : { navigationBarTitleText: '模拟交易' }
