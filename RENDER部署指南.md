# Render 部署步骤

## 1. 创建 GitHub 仓库

1. 访问 https://github.com 新建仓库
2. 上传 `menu-backend` 文件夹内容

## 2. 注册 Render

1. 访问 https://render.com
2. 用 GitHub 账号登录

## 3. 创建 Web Service

1. 点击 "New +" → "Web Service"
2. 选择你的 GitHub 仓库
3. 配置：
   - Name: menu-backend
   - Region: Singapore (离国内近)
   - Branch: main
   - Runtime: Node
   - Build Command: npm install
   - Start Command: npm start
   - Plan: Free

4. 点击 "Create Web Service"

## 4. 获取地址

部署完成后会得到地址：
```
https://menu-backend.onrender.com
```

## 5. 修改小程序配置

打开 `D:\menu-project\menu-miniprogram\app.js`，修改：

```javascript
globalData: {
  cart: [],
  userInfo: null,
  baseUrl: 'https://menu-backend.onrender.com',  // 改成你的 Render 地址
  apiToken: 'your-secret-token-change-this'
}
```

## 6. 配置微信小程序合法域名

在微信公众平台 → 开发 → 开发管理 → 开发设置 → 服务器域名：

添加 Render 地址到 `request合法域名`：
```
https://menu-backend.onrender.com
```

## 7. 上传小程序

在微信开发者工具中上传代码，提交审核。

## 注意事项

1. Render 免费版会在 15 分钟无请求后休眠
2. 首次访问可能需要等待 30 秒唤醒
3. SQLite 数据库每次重启会重置（免费版限制）

## 解决休眠问题

可以使用定时 ping 保持活跃：
- 访问 https://uptimerobot.com 注册
- 添加监控，每 5 分钟访问 https://menu-backend.onrender.com/api/health