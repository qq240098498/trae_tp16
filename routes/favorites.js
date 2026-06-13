const express = require('express');
const { insert, findAll, findById, remove, findOne, update } = require('../db');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

router.get('/', authMiddleware, (req, res) => {
  const favorites = findAll('favorites', { userId: req.user.id });

  const result = favorites.map(fav => {
    const product = findById('products', fav.productId);
    return {
      id: fav.id,
      productId: fav.productId,
      createdAt: fav.createdAt,
      product: product ? {
        id: product.id,
        title: product.title,
        price: product.price,
        originalPrice: product.originalPrice,
        images: product.images,
        condition: product.condition,
        status: product.status
      } : null
    };
  }).filter(item => item.product && item.product.status === 'on_sale');

  res.json(result);
});

router.post('/:productId', authMiddleware, (req, res) => {
  const productId = Number(req.params.productId);

  const product = findById('products', productId);
  if (!product) {
    return res.status(404).json({ error: '商品不存在' });
  }

  const existing = findOne('favorites', { userId: req.user.id, productId });
  if (existing) {
    return res.status(400).json({ error: '已经收藏过该商品' });
  }

  const favorite = insert('favorites', {
    userId: req.user.id,
    productId
  });

  update('products', productId, { favorites: (product.favorites || 0) + 1 });

  res.json({ message: '收藏成功', favorite });
});

router.delete('/:productId', authMiddleware, (req, res) => {
  const productId = Number(req.params.productId);

  const favorite = findOne('favorites', { userId: req.user.id, productId });
  if (!favorite) {
    return res.status(404).json({ error: '未收藏该商品' });
  }

  remove('favorites', favorite.id);

  const product = findById('products', productId);
  if (product) {
    update('products', productId, { favorites: Math.max(0, (product.favorites || 0) - 1) });
  }

  res.json({ message: '取消收藏成功' });
});

module.exports = router;