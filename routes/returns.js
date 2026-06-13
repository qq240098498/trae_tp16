const express = require('express');
const { insert, findAll, findById, update, findOne } = require('../db');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

const RETURN_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  SHIPPED_BACK: 'shipped_back',
  DELIVERED_BACK: 'delivered_back',
  REFUNDED: 'refunded',
  CLOSED: 'closed'
};

router.get('/', authMiddleware, (req, res) => {
  const { status, role } = req.query;
  
  let returns = findAll('returns');
  
  if (role === 'buyer') {
    returns = returns.filter(r => {
      const order = findById('orders', r.orderId);
      return order && order.buyerId === req.user.id;
    });
  } else if (role === 'seller') {
    returns = returns.filter(r => {
      const order = findById('orders', r.orderId);
      return order && order.sellerId === req.user.id;
    });
  } else {
    returns = returns.filter(r => {
      const order = findById('orders', r.orderId);
      return order && (order.buyerId === req.user.id || order.sellerId === req.user.id);
    });
  }
  
  if (status) {
    returns = returns.filter(r => r.status === status);
  }
  
  const result = returns.map(ret => {
    const order = findById('orders', ret.orderId);
    const product = order ? findById('products', order.productId) : null;
    
    return {
      ...ret,
      order: order ? {
        id: order.id,
        orderNo: order.orderNo,
        price: order.price,
        status: order.status
      } : null,
      product: product ? {
        id: product.id,
        title: product.title,
        images: product.images
      } : null
    };
  });
  
  res.json(result);
});

router.get('/:id', authMiddleware, (req, res) => {
  const returnRecord = findById('returns', Number(req.params.id));
  if (!returnRecord) {
    return res.status(404).json({ error: '退货申请不存在' });
  }
  
  const order = findById('orders', returnRecord.orderId);
  if (!order || (order.buyerId !== req.user.id && order.sellerId !== req.user.id)) {
    return res.status(403).json({ error: '无权限查看此退货申请' });
  }
  
  const product = findById('products', order.productId);
  
  res.json({
    ...returnRecord,
    order: {
      id: order.id,
      orderNo: order.orderNo,
      price: order.price,
      status: order.status
    },
    product: product ? {
      id: product.id,
      title: product.title,
      images: product.images
    } : null
  });
});

router.post('/order/:orderId', authMiddleware, (req, res) => {
  const { reason, description } = req.body;
  
  const order = findById('orders', Number(req.params.orderId));
  if (!order) {
    return res.status(404).json({ error: '订单不存在' });
  }
  
  if (order.buyerId !== req.user.id) {
    return res.status(403).json({ error: '无权限申请退货' });
  }
  
  if (
    order.status !== 'pending_payment' &&
    order.status !== 'paid' &&
    order.status !== 'inspection_passed' &&
    order.status !== 'delivered' &&
    order.status !== 'completed'
  ) {
    return res.status(400).json({ error: '当前订单状态不支持退货' });
  }
  
  const existingReturn = findOne('returns', { orderId: order.id });
  if (existingReturn && existingReturn.status !== 'closed' && existingReturn.status !== 'rejected') {
    return res.status(400).json({ error: '已有进行中的退货申请' });
  }
  
  const returnRecord = insert('returns', {
    orderId: order.id,
    reason: reason || '',
    description: description || '',
    status: RETURN_STATUS.PENDING,
    sellerRemark: ''
  });
  
  update('orders', order.id, { status: 'return_requested' });
  
  res.json(returnRecord);
});

router.post('/:id/approve', authMiddleware, (req, res) => {
  const { remark } = req.body;

  const returnRecord = findById('returns', Number(req.params.id));
  if (!returnRecord) {
    return res.status(404).json({ error: '退货申请不存在' });
  }

  const order = findById('orders', returnRecord.orderId);
  if (!order || order.sellerId !== req.user.id) {
    return res.status(403).json({ error: '无权限操作' });
  }

  if (returnRecord.status !== RETURN_STATUS.PENDING) {
    return res.status(400).json({ error: '当前状态不支持审批' });
  }

  const now = new Date().toISOString();

  if (order.status === 'pending_payment') {
    update('returns', returnRecord.id, {
      status: RETURN_STATUS.CLOSED,
      sellerRemark: remark || '',
      approvedAt: now,
    });
    update('orders', order.id, { status: 'returned', returnedAt: now });
    update('products', order.productId, { status: 'on_sale' });
    return res.json({ message: '已批准退款，订单关闭' });
  }

  if (order.status === 'paid') {
    const buyer = findById('users', order.buyerId);
    if (buyer) {
      update('users', order.buyerId, { balance: buyer.balance + order.price });
    }
    update('returns', returnRecord.id, {
      status: RETURN_STATUS.REFUNDED,
      sellerRemark: remark || '',
      approvedAt: now,
      refundedAt: now,
    });
    update('orders', order.id, { status: 'returned', returnedAt: now });
    update('products', order.productId, { status: 'on_sale' });
    return res.json({ message: '已批准退款，余额已退回买家' });
  }

  const updated = update('returns', returnRecord.id, {
    status: RETURN_STATUS.APPROVED,
    sellerRemark: remark || '',
    approvedAt: now,
  });

  res.json(updated);
});

router.post('/:id/reject', authMiddleware, (req, res) => {
  const { reason } = req.body;
  
  const returnRecord = findById('returns', Number(req.params.id));
  if (!returnRecord) {
    return res.status(404).json({ error: '退货申请不存在' });
  }
  
  const order = findById('orders', returnRecord.orderId);
  if (!order || order.sellerId !== req.user.id) {
    return res.status(403).json({ error: '无权限操作' });
  }
  
  if (returnRecord.status !== RETURN_STATUS.PENDING) {
    return res.status(400).json({ error: '当前状态不支持审批' });
  }
  
  const updated = update('returns', returnRecord.id, {
    status: RETURN_STATUS.REJECTED,
    sellerRemark: reason || '',
    rejectedAt: new Date().toISOString()
  });
  
  res.json(updated);
});

router.post('/:id/ship-back', authMiddleware, (req, res) => {
  const { trackingNo, courier } = req.body;
  
  const returnRecord = findById('returns', Number(req.params.id));
  if (!returnRecord) {
    return res.status(404).json({ error: '退货申请不存在' });
  }
  
  const order = findById('orders', returnRecord.orderId);
  if (!order || order.buyerId !== req.user.id) {
    return res.status(403).json({ error: '无权限操作' });
  }
  
  if (returnRecord.status !== RETURN_STATUS.APPROVED) {
    return res.status(400).json({ error: '当前状态不支持发货' });
  }
  
  const updated = update('returns', returnRecord.id, {
    status: RETURN_STATUS.SHIPPED_BACK,
    returnTrackingNo: trackingNo || '',
    returnCourier: courier || '',
    shippedBackAt: new Date().toISOString()
  });
  
  res.json(updated);
});

router.post('/:id/confirm-receipt', authMiddleware, (req, res) => {
  const returnRecord = findById('returns', Number(req.params.id));
  if (!returnRecord) {
    return res.status(404).json({ error: '退货申请不存在' });
  }
  
  const order = findById('orders', returnRecord.orderId);
  if (!order || order.sellerId !== req.user.id) {
    return res.status(403).json({ error: '无权限操作' });
  }
  
  if (returnRecord.status !== RETURN_STATUS.SHIPPED_BACK) {
    return res.status(400).json({ error: '当前状态不支持确认收货' });
  }
  
  const updated = update('returns', returnRecord.id, {
    status: RETURN_STATUS.DELIVERED_BACK,
    deliveredBackAt: new Date().toISOString()
  });
  
  res.json(updated);
});

router.post('/:id/refund', authMiddleware, (req, res) => {
  const returnRecord = findById('returns', Number(req.params.id));
  if (!returnRecord) {
    return res.status(404).json({ error: '退货申请不存在' });
  }
  
  const order = findById('orders', returnRecord.orderId);
  if (!order || order.sellerId !== req.user.id) {
    return res.status(403).json({ error: '无权限操作' });
  }
  
  if (returnRecord.status !== RETURN_STATUS.DELIVERED_BACK) {
    return res.status(400).json({ error: '当前状态不支持退款' });
  }
  
  const buyer = findById('users', order.buyerId);
  if (buyer) {
    update('users', order.buyerId, { balance: buyer.balance + order.price });
  }
  
  const seller = findById('users', order.sellerId);
  if (seller) {
    update('users', order.sellerId, { balance: Math.max(0, seller.balance - order.price) });
  }
  
  update('returns', returnRecord.id, {
    status: RETURN_STATUS.REFUNDED,
    refundedAt: new Date().toISOString()
  });
  
  const updatedOrder = update('orders', order.id, {
    status: 'returned',
    returnedAt: new Date().toISOString()
  });
  
  update('products', order.productId, { status: 'on_sale' });
  
  res.json({ message: '退款成功', order: updatedOrder });
});

module.exports = router;
