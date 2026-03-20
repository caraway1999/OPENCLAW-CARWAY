Page({
  data: {
    cartCount: 0,
    recommendDishes: [
      {
        _id: '1',
        name: '红烧肉',
        price: 48,
        image: '/images/dish1.png',
        category: '热菜',
        description: '经典红烧肉，肥而不腻'
      },
      {
        _id: '2',
        name: '宫保鸡丁',
        price: 38,
        image: '/images/dish2.png',
        category: '热菜',
        description: '花生酥脆，鸡肉鲜嫩'
      },
      {
        _id: '3',
        name: '清蒸鲈鱼',
        price: 68,
        image: '/images/dish3.png',
        category: '海鲜',
        description: '新鲜鲈鱼，原汁原味'
      },
      {
        _id: '4',
        name: '麻婆豆腐',
        price: 28,
        image: '/images/dish4.png',
        category: '热菜',
        description: '麻辣鲜香，下饭神器'
      },
      {
        _id: '5',
        name: '糖醋排骨',
        price: 52,
        image: '/images/dish5.png',
        category: '热菜',
        description: '酸甜可口，外酥里嫩'
      }
    ]
  },

  onLoad: function () {
    this.loadCartCount();
  },

  onShow: function () {
    this.loadCartCount();
  },

  loadCartCount: function () {
    const app = getApp();
    this.setData({
      cartCount: app.getCartCount()
    });
  },

  goToMenu: function () {
    wx.switchTab({
      url: '/pages/menu/menu'
    });
  },

  goToCart: function () {
    wx.switchTab({
      url: '/pages/cart/cart'
    });
  },

  goToOrder: function () {
    wx.switchTab({
      url: '/pages/order/order'
    });
  },

  goToDetail: function (e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: '/pages/menu/menu?id=' + id
    });
  }
});