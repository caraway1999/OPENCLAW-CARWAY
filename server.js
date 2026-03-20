const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const { initDatabase, dishDb, orderDb, saveDatabase } = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;

// ============ 安全配置 ============
const API_TOKEN = 'your-secret-token-change-this';
const ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'https://servicewechat.com'
];

// 速率限制配置
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW = 60000;
const RATE_LIMIT_MAX = 100;

// 中间件 - 速率限制
app.use((req, res, next) => {
  const ip = req.ip || req.connection.remoteAddress;
  const now = Date.now();
  
  if (!rateLimitMap.has(ip)) {
    rateLimitMap.set(ip, { count: 1, startTime: now });
  } else {
    const record = rateLimitMap.get(ip);
    if (now - record.startTime > RATE_LIMIT_WINDOW) {
      record.count = 1;
      record.startTime = now;
    } else {
      record.count++;
      if (record.count > RATE_LIMIT_MAX) {
        return res.status(429).json({ 
          success: false, 
          message: '请求过于频繁，请稍后再试' 
        });
      }
    }
  }
  next();
});

// 中间件 - CORS
app.use(cors({
  origin: function(origin, callback) {
    if (!origin) return callback(null, true);
    callback(null, true);
  },
  credentials: true
}));

app.use(bodyParser.json({ limit: '1mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '1mb' }));

// 静态文件服务
app.use(express.static(path.join(__dirname, 'public')));

// 中间件 - Token 验证
app.use((req, res, next) => {
  if (req.path === '/api/health') {
    return next();
  }
  
  if (!req.path.startsWith('/api/')) {
    return next();
  }
  
  if (req.method === 'OPTIONS') {
    return next();
  }
  
  const token = req.headers['x-api-token'] || req.query.token;
  
  if (!token || token !== API_TOKEN) {
    return res.status(401).json({ 
      success: false, 
      message: '未授权访问，请提供有效的 API Token' 
    });
  }
  
  next();
});

// 中间件 - 输入消毒
app.use((req, res, next) => {
  if (req.body) {
    const sanitize = (obj) => {
      if (typeof obj === 'string') {
        return obj.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
                  .replace(/[<>]/g, '');
      }
      if (typeof obj === 'object' && obj !== null) {
        for (let key in obj) {
          obj[key] = sanitize(obj[key]);
        }
      }
      return obj;
    };
    req.body = sanitize(req.body);
  }
  next();
});

// ============ 菜品接口 ============

// 获取菜品列表
app.get('/api/dishes', (req, res) => {
  try {
    const { category, keyword } = req.query;
    const dishes = dishDb.getAll(category, keyword);
    res.json({ success: true, data: dishes });
  } catch (e) {
    console.error('获取菜品列表失败:', e);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// 获取菜品详情
app.get('/api/dishes/:id', (req, res) => {
  try {
    const dish = dishDb.getById(req.params.id);
    if (dish) {
      res.json({ success: true, data: dish });
    } else {
      res.status(404).json({ success: false, message: '菜品不存在' });
    }
  } catch (e) {
    console.error('获取菜品详情失败:', e);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// 添加菜品
app.post('/api/dishes', (req, res) => {
  try {
    const id = dishDb.add(req.body);
    const newDish = dishDb.getById(id);
    res.json({ success: true, data: newDish });
  } catch (e) {
    console.error('添加菜品失败:', e);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// 更新菜品
app.put('/api/dishes/:id', (req, res) => {
  try {
    const dish = dishDb.getById(req.params.id);
    if (!dish) {
      return res.status(404).json({ success: false, message: '菜品不存在' });
    }
    
    dishDb.update(req.params.id, req.body);
    const updatedDish = dishDb.getById(req.params.id);
    res.json({ success: true, data: updatedDish });
  } catch (e) {
    console.error('更新菜品失败:', e);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// 删除菜品
app.delete('/api/dishes/:id', (req, res) => {
  try {
    const dish = dishDb.getById(req.params.id);
    if (!dish) {
      return res.status(404).json({ success: false, message: '菜品不存在' });
    }
    
    dishDb.delete(req.params.id);
    res.json({ success: true });
  } catch (e) {
    console.error('删除菜品失败:', e);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// ============ 订单接口 ============

// 创建订单
app.post('/api/orders', (req, res) => {
  try {
    const result = orderDb.create({
      items: req.body.items,
      totalPrice: req.body.totalPrice,
      remark: req.body.remark || '',
      diningMode: req.body.diningMode || '堂食',
      userId: req.body.userId || 'guest'
    });
    
    const newOrder = orderDb.getById(result.id);
    res.json({ success: true, data: newOrder });
  } catch (e) {
    console.error('创建订单失败:', e);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// 获取订单列表
app.get('/api/orders', (req, res) => {
  try {
    const { userId, status } = req.query;
    const orders = orderDb.getAll(userId, status);
    res.json({ success: true, data: orders });
  } catch (e) {
    console.error('获取订单列表失败:', e);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// 获取订单详情
app.get('/api/orders/:id', (req, res) => {
  try {
    const order = orderDb.getById(req.params.id);
    if (order) {
      res.json({ success: true, data: order });
    } else {
      res.status(404).json({ success: false, message: '订单不存在' });
    }
  } catch (e) {
    console.error('获取订单详情失败:', e);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// 取消订单
app.post('/api/orders/:id/cancel', (req, res) => {
  try {
    const order = orderDb.getById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: '订单不存在' });
    }
    
    if (order.status !== '待支付') {
      return res.status(400).json({ success: false, message: '订单状态不允许取消' });
    }
    
    orderDb.updateStatus(req.params.id, '已取消');
    const updatedOrder = orderDb.getById(req.params.id);
    res.json({ success: true, data: updatedOrder });
  } catch (e) {
    console.error('取消订单失败:', e);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// 支付订单
app.post('/api/orders/:id/pay', (req, res) => {
  try {
    const order = orderDb.getById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: '订单不存在' });
    }
    
    if (order.status !== '待支付') {
      return res.status(400).json({ success: false, message: '订单状态不允许支付' });
    }
    
    orderDb.updateStatus(req.params.id, '已支付');
    const updatedOrder = orderDb.getById(req.params.id);
    res.json({ success: true, data: updatedOrder });
  } catch (e) {
    console.error('支付订单失败:', e);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: '服务运行正常', time: new Date().toISOString() });
});

// 启动服务器
async function start() {
  try {
    await initDatabase();
    
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`=================================`);
      console.log(`餐厅点餐后端服务已启动`);
      console.log(`本地地址: http://localhost:${PORT}`);
      console.log(`管理后台: http://localhost:${PORT}/index.html`);
      console.log(`数据库: SQLite (menu.db)`);
      console.log(`=================================`);
      console.log(`API 接口:`);
      console.log(`  GET    /api/dishes       - 获取菜品列表`);
      console.log(`  GET    /api/dishes/:id   - 获取菜品详情`);
      console.log(`  POST   /api/dishes       - 添加菜品`);
      console.log(`  PUT    /api/dishes/:id   - 更新菜品`);
      console.log(`  DELETE /api/dishes/:id   - 删除菜品`);
      console.log(`  POST   /api/orders       - 创建订单`);
      console.log(`  GET    /api/orders       - 获取订单列表`);
      console.log(`  POST   /api/orders/:id/cancel - 取消订单`);
      console.log(`  POST   /api/orders/:id/pay    - 支付订单`);
      console.log(`=================================`);
    });
  } catch (e) {
    console.error('启动服务器失败:', e);
    process.exit(1);
  }
}

start();