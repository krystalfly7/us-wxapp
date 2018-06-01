let app

Page({
    data: {
        url: '',
    },

    onLoad: function(options) {
        app = getApp()
    },

    onShow: function() {
        app.logger('========webview page show===========')
        const pages = getCurrentPages()
        app.logger('webview pages Stack:==>', pages)
    },

    onShareAppMessage: function({webViewUrl}) {

    },

    onHide: function() {
    // Do something when page hide.
    },

    onUnload: function() {
    // Do something when page close.
    },

    onPullDownRefresh: function() {
    // Do something when pull down.
    },

    onReachBottom: function() {
    // Do something when page reach bottom.
    },

    /**
     * 处理消息队列
     * @param {*} msgData
     */
    messageHandler: function({detail: msgData}) {
        // postMessage入参(消息对象)格式: `{ data: { action: 'XXX', data: customData } }`
        let msgList = msgData.data || []
        let msgObj
        let shareMsgList = []
        for (let i = 0; i < msgList.length; i++) {
            msgObj = msgList[i] || {}
            if (msgObj.action === 'share') {
                shareMsgList.push(msgObj.data)
            }
        }
        this.setData({ shareMsgList })
    }
})
