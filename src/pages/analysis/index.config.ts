export default typeof definePageConfig === 'function'
  ? definePageConfig({
      navigationBarTitleText: '股票分析'
    })
  : { navigationBarTitleText: '股票分析' }
