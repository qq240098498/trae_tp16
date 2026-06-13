const API_BASE = '/api';

const ORDER_STATUS_TEXT = {
  pending_payment: '待付款',
  paid: '已付款',
  shipped: '已发货',
  delivered: '已送达',
  inspecting: '验货中',
  inspection_passed: '验货通过',
  inspection_failed: '验货未通过',
  completed: '已完成',
  cancelled: '已取消',
  return_requested: '申请退货中',
  returned: '已退货'
};

const RETURN_STATUS_TEXT = {
  pending: '待审核',
  approved: '已同意退货',
  rejected: '已拒绝退货',
  shipped_back: '买家已退回',
  delivered_back: '卖家已签收',
  refunded: '已退款',
  closed: '已关闭'
};

let currentUser = null;
let currentCategory = '';
let currentOrderTab = 'all';
let currentOrderId = null;
let currentReturnId = null;
let currentProductId = null;
let isRegisterMode = false;

function getToken() {
  return localStorage.getItem('token');
}

function setToken(token) {
  localStorage.setItem('token', token);
}

function clearToken() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  currentUser = null;
}

function setUser(user) {
  localStorage.setItem('user', JSON.stringify(user));
  currentUser = user;
}

function getUser() {
  if (currentUser) return currentUser;
  const userStr = localStorage.getItem('user');
  if (userStr) {
    currentUser = JSON.parse(userStr);
    return currentUser;
  }
  return null;
}

function isLoggedIn() {
  return !!getToken() && !!getUser();
}

async function request(url, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };
  const token = getToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  try {
    const res = await fetch(`${API_BASE}${url}`, {
      ...options,
      headers
    });
    const data = await res.json();
    if (!res.ok) {
      showToast(data.error || '请求失败');
      return null;
    }
    return data;
  } catch (e) {
    showToast('网络错误');
    return null;
  }
}

function showToast(message) {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => {
    toast.remove();
  }, 2500);
}

function showModal(title, content, actions = []) {
  const container = document.getElementById('modal-container');
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.innerHTML = `
    <div class="modal-content">
      <h3>${title}</h3>
      <div class="modal-body">${content}</div>
      <div class="modal-actions"></div>
    </div>
  `;
  
  const actionsContainer = modal.querySelector('.modal-actions');
  actions.forEach(action => {
    const btn = document.createElement('button');
    btn.className = `btn ${action.type || 'btn-secondary'}`;
    btn.textContent = action.label;
    btn.onclick = () => {
      if (action.onClick) action.onClick();
      if (action.close !== false) modal.remove();
    };
    actionsContainer.appendChild(btn);
  });
  
  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.remove();
  });
  
  container.appendChild(modal);
  return modal;
}

function closeModal() {
  const container = document.getElementById('modal-container');
  container.innerHTML = '';
}

function navigate(page, param) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const targetPage = document.getElementById(`page-${page}`);
  if (targetPage) {
    targetPage.classList.add('active');
  }
  
  switch (page) {
    case 'home':
      loadProducts();
      break;
    case 'detail':
      currentProductId = param;
      loadProductDetail(param);
      break;
    case 'publish':
      if (!isLoggedIn()) {
        showToast('请先登录');
        navigate('login');
        return;
      }
      loadCategoriesForPublish();
      break;
    case 'orders':
      if (!isLoggedIn()) {
        showToast('请先登录');
        navigate('login');
        return;
      }
      loadOrders();
      break;
    case 'order-detail':
      currentOrderId = param;
      loadOrderDetail(param);
      break;
    case 'return':
      currentOrderId = param;
      break;
    case 'returns':
      loadReturns();
      break;
    case 'return-detail':
      currentReturnId = param;
      loadReturnDetail(param);
      break;
    case 'profile':
      if (!isLoggedIn()) {
        showToast('请先登录');
        navigate('login');
        return;
      }
      loadProfile();
      break;
  }
  
  window.scrollTo(0, 0);
}

function updateNav() {
  const user = getUser();
  const navUser = document.getElementById('nav-user');
  const navLogin = document.getElementById('nav-login');
  const navAvatar = document.getElementById('nav-avatar');
  const navNickname = document.getElementById('nav-nickname');
  
  if (user) {
    navUser.style.display = 'flex';
    navLogin.style.display = 'none';
    navAvatar.src = user.avatar;
    navNickname.textContent = user.nickname;
  } else {
    navUser.style.display = 'none';
    navLogin.style.display = 'inline';
  }
}

function switchAuthMode() {
  isRegisterMode = !isRegisterMode;
  const title = document.getElementById('login-title');
  const registerFields = document.getElementById('register-fields');
  const registerPhone = document.getElementById('register-phone');
  const switchText = document.getElementById('switch-text');
  const switchLink = document.getElementById('switch-link');
  const submitBtn = document.querySelector('#login-form button');
  
  if (isRegisterMode) {
    title.textContent = '注册';
    registerFields.style.display = 'block';
    registerPhone.style.display = 'block';
    switchText.textContent = '已有账号？';
    switchLink.textContent = '立即登录';
    submitBtn.textContent = '注册';
  } else {
    title.textContent = '登录';
    registerFields.style.display = 'none';
    registerPhone.style.display = 'none';
    switchText.textContent = '还没有账号？';
    switchLink.textContent = '立即注册';
    submitBtn.textContent = '登录';
  }
}

async function handleLogin(event) {
  event.preventDefault();
  const username = document.getElementById('login-username').value;
  const password = document.getElementById('login-password').value;
  
  if (isRegisterMode) {
    const nickname = document.getElementById('register-nickname').value;
    const phone = document.getElementById('register-phone-input').value;
    
    const data = await request('/users/register', {
      method: 'POST',
      body: JSON.stringify({ username, password, nickname, phone })
    });
    
    if (data) {
      setToken(data.token);
      setUser(data.user);
      updateNav();
      showToast('注册成功');
      navigate('home');
    }
  } else {
    const data = await request('/users/login', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    });
    
    if (data) {
      setToken(data.token);
      setUser(data.user);
      updateNav();
      showToast('登录成功');
      navigate('home');
    }
  }
}

function logout() {
  clearToken();
  updateNav();
  showToast('已退出登录');
  navigate('home');
}

async function loadCategories() {
  const categories = await request('/products/categories');
  if (categories) {
    const tabsContainer = document.getElementById('category-tabs');
    const searchSelect = document.getElementById('search-category');
    
    tabsContainer.innerHTML = '<div class="category-tab active" onclick="selectCategory(\'\', this)">全部</div>';
    categories.forEach(cat => {
      tabsContainer.innerHTML += `<div class="category-tab" onclick="selectCategory('${cat}', this)">${cat}</div>`;
      searchSelect.innerHTML += `<option value="${cat}">${cat}</option>`;
    });
  }
}

function selectCategory(category, el) {
  currentCategory = category;
  document.querySelectorAll('.category-tab').forEach(tab => tab.classList.remove('active'));
  if (el) el.classList.add('active');
  loadProducts();
}

function handleSearch(event) {
  if (event.key === 'Enter') {
    loadProducts();
  }
}

async function loadProducts() {
  const keyword = document.getElementById('search-keyword')?.value || '';
  const category = document.getElementById('search-category')?.value || currentCategory;
  
  let url = '/products?page=1&limit=50';
  if (keyword) url += `&keyword=${encodeURIComponent(keyword)}`;
  if (category) url += `&category=${encodeURIComponent(category)}`;
  
  const data = await request(url);
  const grid = document.getElementById('product-grid');
  
  if (!data || data.list.length === 0) {
    grid.innerHTML = `
      <div class="empty-state" style="grid-column:1/-1;">
        <div class="icon">📦</div>
        <p>暂无商品</p>
      </div>
    `;
    return;
  }
  
  grid.innerHTML = data.list.map(product => `
    <div class="product-card" onclick="navigate('detail', ${product.id})">
      <img src="${product.images[0]}" alt="${product.title}" class="product-image">
      <div class="product-info">
        <div class="product-title">${product.title}</div>
        <div>
          <span class="product-price"><span class="yuan">¥</span>${product.price}</span>
          ${product.originalPrice && product.originalPrice > product.price ? 
            `<span class="product-original-price">¥${product.originalPrice}</span>` : ''}
        </div>
        <div class="product-meta">
          <span class="product-condition">${product.condition || '九成新'}</span>
          <span>${product.views || 0} 浏览</span>
        </div>
      </div>
    </div>
  `).join('');
}

async function loadProductDetail(id) {
  const product = await request(`/products/${id}`);
  const container = document.getElementById('product-detail');
  
  if (!product) {
    container.innerHTML = '<div class="empty-state"><p>商品不存在</p></div>';
    return;
  }
  
  const user = getUser();
  const isOwner = user && product.seller && user.id === product.seller.id;
  
  container.innerHTML = `
    <div class="product-detail-layout">
      <div class="product-gallery">
        <img src="${product.images[0]}" alt="${product.title}" id="main-image">
        <div class="product-gallery-thumb">
          ${product.images.map((img, i) => `
            <img src="${img}" alt="" class="${i === 0 ? 'active' : ''}" 
                 onclick="changeMainImage('${img}', this)">
          `).join('')}
        </div>
      </div>
      <div class="product-detail-info">
        <h1>${product.title}</h1>
        <div class="product-detail-price">
          <span class="yuan">¥</span>${product.price}
          ${product.originalPrice && product.originalPrice > product.price ? 
            `<span class="product-original-price" style="font-size:16px; margin-left:12px;">¥${product.originalPrice}</span>` : ''}
        </div>
        <div class="product-detail-meta">
          <div class="meta-item">分类：<strong>${product.category}</strong></div>
          <div class="meta-item">成色：<strong>${product.condition || '九成新'}</strong></div>
          <div class="meta-item">浏览：<strong>${product.views || 0}</strong></div>
        </div>
        <div class="product-detail-description">
          <h3>商品描述</h3>
          <p>${product.description || '暂无描述'}</p>
        </div>
        ${product.seller ? `
          <div class="seller-card">
            <img src="${product.seller.avatar}" alt="${product.seller.nickname}">
            <div class="seller-info">
              <div class="nickname">${product.seller.nickname}</div>
              <div class="stats">卖家</div>
            </div>
          </div>
        ` : ''}
        <div class="product-actions">
          ${isOwner ? 
            `<button class="btn btn-secondary" onclick="navigate('home')">返回首页</button>` :
            `<button class="btn btn-primary" onclick="buyNow(${product.id})">立即购买</button>`
          }
        </div>
      </div>
    </div>
  `;
}

function changeMainImage(src, el) {
  document.getElementById('main-image').src = src;
  document.querySelectorAll('.product-gallery-thumb img').forEach(img => img.classList.remove('active'));
  el.classList.add('active');
}

function buyNow(productId) {
  if (!isLoggedIn()) {
    showToast('请先登录');
    navigate('login');
    return;
  }
  
  const user = getUser();
  
  showModal('确认购买', `
    <div class="form-group">
      <label>收货地址 *</label>
      <textarea id="buy-address" placeholder="请输入收货地址">${user.address || ''}</textarea>
    </div>
    <div class="form-group">
      <label>联系电话 *</label>
      <input type="text" id="buy-phone" placeholder="请输入联系电话" value="${user.phone || ''}">
    </div>
    <div class="form-group">
      <label>买家备注</label>
      <input type="text" id="buy-remark" placeholder="选填">
    </div>
    <p style="color:#666; font-size:13px;">当前余额：<span style="color:#ff4444; font-weight:bold;">¥${user.balance?.toFixed(2) || '0.00'}</span></p>
  `, [
    { label: '取消', type: 'btn-secondary' },
    { label: '确认下单', type: 'btn-primary', onClick: () => confirmBuy(productId) }
  ]);
}

async function confirmBuy(productId) {
  const address = document.getElementById('buy-address').value;
  const phone = document.getElementById('buy-phone').value;
  const buyerRemark = document.getElementById('buy-remark').value;
  
  if (!address || !phone) {
    showToast('请填写收货地址和联系电话');
    return;
  }
  
  const order = await request('/orders', {
    method: 'POST',
    body: JSON.stringify({ productId, address, phone, buyerRemark })
  });
  
  if (order) {
    closeModal();
    showToast('下单成功，请支付');
    navigate('order-detail', order.id);
  }
}

async function loadCategoriesForPublish() {
  const categories = await request('/products/categories');
  const select = document.getElementById('publish-category');
  if (categories) {
    select.innerHTML = categories.map(cat => `<option value="${cat}">${cat}</option>`).join('');
  }
}

async function handlePublish(event) {
  event.preventDefault();
  
  const title = document.getElementById('publish-title').value;
  const category = document.getElementById('publish-category').value;
  const price = document.getElementById('publish-price').value;
  const originalPrice = document.getElementById('publish-original-price').value;
  const condition = document.getElementById('publish-condition').value;
  const description = document.getElementById('publish-description').value;
  const imagesText = document.getElementById('publish-images').value;
  
  let images = [];
  if (imagesText.trim()) {
    images = imagesText.split('\n').map(s => s.trim()).filter(s => s);
  }
  
  const product = await request('/products', {
    method: 'POST',
    body: JSON.stringify({
      title,
      category,
      price,
      originalPrice: originalPrice || null,
      condition,
      description,
      images: images.length > 0 ? images : null
    })
  });
  
  if (product) {
    showToast('发布成功');
    document.getElementById('publish-form').reset();
    navigate('detail', product.id);
  }
}

function switchOrderTab(role, el) {
  currentOrderTab = role;
  document.querySelectorAll('.order-tab').forEach(tab => tab.classList.remove('active'));
  if (el) el.classList.add('active');
  loadOrders();
}

async function loadOrders() {
  let url = '/orders';
  if (currentOrderTab !== 'all') {
    url += `?role=${currentOrderTab}`;
  }
  
  const orders = await request(url);
  const list = document.getElementById('order-list');
  
  if (!orders || orders.length === 0) {
    list.innerHTML = `
      <div class="empty-state">
        <div class="icon">📋</div>
        <p>暂无订单</p>
        <button class="btn btn-primary" onclick="navigate('home')">去逛逛</button>
      </div>
    `;
    return;
  }
  
  list.innerHTML = orders.map(order => `
    <div class="order-card" onclick="navigate('order-detail', ${order.id})">
      <div class="order-header">
        <span class="order-no">订单号：${order.orderNo}</span>
        <span class="order-status">${ORDER_STATUS_TEXT[order.status] || order.status}</span>
      </div>
      <div class="order-body">
        <img src="${order.product?.images[0]}" alt="${order.product?.title}">
        <div class="order-info">
          <div class="order-title">${order.product?.title}</div>
          <div class="order-price">¥${order.price}</div>
        </div>
      </div>
    </div>
  `).join('');
}

async function loadOrderDetail(id) {
  const order = await request(`/orders/${id}`);
  const container = document.getElementById('order-detail-content');
  
  if (!order) {
    container.innerHTML = '<div class="empty-state"><p>订单不存在</p></div>';
    return;
  }
  
  const user = getUser();
  const isBuyer = user && order.buyerId === user.id;
  const isSeller = user && order.sellerId === user.id;
  
  let actionsHtml = '';
  
  if (isBuyer) {
    if (order.status === 'pending_payment') {
      actionsHtml = `
        <button class="btn btn-secondary" onclick="cancelOrder(${order.id})">取消订单</button>
        <button class="btn btn-primary" onclick="payOrder(${order.id})">立即支付</button>
      `;
    } else if (order.status === 'shipped') {
      actionsHtml = `
        <button class="btn btn-primary" onclick="confirmDelivery(${order.id})">确认收货</button>
      `;
    } else if (order.status === 'delivered') {
      actionsHtml = `
        <button class="btn btn-secondary" onclick="showInspectModal(${order.id}, false)">验货不通过</button>
        <button class="btn btn-primary" onclick="showInspectModal(${order.id}, true)">验货通过</button>
      `;
    } else if (order.status === 'inspection_passed') {
      actionsHtml = `
        <button class="btn btn-primary" onclick="completeOrder(${order.id})">确认完成</button>
      `;
    } else if (order.status === 'delivered' || order.status === 'inspection_passed' || order.status === 'completed') {
      actionsHtml = `
        <button class="btn btn-secondary" onclick="navigate('return', ${order.id})">申请退货</button>
      `;
    }
  }
  
  if (isSeller) {
    if (order.status === 'paid') {
      actionsHtml = `
        <button class="btn btn-primary" onclick="showShipModal(${order.id})">去发货</button>
      `;
    }
  }
  
  let logisticsHtml = '';
  if (order.logistics) {
    logisticsHtml = `
      <div class="logistics-timeline">
        <h3>物流信息</h3>
        <p style="margin-bottom:12px; font-size:14px; color:#666;">
          快递公司：${order.logistics.courier} &nbsp;&nbsp; 运单号：${order.logistics.trackingNo}
        </p>
        <div class="timeline">
          ${order.logistics.trackingHistory?.slice().reverse().map(item => `
            <div class="timeline-item">
              <div class="timeline-time">${formatTime(item.time)}</div>
              <div class="timeline-location">${item.location}</div>
              ${item.description ? `<div class="timeline-desc">${item.description}</div>` : ''}
            </div>
          `).join('') || ''}
        </div>
      </div>
    `;
  }
  
  container.innerHTML = `
    <div class="order-card">
      <div class="order-header">
        <span class="order-no">订单号：${order.orderNo}</span>
        <span class="order-status">${ORDER_STATUS_TEXT[order.status] || order.status}</span>
      </div>
      <div class="order-body" style="cursor:pointer;" onclick="navigate('detail', ${order.productId})">
        <img src="${order.product?.images[0]}" alt="${order.product?.title}">
        <div class="order-info">
          <div class="order-title">${order.product?.title}</div>
          <div class="order-price">¥${order.price}</div>
        </div>
      </div>
      <div style="padding:16px 20px; border-top:1px solid #eee;">
        <p style="font-size:14px; color:#666; margin-bottom:8px;">
          <strong>收货地址：</strong>${order.address}
        </p>
        <p style="font-size:14px; color:#666; margin-bottom:8px;">
          <strong>联系电话：</strong>${order.phone}
        </p>
        <p style="font-size:14px; color:#666;">
          <strong>${isBuyer ? '卖家' : '买家'}：</strong>${isBuyer ? order.seller?.nickname : order.buyer?.nickname}
        </p>
        ${order.buyerRemark ? `<p style="font-size:14px; color:#666; margin-top:8px;"><strong>备注：</strong>${order.buyerRemark}</p>` : ''}
      </div>
      ${actionsHtml ? `
        <div class="order-actions">${actionsHtml}</div>
      ` : ''}
    </div>
    ${logisticsHtml}
  `;
}

function formatTime(isoString) {
  if (!isoString) return '';
  const date = new Date(isoString);
  return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')} ${String(date.getHours()).padStart(2,'0')}:${String(date.getMinutes()).padStart(2,'0')}`;
}

async function payOrder(orderId) {
  const result = await request(`/orders/${orderId}/pay`, { method: 'POST' });
  if (result) {
    showToast('支付成功');
    const user = getUser();
    if (user) {
      user.balance -= result.price || 0;
      setUser(user);
    }
    loadOrderDetail(orderId);
  }
}

async function cancelOrder(orderId) {
  showModal('确认取消', '确定要取消这个订单吗？', [
    { label: '再想想', type: 'btn-secondary' },
    { label: '确定取消', type: 'btn-danger', onClick: async () => {
      const result = await request(`/orders/${orderId}/cancel`, { method: 'POST' });
      if (result) {
        showToast('订单已取消');
        loadOrderDetail(orderId);
      }
    }}
  ]);
}

async function confirmDelivery(orderId) {
  showModal('确认收货', '请确认您已收到商品，确认后将进入验货环节。', [
    { label: '再想想', type: 'btn-secondary' },
    { label: '确认收货', type: 'btn-primary', onClick: async () => {
      const result = await request(`/orders/${orderId}/confirm-delivery`, { method: 'POST' });
      if (result) {
        showToast('已确认收货');
        loadOrderDetail(orderId);
      }
    }}
  ]);
}

function showInspectModal(orderId, passed) {
  const title = passed ? '验货通过' : '验货不通过';
  const content = passed ? 
    `<p>请确认商品与描述一致，确认通过后货款将打给卖家。</p>
     <div class="form-group">
       <label>验货备注</label>
       <textarea id="inspect-remark" placeholder="选填，请输入验货说明"></textarea>
     </div>` :
    `<p>请说明验货不通过的原因，货款将退回您的账户。</p>
     <div class="form-group">
       <label>不通过原因 *</label>
       <textarea id="inspect-remark" placeholder="请详细说明不通过的原因" required></textarea>
     </div>`;
  
  showModal(title, content, [
    { label: '取消', type: 'btn-secondary' },
    { label: passed ? '确认通过' : '确认不通过', type: passed ? 'btn-success' : 'btn-danger', onClick: async () => {
      const remark = document.getElementById('inspect-remark').value;
      if (!passed && !remark.trim()) {
        showToast('请填写不通过原因');
        return;
      }
      const result = await request(`/orders/${orderId}/inspect`, {
        method: 'POST',
        body: JSON.stringify({ passed, inspectionRemark: remark })
      });
      if (result) {
        closeModal();
        showToast(passed ? '验货通过' : '验货不通过，货款已退回');
        const user = getUser();
        if (user && !passed) {
          user.balance += result.price || 0;
          setUser(user);
        }
        loadOrderDetail(orderId);
      }
    }, close: false}
  ]);
}

async function completeOrder(orderId) {
  showModal('确认完成', '确认完成后，订单将正式结束。', [
    { label: '取消', type: 'btn-secondary' },
    { label: '确认完成', type: 'btn-primary', onClick: async () => {
      const result = await request(`/orders/${orderId}/complete`, { method: 'POST' });
      if (result) {
        showToast('订单已完成');
        loadOrderDetail(orderId);
      }
    }}
  ]);
}

function showShipModal(orderId) {
  showModal('商品发货', `
    <div class="form-group">
      <label>快递公司 *</label>
      <select id="ship-courier" required>
        <option value="顺丰速运">顺丰速运</option>
        <option value="圆通速递">圆通速递</option>
        <option value="中通快递">中通快递</option>
        <option value="申通快递">申通快递</option>
        <option value="韵达快递">韵达快递</option>
        <option value="京东物流">京东物流</option>
        <option value="其他">其他</option>
      </select>
    </div>
    <div class="form-group">
      <label>运单号 *</label>
      <input type="text" id="ship-tracking-no" placeholder="请输入运单号" required>
    </div>
  `, [
    { label: '取消', type: 'btn-secondary' },
    { label: '确认发货', type: 'btn-primary', onClick: async () => {
      const courier = document.getElementById('ship-courier').value;
      const trackingNo = document.getElementById('ship-tracking-no').value;
      if (!trackingNo.trim()) {
        showToast('请输入运单号');
        return;
      }
      const result = await request(`/orders/${orderId}/ship`, {
        method: 'POST',
        body: JSON.stringify({ courier, trackingNo })
      });
      if (result) {
        closeModal();
        showToast('发货成功');
        loadOrderDetail(orderId);
      }
    }, close: false}
  ]);
}

async function handleReturnSubmit(event) {
  event.preventDefault();
  const reason = document.getElementById('return-reason').value;
  const description = document.getElementById('return-description').value;
  
  if (!reason) {
    showToast('请选择退货原因');
    return;
  }
  
  const result = await request(`/returns/order/${currentOrderId}`, {
    method: 'POST',
    body: JSON.stringify({ reason, description })
  });
  
  if (result) {
    showToast('退货申请已提交');
    document.getElementById('return-form').reset();
    navigate('returns');
  }
}

async function loadReturns() {
  const returns = await request('/returns');
  const list = document.getElementById('return-list');
  
  if (!returns || returns.length === 0) {
    list.innerHTML = `
      <div class="empty-state">
        <div class="icon">↩️</div>
        <p>暂无退货记录</p>
        <button class="btn btn-primary" onclick="navigate('orders')">查看订单</button>
      </div>
    `;
    return;
  }
  
  list.innerHTML = returns.map(ret => `
    <div class="order-card" onclick="navigate('return-detail', ${ret.id})">
      <div class="order-header">
        <span class="order-no">退货单号：${ret.id} | 订单号：${ret.order?.orderNo}</span>
        <span class="order-status">${RETURN_STATUS_TEXT[ret.status] || ret.status}</span>
      </div>
      <div class="order-body">
        <img src="${ret.product?.images[0]}" alt="${ret.product?.title}">
        <div class="order-info">
          <div class="order-title">${ret.product?.title}</div>
          <div class="order-price">¥${ret.order?.price}</div>
          <div style="font-size:13px; color:#666; margin-top:4px;">原因：${ret.reason}</div>
        </div>
      </div>
    </div>
  `).join('');
}

async function loadReturnDetail(id) {
  const ret = await request(`/returns/${id}`);
  const container = document.getElementById('return-detail-content');
  
  if (!ret) {
    container.innerHTML = '<div class="empty-state"><p>退货申请不存在</p></div>';
    return;
  }
  
  const user = getUser();
  const order = ret.order;
  let isBuyer = false;
  let isSeller = false;
  
  const orderDetail = await request(`/orders/${order.id}`);
  if (orderDetail) {
    isBuyer = orderDetail.buyerId === user?.id;
    isSeller = orderDetail.sellerId === user?.id;
  }
  
  let actionsHtml = '';
  
  if (isSeller && ret.status === 'pending') {
    actionsHtml = `
      <button class="btn btn-secondary" onclick="showRejectReturnModal(${ret.id})">拒绝退货</button>
      <button class="btn btn-primary" onclick="approveReturn(${ret.id})">同意退货</button>
    `;
  }
  
  if (isBuyer && ret.status === 'approved') {
    actionsHtml = `
      <button class="btn btn-primary" onclick="showShipBackModal(${ret.id})">退回商品</button>
    `;
  }
  
  if (isSeller && ret.status === 'shipped_back') {
    actionsHtml = `
      <button class="btn btn-primary" onclick="confirmReturnReceipt(${ret.id})">确认签收退货</button>
    `;
  }
  
  if (isSeller && ret.status === 'delivered_back') {
    actionsHtml = `
      <button class="btn btn-primary" onclick="processRefund(${ret.id})">确认退款</button>
    `;
  }
  
  container.innerHTML = `
    <div class="order-card">
      <div class="order-header">
        <span class="order-no">退货单号：${ret.id} | 订单号：${order.orderNo}</span>
        <span class="order-status">${RETURN_STATUS_TEXT[ret.status] || ret.status}</span>
      </div>
      <div class="order-body" style="cursor:pointer;" onclick="navigate('order-detail', ${order.id})">
        <img src="${ret.product?.images[0]}" alt="${ret.product?.title}">
        <div class="order-info">
          <div class="order-title">${ret.product?.title}</div>
          <div class="order-price">¥${order.price}</div>
        </div>
      </div>
      <div style="padding:16px 20px; border-top:1px solid #eee;">
        <p style="font-size:14px; color:#666; margin-bottom:8px;">
          <strong>退货原因：</strong>${ret.reason}
        </p>
        ${ret.description ? `<p style="font-size:14px; color:#666; margin-bottom:8px;"><strong>详细说明：</strong>${ret.description}</p>` : ''}
        ${ret.sellerRemark ? `<p style="font-size:14px; color:#666;"><strong>卖家回复：</strong>${ret.sellerRemark}</p>` : ''}
        ${ret.returnCourier ? `<p style="font-size:14px; color:#666; margin-top:8px;"><strong>退回物流：</strong>${ret.returnCourier} - ${ret.returnTrackingNo || '暂无单号'}</p>` : ''}
      </div>
      ${actionsHtml ? `
        <div class="order-actions">${actionsHtml}</div>
      ` : ''}
    </div>
  `;
}

function showRejectReturnModal(returnId) {
  showModal('拒绝退货', `
    <div class="form-group">
      <label>拒绝原因 *</label>
      <textarea id="reject-reason" placeholder="请说明拒绝退货的原因" required></textarea>
    </div>
  `, [
    { label: '取消', type: 'btn-secondary' },
    { label: '确认拒绝', type: 'btn-danger', onClick: async () => {
      const reason = document.getElementById('reject-reason').value;
      if (!reason.trim()) {
        showToast('请填写拒绝原因');
        return;
      }
      const result = await request(`/returns/${returnId}/reject`, {
        method: 'POST',
        body: JSON.stringify({ reason })
      });
      if (result) {
        closeModal();
        showToast('已拒绝退货申请');
        loadReturnDetail(returnId);
      }
    }, close: false}
  ]);
}

async function approveReturn(returnId) {
  showModal('同意退货', '确认同意买家的退货申请？请确保您已了解退货地址等信息。', [
    { label: '取消', type: 'btn-secondary' },
    { label: '确认同意', type: 'btn-primary', onClick: async () => {
      const result = await request(`/returns/${returnId}/approve`, { method: 'POST' });
      if (result) {
        showToast('已同意退货申请');
        loadReturnDetail(returnId);
      }
    }}
  ]);
}

function showShipBackModal(returnId) {
  showModal('退回商品', `
    <div class="form-group">
      <label>退回快递公司 *</label>
      <select id="shipback-courier" required>
        <option value="顺丰速运">顺丰速运</option>
        <option value="圆通速递">圆通速递</option>
        <option value="中通快递">中通快递</option>
        <option value="申通快递">申通快递</option>
        <option value="韵达快递">韵达快递</option>
        <option value="其他">其他</option>
      </select>
    </div>
    <div class="form-group">
      <label>运单号 *</label>
      <input type="text" id="shipback-tracking-no" placeholder="请输入运单号" required>
    </div>
  `, [
    { label: '取消', type: 'btn-secondary' },
    { label: '确认发货', type: 'btn-primary', onClick: async () => {
      const courier = document.getElementById('shipback-courier').value;
      const trackingNo = document.getElementById('shipback-tracking-no').value;
      if (!trackingNo.trim()) {
        showToast('请输入运单号');
        return;
      }
      const result = await request(`/returns/${returnId}/ship-back`, {
        method: 'POST',
        body: JSON.stringify({ courier, trackingNo })
      });
      if (result) {
        closeModal();
        showToast('商品已退回');
        loadReturnDetail(returnId);
      }
    }, close: false}
  ]);
}

async function confirmReturnReceipt(returnId) {
  showModal('确认签收', '请确认您已收到买家退回的商品，确认后将进入退款环节。', [
    { label: '取消', type: 'btn-secondary' },
    { label: '确认签收', type: 'btn-primary', onClick: async () => {
      const result = await request(`/returns/${returnId}/confirm-receipt`, { method: 'POST' });
      if (result) {
        showToast('已确认签收退货');
        loadReturnDetail(returnId);
      }
    }}
  ]);
}

async function processRefund(returnId) {
  showModal('确认退款', '确认退款后，货款将退回买家账户，商品将重新上架。', [
    { label: '取消', type: 'btn-secondary' },
    { label: '确认退款', type: 'btn-primary', onClick: async () => {
      const result = await request(`/returns/${returnId}/refund`, { method: 'POST' });
      if (result) {
        showToast('退款成功');
        loadReturnDetail(returnId);
      }
    }}
  ]);
}

async function loadProfile() {
  const user = getUser();
  if (!user) return;
  
  document.getElementById('profile-avatar').src = user.avatar;
  document.getElementById('profile-nickname').textContent = user.nickname;
  document.getElementById('profile-balance').textContent = `¥${user.balance?.toFixed(2) || '0.00'}`;
  document.getElementById('profile-nickname-input').value = user.nickname || '';
  document.getElementById('profile-phone').value = user.phone || '';
  document.getElementById('profile-address').value = user.address || '';
  
  const myProducts = await request('/products/my');
  const grid = document.getElementById('my-products-grid');
  
  if (!myProducts || myProducts.length === 0) {
    grid.innerHTML = `
      <div class="empty-state" style="grid-column:1/-1;">
        <div class="icon">📦</div>
        <p>暂无发布的商品</p>
        <button class="btn btn-primary" onclick="navigate('publish')">去发布</button>
      </div>
    `;
    return;
  }
  
  const STATUS_TEXT = { on_sale: '出售中', sold: '已售出', off_shelf: '已下架' };
  
  grid.innerHTML = myProducts.map(product => `
    <div class="product-card" onclick="navigate('detail', ${product.id})">
      <img src="${product.images[0]}" alt="${product.title}" class="product-image">
      <div class="product-info">
        <div class="product-title">${product.title}</div>
        <div>
          <span class="product-price"><span class="yuan">¥</span>${product.price}</span>
        </div>
        <div class="product-meta">
          <span class="product-condition">${STATUS_TEXT[product.status] || product.status}</span>
          <span>${product.views || 0} 浏览</span>
        </div>
      </div>
    </div>
  `).join('');
}

async function handleProfileUpdate(event) {
  event.preventDefault();
  const nickname = document.getElementById('profile-nickname-input').value;
  const phone = document.getElementById('profile-phone').value;
  const address = document.getElementById('profile-address').value;
  
  const result = await request('/users/profile', {
    method: 'PUT',
    body: JSON.stringify({ nickname, phone, address })
  });
  
  if (result) {
    setUser(result);
    updateNav();
    showToast('保存成功');
    loadProfile();
  }
}

async function initSampleData() {
  const products = await request('/products?page=1&limit=1');
  if (products && products.total === 0) {
    const sampleUsers = [
      { username: 'seller1', password: '123456', nickname: '二手卖家小王', phone: '13800138001' },
      { username: 'seller2', password: '123456', nickname: '闲置达人小李', phone: '13800138002' },
      { username: 'buyer1', password: '123456', nickname: '淘宝达人小张', phone: '13800138003' }
    ];
    
    for (const u of sampleUsers) {
      await fetch(`${API_BASE}/users/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(u)
      });
    }
    
    const loginRes = await fetch(`${API_BASE}/users/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'seller1', password: '123456' })
    });
    const loginData = await loginRes.json();
    
    const sampleProducts = [
      { title: 'iPhone 13 Pro 256G 远峰蓝色 九成新', category: '数码产品', price: 5299, originalPrice: 8999, condition: '九成新', description: '自用iPhone 13 Pro，256GB，远峰蓝色。使用约一年半，外观完好无磕碰，屏幕无划痕，电池健康度89%。配件齐全，原装充电器、数据线、耳机都在。因换新机出售，非诚勿扰。' },
      { title: 'MacBook Air M1 8+256 银色 近全新', category: '数码产品', price: 5899, originalPrice: 7999, condition: '全新', description: '2022年购入的MacBook Air M1芯片版本，8G内存+256G存储，银色。几乎没怎么用过，外观完美，电池循环次数仅32次。包装盒和原装充电器都在，适合学生党和办公族。' },
      { title: '索尼WH-1000XM4 无线降噪耳机', category: '数码产品', price: 1299, originalPrice: 2899, condition: '八成新', description: '索尼顶级降噪耳机，降噪效果一流，音质出色。使用约一年，耳罩有轻微使用痕迹，功能一切正常。适合通勤、办公、出差使用。' },
      { title: '小米空气净化器Pro H 除甲醛PM2.5', category: '家居生活', price: 1099, originalPrice: 1699, condition: '九成新', description: '小米空气净化器Pro H，CADR值760m³/h，除甲醛除PM2.5效果很好。去年冬天买的，滤芯还有约70%寿命。搬家了带不走，低价出。' },
      { title: '宜家BILLY毕利书架 白色 八成新', category: '家居生活', price: 299, originalPrice: 599, condition: '八成新', description: '宜家经典款毕利书架，白色，80x28x202cm。使用两年，功能完好，有轻微使用痕迹。需要自行拆卸搬运，限同城自提。' },
      { title: '优衣库男士羽绒服 L码 藏蓝色', category: '服装鞋帽', price: 299, originalPrice: 799, condition: '九成新', description: '优衣库无缝羽绒服，男士L码，藏蓝色。去年冬天买的，只穿了几次，几乎全新。保暖效果很好，现在胖了穿不下了。' },
      { title: 'Nike Air Jordan 1 Mid 篮球鞋 42码', category: '服装鞋帽', price: 699, originalPrice: 999, condition: '七成新', description: 'AJ1中帮，黑红配色，42码。穿过一段时间，鞋底有磨损，鞋面还不错。正品支持鉴定，盒子在。' },
      { title: '《三体》全集套装 刘慈欣著 科幻小说', category: '图书文具', price: 69, originalPrice: 168, condition: '九成新', description: '《三体》三部曲全集，刘慈欣经典科幻巨著。书是正版，看过一遍，保存完好，无笔记无划线。科幻迷必入！' },
      { title: 'Kindle Paperwhite 电子书阅读器 10代', category: '数码产品', price: 499, originalPrice: 998, condition: '九成新', description: 'Kindle Paperwhite第10代，8G版，防水设计。用了不到一年，屏幕完好，边框轻微痕迹。爱看书的朋友不要错过，送原装皮套。' },
      { title: '迪卡侬山地自行车 27.5寸 21速', category: '运动户外', price: 599, originalPrice: 1299, condition: '七成新', description: '迪卡侬入门款山地车，27.5寸轮径，21速变速。骑了大半年，变速刹车都正常。上下班通勤或者周末骑行都不错，限同城自提。' },
      { title: '雅诗兰黛小棕瓶精华 50ml 全新未拆封', category: '美妆护肤', price: 499, originalPrice: 890, condition: '全新', description: '雅诗兰黛小棕瓶精华50ml，全新未拆封，保质期到2026年。朋友送的用不完，专柜正品，支持验货。护肤品界的常青树，抗老修护效果一流。' },
      { title: '费雪儿童早教音乐玩具 0-3岁', category: '母婴用品', price: 89, originalPrice: 259, condition: '九成新', description: '费雪经典款早教音乐玩具，适合0-3岁宝宝。音乐、灯光、多种玩法，宝宝很喜欢。现在长大了用不上了，干净无破损。' }
    ];
    
    for (let i = 0; i < sampleProducts.length; i++) {
      const p = sampleProducts[i];
      await fetch(`${API_BASE}/products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${loginData.token}`
        },
        body: JSON.stringify({
          ...p,
          images: [
            `https://picsum.photos/seed/product${i}a/400/400`,
            `https://picsum.photos/seed/product${i}b/400/400`,
            `https://picsum.photos/seed/product${i}c/400/400`
          ]
        })
      });
    }
  }
}

async function init() {
  updateNav();
  loadCategories();
  await initSampleData();
  loadProducts();
}

init();
