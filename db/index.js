const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const PRODUCTS_FILE = path.join(DATA_DIR, 'products.json');
const ORDERS_FILE = path.join(DATA_DIR, 'orders.json');
const LOGISTICS_FILE = path.join(DATA_DIR, 'logistics.json');
const RETURNS_FILE = path.join(DATA_DIR, 'returns.json');
const FAVORITES_FILE = path.join(DATA_DIR, 'favorites.json');

let db = {
  users: [],
  products: [],
  orders: [],
  logistics: [],
  returns: [],
  favorites: []
};

let idCounters = {
  users: 1,
  products: 1,
  orders: 1,
  logistics: 1,
  returns: 1,
  favorites: 1
};

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function loadData() {
  ensureDataDir();
  try {
    if (fs.existsSync(USERS_FILE)) {
      db.users = JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
      idCounters.users = db.users.length > 0 ? Math.max(...db.users.map(u => u.id)) + 1 : 1;
    }
    if (fs.existsSync(PRODUCTS_FILE)) {
      db.products = JSON.parse(fs.readFileSync(PRODUCTS_FILE, 'utf8'));
      idCounters.products = db.products.length > 0 ? Math.max(...db.products.map(p => p.id)) + 1 : 1;
    }
    if (fs.existsSync(ORDERS_FILE)) {
      db.orders = JSON.parse(fs.readFileSync(ORDERS_FILE, 'utf8'));
      idCounters.orders = db.orders.length > 0 ? Math.max(...db.orders.map(o => o.id)) + 1 : 1;
    }
    if (fs.existsSync(LOGISTICS_FILE)) {
      db.logistics = JSON.parse(fs.readFileSync(LOGISTICS_FILE, 'utf8'));
      idCounters.logistics = db.logistics.length > 0 ? Math.max(...db.logistics.map(l => l.id)) + 1 : 1;
    }
    if (fs.existsSync(RETURNS_FILE)) {
      db.returns = JSON.parse(fs.readFileSync(RETURNS_FILE, 'utf8'));
      idCounters.returns = db.returns.length > 0 ? Math.max(...db.returns.map(r => r.id)) + 1 : 1;
    }
    if (fs.existsSync(FAVORITES_FILE)) {
      db.favorites = JSON.parse(fs.readFileSync(FAVORITES_FILE, 'utf8'));
      idCounters.favorites = db.favorites.length > 0 ? Math.max(...db.favorites.map(f => f.id)) + 1 : 1;
    }
  } catch (e) {
    console.error('加载数据失败:', e.message);
  }
}

function saveData(table) {
  ensureDataDir();
  try {
    switch (table) {
      case 'users':
        fs.writeFileSync(USERS_FILE, JSON.stringify(db.users, null, 2));
        break;
      case 'products':
        fs.writeFileSync(PRODUCTS_FILE, JSON.stringify(db.products, null, 2));
        break;
      case 'orders':
        fs.writeFileSync(ORDERS_FILE, JSON.stringify(db.orders, null, 2));
        break;
      case 'logistics':
        fs.writeFileSync(LOGISTICS_FILE, JSON.stringify(db.logistics, null, 2));
        break;
      case 'returns':
        fs.writeFileSync(RETURNS_FILE, JSON.stringify(db.returns, null, 2));
        break;
      case 'favorites':
        fs.writeFileSync(FAVORITES_FILE, JSON.stringify(db.favorites, null, 2));
        break;
    }
  } catch (e) {
    console.error('保存数据失败:', e.message);
  }
}

function nextId(table) {
  return idCounters[table]++;
}

function insert(table, record) {
  const id = nextId(table);
  record.id = id;
  record.createdAt = new Date().toISOString();
  record.updatedAt = new Date().toISOString();
  db[table].push(record);
  saveData(table);
  return record;
}

function findAll(table, filter = {}) {
  let results = [...db[table]];
  Object.keys(filter).forEach(key => {
    results = results.filter(item => item[key] === filter[key]);
  });
  return results.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

function findOne(table, filter) {
  return db[table].find(item => {
    return Object.keys(filter).every(key => item[key] === filter[key]);
  }) || null;
}

function findById(table, id) {
  return db[table].find(item => item.id === id) || null;
}

function update(table, id, updates) {
  const record = findById(table, id);
  if (!record) return null;
  Object.assign(record, updates);
  record.updatedAt = new Date().toISOString();
  saveData(table);
  return record;
}

function remove(table, id) {
  const index = db[table].findIndex(item => item.id === id);
  if (index === -1) return false;
  db[table].splice(index, 1);
  saveData(table);
  return true;
}

loadData();

module.exports = {
  insert,
  findAll,
  findOne,
  findById,
  update,
  remove
};
