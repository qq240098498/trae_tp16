const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { insert, findOne, findById, update } = require('../db');
const { authMiddleware, JWT_SECRET } = require('../middleware/auth');

const router = express.Router();

router.post('/register', (req, res) => {
  const { username, password, nickname, phone } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({ error: '用户名和密码不能为空' });
  }
  
  const existing = findOne('users', { username });
  if (existing) {
    return res.status(400).json({ error: '用户名已存在' });
  }
  
  const hashedPassword = bcrypt.hashSync(password, 10);
  
  const user = insert('users', {
    username,
    password: hashedPassword,
    nickname: nickname || username,
    phone: phone || '',
    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(username)}`,
    balance: 10000,
    address: ''
  });
  
  const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });
  
  res.json({
    token,
    user: {
      id: user.id,
      username: user.username,
      nickname: user.nickname,
      phone: user.phone,
      avatar: user.avatar,
      balance: user.balance,
      address: user.address
    }
  });
});

router.post('/login', (req, res) => {
  const { username, password } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({ error: '用户名和密码不能为空' });
  }
  
  const user = findOne('users', { username });
  if (!user) {
    return res.status(400).json({ error: '用户名或密码错误' });
  }
  
  const valid = bcrypt.compareSync(password, user.password);
  if (!valid) {
    return res.status(400).json({ error: '用户名或密码错误' });
  }
  
  const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });
  
  res.json({
    token,
    user: {
      id: user.id,
      username: user.username,
      nickname: user.nickname,
      phone: user.phone,
      avatar: user.avatar,
      balance: user.balance,
      address: user.address
    }
  });
});

router.get('/profile', authMiddleware, (req, res) => {
  const user = findById('users', req.user.id);
  if (!user) {
    return res.status(404).json({ error: '用户不存在' });
  }
  
  res.json({
    id: user.id,
    username: user.username,
    nickname: user.nickname,
    phone: user.phone,
    avatar: user.avatar,
    balance: user.balance,
    address: user.address
  });
});

router.put('/profile', authMiddleware, (req, res) => {
  const { nickname, phone, address } = req.body;
  
  const updates = {};
  if (nickname !== undefined) updates.nickname = nickname;
  if (phone !== undefined) updates.phone = phone;
  if (address !== undefined) updates.address = address;
  
  const user = update('users', req.user.id, updates);
  if (!user) {
    return res.status(404).json({ error: '用户不存在' });
  }
  
  res.json({
    id: user.id,
    username: user.username,
    nickname: user.nickname,
    phone: user.phone,
    avatar: user.avatar,
    balance: user.balance,
    address: user.address
  });
});

module.exports = router;
