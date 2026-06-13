const express = require('express');
const { insert, findAll, findById, update, findOne } = require('../db');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

const ORDER_STATUS = {
  PENDING_PAYMENT: 'pending_payment',
  PAID: 'paid',
  SHIPPED: 'shipped',
  DELIVERED: 'delivered',
  INSPECTING: 'inspecting',
  INSPECTION_PASSED: 'inspection_passed',
  INSPECTION_FAILED: 'inspection_failed',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  RETURN_REQUESTED: 'return_requested',
  RETURNED: 'returned'
};

function generateOrderNo() {
  const now = new Date();
  const timestamp = now.getFullYear().toString() +
    (now.getMonth() + 1).toString().padStart(2, '0') +
    now.getDate().toString().padStart(2, '0') +
    now.getHours().toString().padStart(2, '0') +
    now.getMinutes().toString().padStart(2, '0') +
    now.getSeconds().toString().padStart(2, '0') +
    Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return timestamp;
}

router.get('/', authMiddleware, (req, res) => {
  const { status, role } = req.query;
  
  let orders = findAll('orders');
  
  if (role === 'buyer') {
    orders = orders.filter(o => o.buyerId === req.user.id);
  } else if (role === 'seller') {
    orders = orders.filter(o => o.sellerId === req.user.id);
  } else {
    orders = orders.filter(o => o.buyerId === req.user.id || o.sellerId === req.user.id);
  }
  
  if (status) {
    orders = orders.filter(o => o.status === status);
  }
  
  const result = orders.map(order => {
    const product = findById('products', order.productId);
    const seller = findById('users', order.sellerId);
    const buyer = findById('users', order.buyerId);
    
    return {
      ...order,
      product: product ? {
        id: product.id,
        title: product.title,
        price: product.price,
        images: product.images
      } : null,
      seller: seller ? {
        id: seller.id,
        nickname: seller.nickname,
        avatar: seller.avatar
      } : null,
      buyer: buyer ? {
        id: buyer.id,
        nickname: buyer.nickname,
        avatar: buyer.avatar
      } : null
    };
  });
  
  res.json(result);
});

router.get('/:id', authMiddleware, (req, res) => {
  const order = findById('orders', Number(req.params.id));
  if (!order) {
    return res.status(404).json({ error: '订单不存在' });
  }
  
  if (order.buyerId !== req.user.id && order.sellerId !== req.user.id) {
    return res.status(403).json({ error: '无权限查看此订单' });
  }
  
  const product = findById('products', order.productId);
  const seller = findById('users', order.sellerId);
  const buyer = findById('users', order.buyerId);
  const logistics = findOne('logistics', { orderId: order.id });
  
  res.json({
    ...order,
    product: product ? {
      id: product.id,
      title: product.title,
      price: product.price,
      images: product.images,
      description: product.description
    } : null,
    seller: seller ? {
      id: seller.id,
      nickname: seller.nickname,
      avatar: seller.avatar
    } : null,
    buyer: buyer ? {
      id: buyer.id,
      nickname: buyer.nickname,
      avatar: buyer.avatar
    } : null,
    logistics
  });
});

router.post('/', authMiddleware, (req, res) => {
  const { productId, address, phone, buyerRemark } = req.body;
  
  if (!productId || !address || !phone) {
    return res.status(400).json({ error: '商品ID、收货地址、联系电话不能为空' });
  }
  
  const product = findById('products', Number(productId));
  if (!product) {
    return res.status(404).json({ error: '商品不存在' });
  }
  
  if (product.status !== 'on_sale') {
    return res.status(400).json({ error: '商品已下架或已售出' });
  }
  
  if (product.sellerId === req.user.id) {
    return res.status(400).json({ error: '不能购买自己的商品' });
  }
  
  const buyer = findById('users', req.user.id);
  if (buyer.balance < product.price) {
    return res.status(400).json({ error: '余额不足，请先充值' });
  }
  
  const order = insert('orders', {
    orderNo: generateOrderNo(),
    productId: product.id,
    sellerId: product.sellerId,
    buyerId: req.user.id,
    price: product.price,
    status: ORDER_STATUS.PENDING_PAYMENT,
    address,
    phone,
    buyerRemark: buyerRemark || '',
    paymentMethod: 'balance'
  });
  
  res.json(order);
});

router.post('/:id/pay', authMiddleware, (req, res) => {
  const order = findById('orders', Number(req.params.id));
  if (!order) {
    return res.status(404).json({ error: '订单不存在' });
  }
  
  if (order.buyerId !== req.user.id) {
    return res.status(403).json({ error: '无权限操作此订单' });
  }
  
  if (order.status !== ORDER_STATUS.PENDING_PAYMENT) {
    return res.status(400).json({ error: '订单状态不支持支付' });
  }
  
  const buyer = findById('users', req.user.id);
  if (buyer.balance < order.price) {
    return res.status(400).json({ error: '余额不足' });
  }
  
  update('users', req.user.id, { balance: buyer.balance - order.price });
  update('products', order.productId, { status: 'sold' });
  
  const updatedOrder = update('orders', order.id, {
    status: ORDER_STATUS.PAID,
    paidAt: new Date().toISOString()
  });
  
  res.json(updatedOrder);
});

router.post('/:id/ship', authMiddleware, (req, res) => {
  const { trackingNo, courier } = req.body;
  
  const order = findById('orders', Number(req.params.id));
  if (!order) {
    return res.status(404).json({ error: '订单不存在' });
  }
  
  if (order.sellerId !== req.user.id) {
    return res.status(403).json({ error: '无权限操作此订单' });
  }
  
  if (order.status !== ORDER_STATUS.PAID) {
    return res.status(400).json({ error: '订单状态不支持发货' });
  }
  
  insert('logistics', {
    orderId: order.id,
    trackingNo: trackingNo || generateOrderNo(),
    courier: courier || '顺丰速运',
    status: 'in_transit',
    currentLocation: '已揽收',
    trackingHistory: [
      {
        time: new Date().toISOString(),
        location: '商家已发货，快递已揽收',
        description: '包裹已从卖家发货'
      }
    ]
  });
  
  const updatedOrder = update('orders', order.id, {
    status: ORDER_STATUS.SHIPPED,
    shippedAt: new Date().toISOString()
  });
  
  res.json(updatedOrder);
});

router.post('/:id/confirm-delivery', authMiddleware, (req, res) => {
  const order = findById('orders', Number(req.params.id));
  if (!order) {
    return res.status(404).json({ error: '订单不存在' });
  }
  
  if (order.buyerId !== req.user.id) {
    return res.status(403).json({ error: '无权限操作此订单' });
  }
  
  if (order.status !== ORDER_STATUS.SHIPPED) {
    return res.status(400).json({ error: '订单状态不支持确认收货' });
  }
  
  const logistics = findOne('logistics', { orderId: order.id });
  if (logistics) {
    update('logistics', logistics.id, {
      status: 'delivered',
      deliveredAt: new Date().toISOString(),
      currentLocation: '已签收'
    });
  }
  
  const updatedOrder = update('orders', order.id, {
    status: ORDER_STATUS.DELIVERED,
    deliveredAt: new Date().toISOString()
  });
  
  res.json(updatedOrder);
});

router.post('/:id/inspect', authMiddleware, (req, res) => {
  const { passed, inspectionResult, inspectionRemark } = req.body;
  
  const order = findById('orders', Number(req.params.id));
  if (!order) {
    return res.status(404).json({ error: '订单不存在' });
  }
  
  if (order.buyerId !== req.user.id) {
    return res.status(403).json({ error: '无权限操作此订单' });
  }
  
  if (order.status !== ORDER_STATUS.DELIVERED) {
    return res.status(400).json({ error: '订单状态不支持验货' });
  }
  
  if (passed === undefined) {
    return res.status(400).json({ error: '请选择验货结果' });
  }
  
  let newStatus;
  if (passed) {
    newStatus = ORDER_STATUS.INSPECTION_PASSED;
    const seller = findById('users', order.sellerId);
    if (seller) {
      update('users', order.sellerId, { balance: seller.balance + order.price });
    }
  } else {
    newStatus = ORDER_STATUS.INSPECTION_FAILED;
    const buyer = findById('users', order.buyerId);
    if (buyer) {
      update('users', order.buyerId, { balance: buyer.balance + order.price });
    }
  }
  
  const updatedOrder = update('orders', order.id, {
    status: newStatus,
    inspectionResult: passed ? 'passed' : 'failed',
    inspectionRemark: inspectionRemark || '',
    inspectedAt: new Date().toISOString()
  });
  
  res.json(updatedOrder);
});

router.post('/:id/complete', authMiddleware, (req, res) => {
  const order = findById('orders', Number(req.params.id));
  if (!order) {
    return res.status(404).json({ error: '订单不存在' });
  }
  
  if (order.buyerId !== req.user.id) {
    return res.status(403).json({ error: '无权限操作此订单' });
  }
  
  if (order.status !== ORDER_STATUS.INSPECTION_PASSED) {
    return res.status(400).json({ error: '订单状态不支持确认完成' });
  }
  
  const updatedOrder = update('orders', order.id, {
    status: ORDER_STATUS.COMPLETED,
    completedAt: new Date().toISOString()
  });
  
  res.json(updatedOrder);
});

router.post('/:id/cancel', authMiddleware, (req, res) => {
  const order = findById('orders', Number(req.params.id));
  if (!order) {
    return res.status(404).json({ error: '订单不存在' });
  }
  
  if (order.buyerId !== req.user.id) {
    return res.status(403).json({ error: '无权限操作此订单' });
  }
  
  if (order.status !== ORDER_STATUS.PENDING_PAYMENT) {
    return res.status(400).json({ error: '当前状态不能取消订单' });
  }
  
  const updatedOrder = update('orders', order.id, {
    status: ORDER_STATUS.CANCELLED,
    cancelledAt: new Date().toISOString()
  });
  
  res.json(updatedOrder);
});

module.exports = router;
