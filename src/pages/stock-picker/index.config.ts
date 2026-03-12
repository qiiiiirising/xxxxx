export default typeof definePageConfig === 'function'
  ? definePageConfig({
      navigationBarTitleText: '智能选股'
    })
  : {
      navigationBarTitleText: '智能选股'
    }
