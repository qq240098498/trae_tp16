import type { User, Product, Order, Logistics, ReturnRecord, Favorite } from '@/types';

const API_BASE = '/api';

function getToken(): string | null {
  return localStorage.getItem('token');
}

function setToken(token: string) {
  localStorage.setItem('token', token);
}

function clearToken() {
  localStorage.removeItem('token');
}

async function request<T>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  const token = getToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers,
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.error || `请求失败: ${res.status}`);
  }

  return data as T;
}

export const api = {
  // 用户
  register: (data: { username: string; password: string; nickname?: string; phone?: string }) =>
    request<{ token: string; user: User }>('/users/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  login: (data: { username: string; password: string }) =>
    request<{ token: string; user: User }>('/users/login', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getProfile: () => request<User>('/users/profile'),
  updateProfile: (data: Partial<Pick<User, 'nickname' | 'phone' | 'address'>>) =>
    request<User>('/users/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  // 商品
  getCategories: () => request<string[]>('/products/categories'),
  getProducts: (params?: Record<string, any>) => {
    const qs = params
      ? '?' + new URLSearchParams(
          Object.entries(params).filter(([, v]) => v !== undefined && v !== '').map(([k, v]) => [k, String(v)])
        ).toString()
      : '';
    return request<{ total: number; page: number; limit: number; list: Product[] }>(`/products${qs}`);
  },
  getMyProducts: () => request<Product[]>('/products/my'),
  getProduct: (id: number) => request<Product>(`/products/${id}`),
  createProduct: (data: Partial<Product>) =>
    request<Product>('/products', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateProduct: (id: number, data: Partial<Product>) =>
    request<Product>(`/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteProduct: (id: number) =>
    request<{ message: string }>(`/products/${id}`, { method: 'DELETE' }),

  // 订单
  getOrders: (params?: { status?: string; role?: 'buyer' | 'seller' }) => {
    const qs = params
      ? '?' + new URLSearchParams(params as any).toString()
      : '';
    return request<Order[]>(`/orders${qs}`);
  },
  getOrder: (id: number) => request<Order>(`/orders/${id}`),
  createOrder: (data: { productId: number; address: string; phone: string; buyerRemark?: string }) =>
    request<Order>('/orders', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  payOrder: (id: number) =>
    request<Order>(`/orders/${id}/pay`, { method: 'POST' }),
  shipOrder: (id: number, data: { trackingNo?: string; courier?: string }) =>
    request<Order>(`/orders/${id}/ship`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  confirmDelivery: (id: number) =>
    request<Order>(`/orders/${id}/confirm-delivery`, { method: 'POST' }),
  inspectOrder: (id: number, data: { passed: boolean; inspectionResult?: string; inspectionRemark?: string }) =>
    request<Order>(`/orders/${id}/inspect`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  completeOrder: (id: number) =>
    request<Order>(`/orders/${id}/complete`, { method: 'POST' }),
  cancelOrder: (id: number) =>
    request<Order>(`/orders/${id}/cancel`, { method: 'POST' }),

  // 物流
  getLogistics: (orderId: number) =>
    request<Logistics>(`/logistics/order/${orderId}`),

  // 退货
  getReturns: (params?: { status?: string; role?: 'buyer' | 'seller' }) => {
    const qs = params
      ? '?' + new URLSearchParams(params as any).toString()
      : '';
    return request<ReturnRecord[]>(`/returns${qs}`);
  },
  getReturn: (id: number) => request<ReturnRecord>(`/returns/${id}`),
  createReturn: (orderId: number, data: { reason: string; description?: string }) =>
    request<ReturnRecord>(`/returns/order/${orderId}`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  approveReturn: (id: number, data?: { remark?: string }) =>
    request<ReturnRecord>(`/returns/${id}/approve`, {
      method: 'POST',
      body: JSON.stringify(data || {}),
    }),
  rejectReturn: (id: number, data: { reason: string }) =>
    request<ReturnRecord>(`/returns/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  shipBackReturn: (id: number, data: { trackingNo?: string; courier?: string }) =>
    request<ReturnRecord>(`/returns/${id}/ship-back`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  confirmReturnReceipt: (id: number) =>
    request<ReturnRecord>(`/returns/${id}/confirm-receipt`, { method: 'POST' }),
  refundReturn: (id: number) =>
    request<{ message: string; order: Order }>(`/returns/${id}/refund`, { method: 'POST' }),

  // 收藏
  getFavorites: () => request<Favorite[]>('/favorites'),
  addFavorite: (productId: number) =>
    request<{ message: string; favorite: Favorite }>(`/favorites/${productId}`, { method: 'POST' }),
  removeFavorite: (productId: number) =>
    request<{ message: string }>(`/favorites/${productId}`, { method: 'DELETE' }),

  setToken,
  clearToken,
  getToken,
};
