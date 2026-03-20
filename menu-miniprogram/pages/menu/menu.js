Page({
  data: {
    dishes: [],
    filteredDishes: [],
    activeCategory: 'all',
    searchKey: '',
    cartCount: 0,
    cartTotal: 0,
    cart: [],
    loading: true,
    showDetail: false,
    currentDish: {}
  },

  onLoad: function () {
    this.loadDishes();
    this.updateCartInfo();
  },

  onShow: function () {
    this.updateCartInfo();
  },

  loadDishes: function () {
    const app = getApp();
    this.setData({ loading: true });

    app.request({
      url: `${app.globalData.baseUrl}/api/dishes`,
      method: 'GET'
    }).then((res) => {
      if (res.data.success) {
        this.setData({
          dishes: res.data.data,
          filteredDishes: res.data.data,
          loading: false
        });
      }
    }).catch((err) => {
      console.error('加载菜品失败:', err);
      this.setData({ loading: false });
      wx.showToast({
        title: '加载失败，请检查网络',
        icon: 'none'
      });
    });
  },

  filterDishes: function () {
    let dishes = this.data.dishes;

    if (this.data.activeCategory !== 'all') {
      dishes = dishes.filter(item => item.category === this.data.activeCategory);
    }

    if (this.data.searchKey) {
      const key = this.data.searchKey.toLowerCase();
      dishes = dishes.filter(item =>
        item.name.toLowerCase().includes(key) ||
        item.description.toLowerCase().includes(key)
      );
    }

    this.setData({ filteredDishes: dishes });
  },

  switchCategory: function (e) {
    const category = e.currentTarget.dataset.category;
    this.setData({ activeCategory: category });
    this.filterDishes();
  },

  onSearch: function (e) {
    this.setData({ searchKey: e.detail.value });
    this.filterDishes();
  },

  getCartQuantity: function (dishId) {
    const cart = getApp().globalData.cart;
    const item = cart.find(i => i.id === dishId);
    return item ? item.quantity : 0;
  },

  addToCart: function (e) {
    const dish = e.currentTarget.dataset.dish;
    const app = getApp();
    app.addToCart(dish);
    this.updateCartInfo();
    wx.showToast({
      title: '已添加',
      icon: 'success',
      duration: 1000
    });
  },

  addToCartFromDetail: function () {
    const dish = this.data.currentDish;
    const app = getApp();
    app.addToCart(dish);
    this.updateCartInfo();
    wx.showToast({
      title: '已添加',
      icon: 'success',
      duration: 1000
    });
  },

  decreaseQuantity: function (e) {
    const dishId = e.currentTarget.dataset.id;
    const app = getApp();
    const currentQty = this.getCartQuantity(dishId);
    if (currentQty <= 1) {
      app.removeFromCart(dishId);
    } else {
      app.updateCartQuantity(dishId, currentQty - 1);
    }
    this.updateCartInfo();
  },

  updateCartInfo: function () {
    const app = getApp();
    this.setData({
      cartCount: app.getCartCount(),
      cartTotal: app.getCartTotal().toFixed(2),
      cart: app.globalData.cart
    });
  },

  showDishDetail: function (e) {
    const dish = e.currentTarget.dataset.dish;
    this.setData({
      showDetail: true,
      currentDish: dish
    });
  },

  hideDishDetail: function () {
    this.setData({ showDetail: false });
  },

  stopPropagation: function () {
    // 阻止事件冒泡
  },

  previewImage: function (e) {
    const src = e.currentTarget.dataset.src;
    wx.previewImage({
      urls: [src],
      current: src
    });
  },

  goToCart: function () {
    wx.switchTab({
      url: '/pages/cart/cart'
    });
  }
});