const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'data', 'menu.db');

let db = null;

// 初始化数据库
async function initDatabase() {
  const SQL = await initSqlJs();
  
  // 确保 data 目录存在
  const dataDir = path.join(__dirname, 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  
  // 加载或创建数据库
  if (fs.existsSync(DB_PATH)) {
    const buffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(buffer);
    console.log('已加载数据库');
  } else {
    db = new SQL.Database();
    console.log('已创建新数据库');
  }
  
  // 创建表
  createTables();
  
  // 初始化默认数据
  await initDefaultData();
  
  // 保存数据库
  saveDatabase();
  
  return db;
}

// 创建表结构
function createTables() {
  // 菜品表
  db.run(`
    CREATE TABLE IF NOT EXISTS dishes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      price REAL NOT NULL,
      image TEXT DEFAULT '',
      category TEXT DEFAULT '热菜',
      description TEXT DEFAULT '',
      sales INTEGER DEFAULT 0,
      weight INTEGER DEFAULT 0,
      calories INTEGER DEFAULT 0,
      cooking_method TEXT DEFAULT '',
      cost REAL DEFAULT 0,
      ingredients TEXT DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  
  // 订单表
  db.run(`
    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_no TEXT NOT NULL UNIQUE,
      user_id TEXT DEFAULT 'guest',
      total_price REAL NOT NULL,
      status TEXT DEFAULT '待支付',
      remark TEXT DEFAULT '',
      dining_mode TEXT DEFAULT '堂食',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  
  // 订单详情表
  db.run(`
    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      dish_id INTEGER NOT NULL,
      dish_name TEXT NOT NULL,
      price REAL NOT NULL,
      quantity INTEGER NOT NULL,
      FOREIGN KEY (order_id) REFERENCES orders(id)
    )
  `);
  
  console.log('数据库表创建完成');
}

// 初始化默认数据
async function initDefaultData() {
  // 检查是否已有数据
  const result = db.exec("SELECT COUNT(*) as count FROM dishes");
  if (result[0].values[0][0] > 0) {
    console.log('菜品数据已存在，跳过初始化');
    return;
  }
  
  const defaultDishes = [
    {
      name: '红烧肉', price: 48, category: '热菜',
      description: '经典红烧肉，肥而不腻，入口即化',
      weight: 350, calories: 850, cooking_method: '炖',
      cost: 18.5, sales: 256,
      ingredients: '五花肉500g、冰糖30g、生抽2勺、老抽1勺、料酒2勺、葱姜适量',
      image: 'https://via.placeholder.com/200x200/ff6b35/fff?text=红烧肉'
    },
    {
      name: '宫保鸡丁', price: 38, category: '热菜',
      description: '花生酥脆，鸡肉鲜嫩，微辣可口',
      weight: 300, calories: 520, cooking_method: '炒',
      cost: 14.2, sales: 189,
      ingredients: '鸡胸肉300g、花生米50g、干辣椒10g、葱姜蒜适量',
      image: 'https://via.placeholder.com/200x200/ff6b35/fff?text=宫保鸡丁'
    },
    {
      name: '清蒸鲈鱼', price: 68, category: '海鲜',
      description: '新鲜鲈鱼，清蒸保留原汁原味',
      weight: 500, calories: 380, cooking_method: '蒸',
      cost: 32.0, sales: 145,
      ingredients: '鲈鱼1条(约500g)、葱丝、姜丝、蒸鱼豉油适量',
      image: 'https://via.placeholder.com/200x200/ff6b35/fff?text=清蒸鲈鱼'
    },
    {
      name: '麻婆豆腐', price: 28, category: '热菜',
      description: '麻辣鲜香，下饭神器',
      weight: 280, calories: 320, cooking_method: '烧',
      cost: 8.5, sales: 312,
      ingredients: '豆腐400g、猪肉末100g、豆瓣酱2勺、花椒粉适量',
      image: 'https://via.placeholder.com/200x200/ff6b35/fff?text=麻婆豆腐'
    },
    {
      name: '糖醋排骨', price: 52, category: '热菜',
      description: '酸甜可口，外酥里嫩',
      weight: 320, calories: 680, cooking_method: '炸',
      cost: 22.0, sales: 278,
      ingredients: '猪排骨500g、白糖50g、醋3勺、番茄酱2勺',
      image: 'https://via.placeholder.com/200x200/ff6b35/fff?text=糖醋排骨'
    },
    {
      name: '凉拌黄瓜', price: 16, category: '凉菜',
      description: '清脆爽口，开胃解腻',
      weight: 200, calories: 45, cooking_method: '拌',
      cost: 4.0, sales: 167,
      ingredients: '黄瓜300g、蒜末、生抽、醋、香油适量',
      image: 'https://via.placeholder.com/200x200/ff6b35/fff?text=凉拌黄瓜'
    },
    {
      name: '皮蛋豆腐', price: 18, category: '凉菜',
      description: '经典搭配，清凉爽口',
      weight: 250, calories: 180, cooking_method: '拌',
      cost: 6.5, sales: 134,
      ingredients: '豆腐1盒、皮蛋2个、香葱、生抽、香油适量',
      image: 'https://via.placeholder.com/200x200/ff6b35/fff?text=皮蛋豆腐'
    },
    {
      name: '番茄蛋汤', price: 22, category: '汤类',
      description: '酸甜开胃，营养丰富',
      weight: 400, calories: 120, cooking_method: '煮',
      cost: 5.0, sales: 198,
      ingredients: '番茄2个、鸡蛋2个、葱花、盐适量',
      image: 'https://via.placeholder.com/200x200/ff6b35/fff?text=番茄蛋汤'
    },
    {
      name: '蛋炒饭', price: 18, category: '主食',
      description: '粒粒分明，蛋香浓郁',
      weight: 350, calories: 550, cooking_method: '炒',
      cost: 5.5, sales: 423,
      ingredients: '米饭300g、鸡蛋2个、葱花、盐适量',
      image: 'https://via.placeholder.com/200x200/ff6b35/fff?text=蛋炒饭'
    },
    {
      name: '酸梅汤', price: 12, category: '饮品',
      description: '冰凉解渴，酸甜可口',
      weight: 500, calories: 80, cooking_method: '煮',
      cost: 2.5, sales: 287,
      ingredients: '乌梅50g、山楂30g、甘草5g、冰糖适量',
      image: 'https://via.placeholder.com/200x200/ff6b35/fff?text=酸梅汤'
    }
  ];
  
  const stmt = db.prepare(`
    INSERT INTO dishes (name, price, category, description, weight, calories, cooking_method, cost, sales, ingredients, image)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  for (const dish of defaultDishes) {
    stmt.run([
      dish.name, dish.price, dish.category, dish.description,
      dish.weight, dish.calories, dish.cooking_method, dish.cost,
      dish.sales, dish.ingredients, dish.image
    ]);
  }
  
  stmt.free();
  console.log('默认菜品数据初始化完成');
  saveDatabase();
}

// 保存数据库到文件
function saveDatabase() {
  if (db) {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_PATH, buffer);
  }
}

// 获取数据库实例
function getDb() {
  return db;
}

// 菜品操作
const dishDb = {
  // 获取所有菜品
  getAll(category, keyword) {
    let sql = 'SELECT * FROM dishes WHERE 1=1';
    const params = [];
    
    if (category && category !== 'all') {
      sql += ' AND category = ?';
      params.push(category);
    }
    
    if (keyword) {
      sql += ' AND (name LIKE ? OR description LIKE ?)';
      params.push(`%${keyword}%`, `%${keyword}%`);
    }
    
    sql += ' ORDER BY sales DESC';
    
    const stmt = db.prepare(sql);
    stmt.bind(params);
    
    const results = [];
    while (stmt.step()) {
      results.push(stmt.getAsObject());
    }
    stmt.free();
    
    return results;
  },
  
  // 获取单个菜品
  getById(id) {
    const stmt = db.prepare('SELECT * FROM dishes WHERE id = ?');
    stmt.bind([id]);
    
    if (stmt.step()) {
      const result = stmt.getAsObject();
      stmt.free();
      return result;
    }
    stmt.free();
    return null;
  },
  
  // 添加菜品
  add(dish) {
    const stmt = db.prepare(`
      INSERT INTO dishes (name, price, category, description, image, weight, calories, cooking_method, cost, ingredients, sales)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run([
      dish.name, dish.price, dish.category || '热菜',
      dish.description || '', dish.image || '',
      dish.weight || 0, dish.calories || 0,
      dish.cooking_method || '', dish.cost || 0,
      dish.ingredients || '', dish.sales || 0
    ]);
    stmt.free();
    saveDatabase();
    
    // 返回新插入的 ID
    const result = db.exec('SELECT last_insert_rowid()');
    return result[0].values[0][0];
  },
  
  // 更新菜品
  update(id, dish) {
    const stmt = db.prepare(`
      UPDATE dishes SET 
        name = ?, price = ?, category = ?, description = ?, image = ?,
        weight = ?, calories = ?, cooking_method = ?, cost = ?, 
        ingredients = ?, sales = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    
    stmt.run([
      dish.name, dish.price, dish.category, dish.description, dish.image,
      dish.weight || 0, dish.calories || 0, dish.cooking_method || '',
      dish.cost || 0, dish.ingredients || '', dish.sales || 0, id
    ]);
    stmt.free();
    saveDatabase();
    return true;
  },
  
  // 删除菜品
  delete(id) {
    const stmt = db.prepare('DELETE FROM dishes WHERE id = ?');
    stmt.run([id]);
    stmt.free();
    saveDatabase();
    return true;
  }
};

// 订单操作
const orderDb = {
  // 生成订单号
  generateOrderNo() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const random = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
    return `${year}${month}${day}${hours}${minutes}${seconds}${random}`;
  },
  
  // 创建订单
  create(orderData) {
    const orderNo = this.generateOrderNo();
    
    // 插入订单
    const orderStmt = db.prepare(`
      INSERT INTO orders (order_no, user_id, total_price, remark, dining_mode)
      VALUES (?, ?, ?, ?, ?)
    `);
    
    orderStmt.run([
      orderNo, orderData.userId || 'guest',
      orderData.totalPrice, orderData.remark || '',
      orderData.diningMode || '堂食'
    ]);
    orderStmt.free();
    
    // 获取订单 ID
    const result = db.exec('SELECT last_insert_rowid()');
    const orderId = result[0].values[0][0];
    
    // 插入订单详情
    const itemStmt = db.prepare(`
      INSERT INTO order_items (order_id, dish_id, dish_name, price, quantity)
      VALUES (?, ?, ?, ?, ?)
    `);
    
    for (const item of orderData.items) {
      itemStmt.run([orderId, item.id, item.name, item.price, item.quantity]);
    }
    itemStmt.free();
    
    saveDatabase();
    return { id: orderId, orderNo };
  },
  
  // 获取订单列表
  getAll(userId, status) {
    let sql = 'SELECT * FROM orders WHERE 1=1';
    const params = [];
    
    if (userId) {
      sql += ' AND user_id = ?';
      params.push(userId);
    }
    
    if (status && status !== 'all') {
      sql += ' AND status = ?';
      params.push(status);
    }
    
    sql += ' ORDER BY created_at DESC';
    
    const stmt = db.prepare(sql);
    stmt.bind(params);
    
    const orders = [];
    while (stmt.step()) {
      const order = stmt.getAsObject();
      // 获取订单详情
      order.items = this.getItems(order.id);
      orders.push(order);
    }
    stmt.free();
    
    return orders;
  },
  
  // 获取订单详情
  getById(id) {
    const stmt = db.prepare('SELECT * FROM orders WHERE id = ?');
    stmt.bind([id]);
    
    if (stmt.step()) {
      const order = stmt.getAsObject();
      order.items = this.getItems(order.id);
      stmt.free();
      return order;
    }
    stmt.free();
    return null;
  },
  
  // 获取订单商品
  getItems(orderId) {
    const stmt = db.prepare('SELECT * FROM order_items WHERE order_id = ?');
    stmt.bind([orderId]);
    
    const items = [];
    while (stmt.step()) {
      items.push(stmt.getAsObject());
    }
    stmt.free();
    return items;
  },
  
  // 更新订单状态
  updateStatus(id, status) {
    const stmt = db.prepare(`
      UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
    `);
    stmt.run([status, id]);
    stmt.free();
    saveDatabase();
    return true;
  }
};

module.exports = {
  initDatabase,
  getDb,
  saveDatabase,
  dishDb,
  orderDb
};