const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();
const _ = db.command;

exports.main = async (event, context) => {
  const { action, orderData, orderId } = event;
  const wxContext = cloud.getWXContext();
  
  switch (action) {
    case 'create':
      return await createOrder(orderData, wxContext.OPENID);
    case 'list':
      return await getOrderList(wxContext.OPENID);
    case 'detail':
      return await getOrderDetail(orderId);
    case 'cancel':
      return await cancelOrder(orderId, wxContext.OPENID);
    case 'pay':
      return await payOrder(orderId, wxContext.OPENID);
    case 'complete':
      return await completeOrder(orderId, wxContext.OPENID);
    default:
      return { success: false, message: '未知操作' };
  }
};

function generateOrderNo() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  const random = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
  return `${year}${month}${day}${hours}${minutes}${seconds}${random}`;
}

async function createOrder(orderData, openid) {
  try {
    const orderNo = generateOrderNo();
    
    const res = await db.collection('orders').add({
      data: {
        orderNo,
        openid,
        items: orderData.items,
        totalPrice: orderData.totalPrice,
        remark: orderData.remark || '',
        diningMode: orderData.diningMode || '堂食',
        status: '待支付',
        createTime: db.serverDate(),
        updateTime: db.serverDate()
      }
    });
    
    return { success: true, orderNo, id: res._id };
  } catch (e) {
    return { success: false, message: e.message };
  }
}

async function getOrderList(openid) {
  try {
    const res = await db.collection('orders')
      .where({ openid })
      .orderBy('createTime', 'desc')
      .limit(50)
      .get();
    
    return { success: true, data: res.data };
  } catch (e) {
    return { success: false, message: e.message };
  }
}

async function getOrderDetail(orderId) {
  try {
    const res = await db.collection('orders').doc(orderId).get();
    return { success: true, data: res.data };
  } catch (e) {
    return { success: false, message: e.message };
  }
}

async function cancelOrder(orderId, openid) {
  try {
    const order = await db.collection('orders').doc(orderId).get();
    
    if (order.data.openid !== openid) {
      return { success: false, message: '无权操作' };
    }
    
    if (order.data.status !== '待支付') {
      return { success: false, message: '订单状态不允许取消' };
    }
    
    await db.collection('orders').doc(orderId).update({
      data: {
        status: '已取消',
        updateTime: db.serverDate()
      }
    });
    
    return { success: true };
  } catch (e) {
    return { success: false, message: e.message };
  }
}

async function payOrder(orderId, openid) {
  try {
    const order = await db.collection('orders').doc(orderId).get();
    
    if (order.data.openid !== openid) {
      return { success: false, message: '无权操作' };
    }
    
    if (order.data.status !== '待支付') {
      return { success: false, message: '订单状态不允许支付' };
    }
    
    await db.collection('orders').doc(orderId).update({
      data: {
        status: '已支付',
        payTime: db.serverDate(),
        updateTime: db.serverDate()
      }
    });
    
    return { success: true };
  } catch (e) {
    return { success: false, message: e.message };
  }
}

async function completeOrder(orderId, openid) {
  try {
    const order = await db.collection('orders').doc(orderId).get();
    
    if (order.data.openid !== openid) {
      return { success: false, message: '无权操作' };
    }
    
    if (order.data.status !== '已支付') {
      return { success: false, message: '订单状态不允许完成' };
    }
    
    await db.collection('orders').doc(orderId).update({
      data: {
        status: '已完成',
        completeTime: db.serverDate(),
        updateTime: db.serverDate()
      }
    });
    
    return { success: true };
  } catch (e) {
    return { success: false, message: e.message };
  }
}