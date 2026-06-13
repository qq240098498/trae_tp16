const express = require('express');
const { findOne, update, insert, findAll, findById } = require('../db');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

router.get('/order/:orderId', authMiddleware, (req, res) => {
  const order = findById('orders', Number(req.params.orderId));
  if (!order) {
    return res.status(404).json({ error: '订单不存在' });
  }
  
  if (order.buyerId !== req.user.id && order.sellerId !== req.user.id) {
    return res.status(403).json({ error: '无权限查看此物流信息' });
  }
  
  const logistics = findOne('logistics', { orderId: order.id });
  if (!logistics) {
    return res.status(404).json({ error: '暂无物流信息' });
  }
  
  res.json(logistics);
});

router.post('/:logisticsId/update', authMiddleware, (req, res) => {
  const { location, description } = req.body;
  
  const logistics = findById('logistics', Number(req.params.logisticsId));
  if (!logistics) {
    return res.status(404).json({ error: '物流信息不存在' });
  }
  
  const order = findById('orders', logistics.orderId);
  if (!order || order.sellerId !== req.user.id) {
    return res.status(403).json({ error: '无权限操作' });
  }
  
  const newHistory = {
    time: new Date().toISOString(),
    location: location || logistics.currentLocation,
    description: description || '物流更新'
  };
  
  const updated = update('logistics', logistics.id, {
    currentLocation: location || logistics.currentLocation,
    trackingHistory: [...logistics.trackingHistory, newHistory]
  });
  
  res.json(updated);
});

module.exports = router;
