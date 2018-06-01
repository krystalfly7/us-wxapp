// import Config from './config/index'
// import wxp from './common/wxp'
// import Event from './common/event'
// import getLocation from './common/geo'
import Global from './common/global'
// import HomeAPI from './common/home'

// import { Provider } from '@libs/weapp-redux'
// import store from './store'
//
// import lx from '@analytics/wechat-sdk'
// import { Owl, app as OwlApp } from '@hfe/mp-owl'

// const owl = new Owl({
//   project: 'paipai-wxapp',
//   env: process.env.NODE_ENV === 'production' ? 'pro' : 'dev'
// })
// const UTM_SOURCE = 'paipai-wxapp'
// const PERSIST_CITYINFO = 'cityInfo'
// // const PERSIST_LOCATION = 'location'
//
// let INIT_STATE = {
//   name: '拍店',
//   debug: Config.DEBUG,
//   isCookieInValid: false
// }

let app = {
  globalData: {},
  data: {},
  onLaunch(options) {

  },

  onShow() {

  },
  onHide(options) {

  },
  onError(error) {
  },
}
app = Object.assign(app, Global)
App(app)
// OwlApp(Provider(store)(app))
