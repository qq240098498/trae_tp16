const express = require('express');
const cors = require('cors');
const path = require('path');
const usersRouter = require('./routes/users');
const productsRouter = require('./routes/products');
const ordersRouter = require('./routes/orders');
const logisticsRouter = require('./routes/logistics');
const returnsRouter = require('./routes/returns');
const favoritesRouter = require('./routes/favorites');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, 'public')));

app.use('/api/users', usersRouter);
app.use('/api/products', productsRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/logistics', logisticsRouter);
app.use('/api/returns', returnsRouter);
app.use('/api/favorites', favoritesRouter);

app.get('/api', (req, res) => {
  res.json({
    name: '二手交易平台 API',
    version: '1.0.0',
    endpoints: {
      users: '/api/users',
      products: '/api/products',
      orders: '/api/orders',
      logistics: '/api/logistics',
      returns: '/api/returns'
    }
  });
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: '服务器内部错误' });
});

app.listen(PORT, () => {
  console.log(`二手交易平台服务已启动: http://localhost:${PORT}`);
});
