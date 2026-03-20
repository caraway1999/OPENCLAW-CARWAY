Page({
  data: {
    orders: [],
    filteredOrders: [],
    activeStatus: 'all'
  },

  onLoad: function () {
    this.loadOrders();
  },

  onShow: function () {
    this.loadOrders();
  },

  onPullDownRefresh: function () {
    this.loadOrders();
    wx.stopPullDownRefresh();
  },

  loadOrders: function () {
    const app = getApp();
    wx.showLoading({ title: '加载中...' });

    app.request({
      url: `${app.globalData.baseUrl}/api/orders`,
      method: 'GET'
    }).then((res) => {
      wx.hideLoading();
      if (res.data.success) {
        const orders = res.data.data.map(order => ({
          ...order,
          createTime: this.formatTime(order.createTime)
        }));
        this.setData({ orders });
        this.filterOrdersByStatus();
      }
    }).catch(() => {
      wx.hideLoading();
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      });
    });
  },

  formatTime: function (timeStr) {
    const date = new Date(timeStr);
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const hour = date.getHours().toString().padStart(2, '0');
    const minute = date.getMinutes().toString().padStart(2, '0');
    return `${year}-${month}-${day} ${hour}:${minute}`;
  },

  filterOrders: function (e) {
    const status = e.currentTarget.dataset.status;
    this.setData({ activeStatus: status });
    this.filterOrdersByStatus();
  },

  filterOrdersByStatus: function () {
    const { orders, activeStatus } = this.data;
    let filtered = orders;

    if (activeStatus !== 'all') {
      filtered = orders.filter(order => order.status === activeStatus);
    }

    this.setData({ filteredOrders: filtered });
  },

  cancelOrder: function (e) {
    const orderId = e.currentTarget.dataset.id;
    const app = getApp();

    wx.showModal({
      title: '提示',
      content: '确定要取消该订单吗？',
      success: (res) => {
        if (res.confirm) {
          wx.showLoading({ title: '取消中...' });

          app.request({
            url: `${app.globalData.baseUrl}/api/orders/${orderId}/cancel`,
            method: 'POST'
          }).then((res) => {
            wx.hideLoading();
            if (res.data.success) {
              wx.showToast({
                title: '已取消',
                icon: 'success'
              });
              this.loadOrders();
            } else {
              wx.showToast({
                title: res.data.message || '取消失败',
                icon: 'none'
              });
            }
          }).catch(() => {
            wx.hideLoading();
            wx.showToast({
              title: '网络错误',
              icon: 'none'
            });
          });
        }
      }
    });
  },

  payOrder: function (e) {
    const orderId = e.currentTarget.dataset.id;
    const app = getApp();

    wx.showLoading({ title: '支付中...' });

    app.request({
      url: `${app.globalData.baseUrl}/api/orders/${orderId}/pay`,
      method: 'POST'
    }).then((res) => {
      wx.hideLoading();
      if (res.data.success) {
        wx.showToast({
          title: '支付成功',
          icon: 'success'
        });
        this.loadOrders();
      } else {
        wx.showToast({
          title: res.data.message || '支付失败',
          icon: 'none'
        });
      }
    }).catch(() => {
      wx.hideLoading();
      wx.showToast({
        title: '网络错误',
        icon: 'none'
      });
    });
  },

  reorder: function (e) {
    const order = e.currentTarget.dataset.order;
    const app = getApp();

    order.items.forEach(item => {
      app.addToCart(item);
    });

    wx.showToast({
      title: '已加入购物车',
      icon: 'success'
    });

    setTimeout(() => {
      wx.switchTab({
        url: '/pages/cart/cart'
      });
    }, 1000);
  },

  goToMenu: function () {
    wx.switchTab({
      url: '/pages/menu/menu'
    });
  }
});