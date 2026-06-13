import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Package } from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from '@/components/UI';
import { useAuthStore } from '@/store/useAuthStore';
import { ORDER_STATUS_MAP, formatDate } from '@/lib/utils';
import type { Order } from '@/types';

const TABS = [
  { key: '', label: '全部' },
  { key: 'buyer', label: '我买的' },
  { key: 'seller', label: '我卖的' },
];

export default function Orders() {
  const navigate = useNavigate();
  const { token } = useAuthStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<string>('');

  useEffect(() => {
    if (!token) {
      toast('请先登录', 'error');
      navigate('/login');
      return;
    }
    loadOrders();
  }, [token, role]);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const data = await api.getOrders(role ? { role: role as any } : undefined);
      setOrders(data);
    } catch (e: any) {
      toast(e.message || '加载失败', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-4 pb-24 sm:pb-8">
      <div className="sticky top-0 z-30 bg-white/80 backdrop-blur border-b border-gray-100 -mx-4 px-4 py-3 mb-4">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="text-gray-600 hover:text-gray-900">
            <ArrowLeft size={20} />
          </button>
          <h1 className="font-semibold text-gray-900">我的订单</h1>
        </div>
      </div>

      <div className="flex gap-2 mb-4 bg-gray-100 p-1 rounded-xl">
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setRole(tab.key)}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition ${
              role === tab.key ? 'bg-white text-orange-500 shadow-sm' : 'text-gray-500'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl p-4 border border-gray-100 animate-pulse">
              <div className="h-4 bg-gray-100 rounded w-1/3 mb-3" />
              <div className="flex gap-3">
                <div className="w-20 h-20 bg-gray-100 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-100 rounded w-4/5" />
                  <div className="h-4 bg-gray-100 rounded w-1/3" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : orders.length > 0 ? (
        <div className="space-y-3">
          {orders.map(order => {
            const status = ORDER_STATUS_MAP[order.status];
            return (
              <Link
                key={order.id}
                to={`/orders/${order.id}`}
                className="block bg-white rounded-2xl p-4 border border-gray-100 hover:shadow-md transition"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs text-gray-400">订单号：{order.orderNo}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${status.color}`}>
                    {status.label}
                  </span>
                </div>
                {order.product && (
                  <div className="flex gap-3">
                    <div className="w-20 h-20 flex-shrink-0 bg-gray-50 rounded-lg overflow-hidden">
                      <img src={order.product.images?.[0]} alt="" className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-800 line-clamp-2 leading-snug">{order.product.title}</p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-orange-500 font-bold">¥{order.price}</span>
                        <span className="text-xs text-gray-400">{formatDate(order.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-20 text-gray-400">
          <Package className="mx-auto mb-3" size={48} />
          <p>暂无订单</p>
          <Link to="/" className="text-orange-500 hover:underline text-sm inline-block mt-2">去逛逛</Link>
        </div>
      )}
    </div>
  );
}
