App({
  onLaunch: function () {
    this.loadCart();
  },

  globalData: {
    cart: [],
    userInfo: null,
    baseUrl: 'http://localhost:3000',  // 后端地址，部署后改成 Cloudflare Tunnel 地址
    apiToken: 'your-secret-token-change-this'  // 与后端一致的密钥
  },

  // 封装请求方法，自动带 Token
  request(options) {
    return new Promise((resolve, reject) => {
      wx.request({
        ...options,
        header: {
          ...options.header,
          'x-api-token': this.globalData.apiToken
        },
        success: (res) => resolve(res),
        fail: (err) => reject(err)
      });
    });
  },

  addToCart(dish) {
    const cart = this.globalData.cart;
    const existing = cart.find(item => item.id === dish.id);
    if (existing) {
      existing.quantity += 1;
    } else {
      cart.push({ ...dish, quantity: 1 });
    }
    this.globalData.cart = cart;
    this.saveCart();
  },

  removeFromCart(dishId) {
    let cart = this.globalData.cart;
    cart = cart.filter(item => item.id !== dishId);
    this.globalData.cart = cart;
    this.saveCart();
  },

  updateCartQuantity(dishId, quantity) {
    const cart = this.globalData.cart;
    const item = cart.find(item => item.id === dishId);
    if (item) {
      item.quantity = quantity;
      if (quantity <= 0) {
        this.removeFromCart(dishId);
      }
    }
    this.globalData.cart = cart;
    this.saveCart();
  },

  getCartTotal() {
    const cart = this.globalData.cart;
    return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  },

  getCartCount() {
    const cart = this.globalData.cart;
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  },

  clearCart() {
    this.globalData.cart = [];
    this.saveCart();
  },

  saveCart() {
    wx.setStorageSync('cart', this.globalData.cart);
  },

  loadCart() {
    const cart = wx.getStorageSync('cart');
    if (cart) {
      this.globalData.cart = cart;
    }
  }
});