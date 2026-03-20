Page({
  data: {
    cart: [],
    selectAll: true,
    remark: '',
    diningMode: '堂食',
    totalPrice: '0.00',
    selectedCount: 0
  },

  onLoad: function () {
    this.loadCart();
  },

  onShow: function () {
    this.loadCart();
  },

  loadCart: function () {
    const app = getApp();
    let cart = app.globalData.cart.map(item => ({
      ...item,
      selected: true
    }));
    this.setData({ cart });
    this.calculateTotal();
  },

  toggleSelectAll: function () {
    const selectAll = !this.data.selectAll;
    const cart = this.data.cart.map(item => ({
      ...item,
      selected: selectAll
    }));
    this.setData({ cart, selectAll });
    this.calculateTotal();
  },

  toggleSelect: function (e) {
    const index = e.currentTarget.dataset.index;
    const cart = this.data.cart;
    cart[index].selected = !cart[index].selected;

    const selectAll = cart.every(item => item.selected);
    this.setData({ cart, selectAll });
    this.calculateTotal();
  },

  increaseQuantity: function (e) {
    const index = e.currentTarget.dataset.index;
    const cart = this.data.cart;
    cart[index].quantity += 1;

    const app = getApp();
    app.updateCartQuantity(cart[index].id, cart[index].quantity);

    this.setData({ cart });
    this.calculateTotal();
  },

  decreaseQuantity: function (e) {
    const index = e.currentTarget.dataset.index;
    const cart = this.data.cart;

    if (cart[index].quantity <= 1) {
      wx.showModal({
        title: '提示',
        content: '确定要删除该商品吗？',
        success: (res) => {
          if (res.confirm) {
            const app = getApp();
            app.removeFromCart(cart[index].id);
            cart.splice(index, 1);
            this.setData({ cart });
            this.calculateTotal();
          }
        }
      });
    } else {
      cart[index].quantity -= 1;
      const app = getApp();
      app.updateCartQuantity(cart[index].id, cart[index].quantity);
      this.setData({ cart });
      this.calculateTotal();
    }
  },

  clearCart: function () {
    wx.showModal({
      title: '提示',
      content: '确定要清空购物车吗？',
      success: (res) => {
        if (res.confirm) {
          const app = getApp();
          app.clearCart();
          this.setData({ cart: [] });
          this.calculateTotal();
        }
      }
    });
  },

  onRemarkInput: function (e) {
    this.setData({ remark: e.detail.value });
  },

  setDiningMode: function (e) {
    this.setData({ diningMode: e.currentTarget.dataset.mode });
  },

  calculateTotal: function () {
    const cart = this.data.cart;
    let totalPrice = 0;
    let selectedCount = 0;

    cart.forEach(item => {
      if (item.selected) {
        totalPrice += item.price * item.quantity;
        selectedCount += item.quantity;
      }
    });

    this.setData({
      totalPrice: totalPrice.toFixed(2),
      selectedCount
    });
  },

  submitOrder: function () {
    if (this.data.selectedCount === 0) {
      wx.showToast({
        title: '请选择商品',
        icon: 'none'
      });
      return;
    }

    const selectedItems = this.data.cart.filter(item => item.selected);
    const app = getApp();

    wx.showLoading({ title: '提交中...' });

    app.request({
      url: `${app.globalData.baseUrl}/api/orders`,
      method: 'POST',
      data: {
        items: selectedItems,
        totalPrice: this.data.totalPrice,
        remark: this.data.remark,
        diningMode: this.data.diningMode
      }
    }).then((res) => {
      wx.hideLoading();
      if (res.data.success) {
        wx.showToast({
          title: '下单成功',
          icon: 'success'
        });

        selectedItems.forEach(item => {
          app.removeFromCart(item.id);
        });

        setTimeout(() => {
          wx.switchTab({
            url: '/pages/order/order'
          });
        }, 1500);
      } else {
        wx.showToast({
          title: '下单失败',
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

  goToMenu: function () {
    wx.switchTab({
      url: '/pages/menu/menu'
    });
  }
});