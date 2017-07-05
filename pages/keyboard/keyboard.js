// keyboard.js
var checkNetWork = require("../../utils/CheckNetWork.js")
Page({

  /**
   * 页面的初始数据
   * keyboard1:首页键盘,显示省的简称
   * keyboard2:第二页键盘，显示数字和大写字母
   */
  data: {
    isKeyboard: false,//是否显示键盘
    specialBtn: false,
    tapNum: false,//数字键盘是否可以点击
    parkingData:true,//是否展示剩余车位按钮
    isFocus:false,//输入框聚焦
    flag:false,//防止多次点击的阀门
    phoneNumber: '0379-60201137',
    keyboardNumber: '1234567890',
    keyboardAlph: 'QWERTYUIOPASDFGHJKL巛ZXCVBNM',
    keyboard1: '京津沪冀豫云辽黑湘皖鲁新苏浙赣鄂桂甘晋蒙陕吉闽贵粤川青藏琼宁渝',
    keyboard2: '',
    keyboard2For: ['完成'],
    keyboardValue: '',
    textArr: [],
    textValue: '',
    placeholder:'点此输入车牌',
    warnMessage:'提示：请确保您填写车牌号的正确性，以免后续误交费给您造成不必要的麻烦。',
    telMessage:'该小程序目前仅适用于东北服务区停车场，给您造成的不便敬请谅解！'
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    var self = this;
    if (!checkNetWork.checkNetWorkStatu()) {
      console.log('网络错误')
      return false;
    } else {
      wx.request({
        url: 'https://parkinglot.qqdayu.com/parking/home',
        data: {
          textValue: self.data.textValue
        },
        header: {
          'content-type': 'application/x-www-form-urlencoded'
        },
        success: function (res) {
          var response = res.data.data;
          self.setData({
            parkingData: response.parkingData,
            warnMessage: response.warnMessage,
            telMessage: response.telMessage,
            phoneNumber: response.phoneNumber,
            keyboard1: response.keyboard1
          })
          wx.setStorage({
            key: "staticData",
            data: response
          })
        }
      })
    }
  },
  /**
   * 输入框显示键盘状态
   */
  showKeyboard:function(){
    var self =this;
      self.setData({
        isFocus: true,
        isKeyboard: true,
      })
  },
  /**
   * 点击页面隐藏键盘事件
   */
  hideKeyboard: function () {
    var self = this;
    if (self.data.isKeyboard) {
      //说明键盘是显示的，再次点击要隐藏键盘
      self.setData({
        isKeyboard: false,
        isFocus: true,
      })
    }
  },
  /**
   * 输入框聚焦触发，显示键盘
   */
  bindFocus: function () {
    var self = this;
    if (self.data.isKeyboard) {
      //说明键盘是显示的，再次点击要隐藏键盘
      self.setData({
        isKeyboard: false,
        isFocus: true,
      })
    } else {
      //说明键盘是隐藏的，再次点击显示键盘
      self.setData({
        isFocus: true,
        isKeyboard: true,
      })
    }
  },
  /**
   * 键盘事件
   */
  tapKeyboard: function (e) {
    var self = this;
    //获取键盘点击的内容，并将内容赋值到textarea框中
    var tapIndex = e.target.dataset.index;
    var tapVal = e.target.dataset.val;
    var keyboardValue;
    var specialBtn;
    var tapNum;
    if (tapVal == "巛") {
      //说明是删除
      self.data.textArr.pop();
      if (self.data.textArr.length == 0) {
        //说明没有数据了，返回到省份选择键盘
        this.specialBtn = false;
        this.tapNum = false;
        this.keyboardValue = self.data.keyboard1;
      } else if (self.data.textArr.length == 1) {
        //只能输入字母
        this.tapNum = false;
        this.specialBtn = true;
        this.keyboardValue = self.data.keyboard2;
      } else {
        this.specialBtn = true;
        this.tapNum = true;
        this.keyboardValue = self.data.keyboard2;
      }
      self.data.textValue = self.data.textArr.join("");
      self.setData({
        textValue: self.data.textValue,
        keyboardValue: this.keyboardValue,
        specialBtn: this.specialBtn,
        tapNum: this.tapNum,
      })
      return false
    }
    if (self.data.textArr.length >= 7) {
      return false;
    }
    self.data.textArr.push(tapVal);
    self.data.textValue = self.data.textArr.join("");
    self.setData({
      textValue: self.data.textValue,
      keyboardValue: self.data.keyboard2,
      specialBtn: true,
    })
    if (self.data.textArr.length > 1) {
      //展示数字键盘
      self.setData({
        tapNum: true
      })
    }
  },
  /**
   * 特殊键盘事件（删除和完成）
   */
  tapSpecBtn: function (e) {
    var self = this;
    if (self.data.flag) {
      return false
    }
    var btnIndex = e.target.dataset.index;
    if (btnIndex == 0) {
      //说明是完成事件
      if (self.data.textArr.length < 7) {
        wx.showToast({
          title: '请输入正确的车牌号',
          icon: 'success',
          mask: true,
          image: '../../images/icon_error.png',
          duration: 2000
        })
      } else {
        self.setData({
          flag: true
        })
        if (!checkNetWork.checkNetWorkStatu()) {
          console.log('网络错误')
          self.setData({
            flag: false
          })
        } else {
          wx.request({
            url: 'https://parkinglot.qqdayu.com/parking/get_charge_bill',
            method: 'post',
            data: {
              plateNo: self.data.textValue
            },
            header: {
              'content-type': 'application/x-www-form-urlencoded'
            },
            success: function (res) {
              var response = res.data.data;
              if (res.data.errorCode == 0) {
                //说明请求成功了,跳转到支付页面
                wx.navigateTo({
                  url: '../payment/payment?plateNo=' + response.plateNo + '&cost=' + response.cost + '&phoneNumber=' + self.data.phoneNumber
                })
              } else if (res.data.errorCode == 1) {
                //说明不用支付
                var msg = "未查询到" + self.data.textValue + "的车辆"
                wx.showModal({
                  title: msg,
                  content: res.data.errorMessage,
                  showCancel: false,
                  success: function (res) {
                    if (res.confirm) {
                    }
                  }
                })
              }
            },
            complete: function () {
              self.setData({
                flag: null
              })
            }
          })
        }
      }
    }
  },
  /**
   * 点击查询剩余车位按钮
   */
  qryParking:function(){
    var self = this;
    wx.navigateTo({
      url: '../parking/parking'
    })
  },
  /**
   * 拨打电话
   */
  phoneCall: function () {
    var self = this;
    wx.makePhoneCall({
      phoneNumber: self.data.phoneNumber
    })
  },
  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {
    var self = this;
    //将keyboard1和keyboard2中的所有字符串拆分成一个一个字组成的数组
    self.data.keyboard1 = self.data.keyboard1.split('')
    self.data.keyboard2 = self.data.keyboard2.split('')
    self.setData({
      keyboardValue: self.data.keyboard1
    })
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    var self = this;
    self.setData({
      flag: false
    })
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {
    wx.stopPullDownRefresh()
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {
    return {
      desc: '我刚刚发现了一个停车场,分享给大家看看吧', // 分享描述
      path: 'pages/keyboard/keyboard' // 分享路径
    }
  }
})