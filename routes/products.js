const express = require('express');
const { insert, findAll, findById, update, remove } = require('../db');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

const CATEGORIES = ['数码产品', '家居生活', '服装鞋帽', '图书文具', '运动户外', '母婴用品', '美妆护肤', '其他'];

router.get('/categories', (req, res) => {
  res.json(CATEGORIES);
});

router.get('/', (req, res) => {
  const { category, keyword, minPrice, maxPrice, sellerId, page = 1, limit = 20 } = req.query;
  
  let products = findAll('products', { status: 'on_sale' });
  
  if (category) {
    products = products.filter(p => p.category === category);
  }
  
  if (keyword) {
    const kw = keyword.toLowerCase();
    products = products.filter(p => 
      p.title.toLowerCase().includes(kw) || 
      p.description.toLowerCase().includes(kw)
    );
  }
  
  if (minPrice) {
    products = products.filter(p => p.price >= Number(minPrice));
  }
  
  if (maxPrice) {
    products = products.filter(p => p.price <= Number(maxPrice));
  }
  
  if (sellerId) {
    products = products.filter(p => p.sellerId === Number(sellerId));
  }
  
  const start = (Number(page) - 1) * Number(limit);
  const end = start + Number(limit);
  const paginated = products.slice(start, end);
  
  const result = paginated.map(p => {
    const { sellerId, ...rest } = p;
    return rest;
  });
  
  res.json({
    total: products.length,
    page: Number(page),
    limit: Number(limit),
    list: result
  });
});

router.get('/my', authMiddleware, (req, res) => {
  const products = findAll('products', { sellerId: req.user.id });
  res.json(products);
});

router.get('/:id', (req, res) => {
  const product = findById('products', Number(req.params.id));
  if (!product) {
    return res.status(404).json({ error: '商品不存在' });
  }
  
  const updated = update('products', product.id, { views: (product.views || 0) + 1 });
  
  const seller = findById('users', product.sellerId);
  const sellerInfo = seller ? {
    id: seller.id,
    nickname: seller.nickname,
    avatar: seller.avatar
  } : null;
  
  res.json({
    ...updated,
    seller: sellerInfo
  });
});

router.post('/', authMiddleware, (req, res) => {
  const { title, description, price, category, images, originalPrice, condition } = req.body;
  
  if (!title || !price || !category) {
    return res.status(400).json({ error: '标题、价格、分类不能为空' });
  }
  
  if (!CATEGORIES.includes(category)) {
    return res.status(400).json({ error: '分类不合法' });
  }
  
  const product = insert('products', {
    title,
    description: description || '',
    price: Number(price),
    originalPrice: originalPrice ? Number(originalPrice) : Number(price),
    category,
    condition: condition || '九成新',
    images: images || [
      `https://picsum.photos/400/400?random=${Date.now()}`,
      `https://picsum.photos/400/400?random=${Date.now() + 1}`,
      `https://picsum.photos/400/400?random=${Date.now() + 2}`
    ],
    sellerId: req.user.id,
    status: 'on_sale',
    views: 0,
    favorites: 0
  });
  
  res.json(product);
});

router.put('/:id', authMiddleware, (req, res) => {
  const product = findById('products', Number(req.params.id));
  if (!product) {
    return res.status(404).json({ error: '商品不存在' });
  }
  
  if (product.sellerId !== req.user.id) {
    return res.status(403).json({ error: '无权限修改此商品' });
  }
  
  const { title, description, price, category, images, originalPrice, condition, status } = req.body;
  
  const updates = {};
  if (title !== undefined) updates.title = title;
  if (description !== undefined) updates.description = description;
  if (price !== undefined) updates.price = Number(price);
  if (originalPrice !== undefined) updates.originalPrice = Number(originalPrice);
  if (category !== undefined) {
    if (!CATEGORIES.includes(category)) {
      return res.status(400).json({ error: '分类不合法' });
    }
    updates.category = category;
  }
  if (condition !== undefined) updates.condition = condition;
  if (images !== undefined) updates.images = images;
  if (status !== undefined) updates.status = status;
  
  const updated = update('products', Number(req.params.id), updates);
  res.json(updated);
});

router.delete('/:id', authMiddleware, (req, res) => {
  const product = findById('products', Number(req.params.id));
  if (!product) {
    return res.status(404).json({ error: '商品不存在' });
  }
  
  if (product.sellerId !== req.user.id) {
    return res.status(403).json({ error: '无权限删除此商品' });
  }
  
  remove('products', Number(req.params.id));
  res.json({ message: '删除成功' });
});

module.exports = router;
