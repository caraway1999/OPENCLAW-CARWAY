const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();
const _ = db.command;

exports.main = async (event, context) => {
  const { action, dishData, dishId, category, keyword } = event;
  
  switch (action) {
    case 'list':
      return await getDishList(category, keyword);
    case 'detail':
      return await getDishDetail(dishId);
    case 'add':
      return await addDish(dishData);
    case 'update':
      return await updateDish(dishId, dishData);
    case 'delete':
      return await deleteDish(dishId);
    default:
      return { success: false, message: '未知操作' };
  }
};

async function getDishList(category, keyword) {
  try {
    let query = {};
    
    if (category && category !== 'all') {
      query.category = category;
    }
    
    if (keyword) {
      query.name = db.RegExp({
        regexp: keyword,
        options: 'i'
      });
    }
    
    const res = await db.collection('dishes')
      .where(query)
      .orderBy('sales', 'desc')
      .limit(100)
      .get();
    
    return { success: true, data: res.data };
  } catch (e) {
    return { success: false, message: e.message };
  }
}

async function getDishDetail(dishId) {
  try {
    const res = await db.collection('dishes').doc(dishId).get();
    return { success: true, data: res.data };
  } catch (e) {
    return { success: false, message: e.message };
  }
}

async function addDish(dishData) {
  try {
    const res = await db.collection('dishes').add({
      data: {
        ...dishData,
        sales: 0,
        createTime: db.serverDate(),
        updateTime: db.serverDate()
      }
    });
    return { success: true, id: res._id };
  } catch (e) {
    return { success: false, message: e.message };
  }
}

async function updateDish(dishId, dishData) {
  try {
    await db.collection('dishes').doc(dishId).update({
      data: {
        ...dishData,
        updateTime: db.serverDate()
      }
    });
    return { success: true };
  } catch (e) {
    return { success: false, message: e.message };
  }
}

async function deleteDish(dishId) {
  try {
    await db.collection('dishes').doc(dishId).remove();
    return { success: true };
  } catch (e) {
    return { success: false, message: e.message };
  }
}