import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  User, Settings, Heart, Package, ShoppingBag, PlusSquare,
  Wallet, Edit3, ChevronRight, LogOut, AlertCircle
} from 'lucide-react';
import { api } from '@/lib/api';
import { toast, Modal, Button } from '@/components/UI';
import { useAuthStore } from '@/store/useAuthStore';
import ProductCard from '@/components/ProductCard';
import type { Product, Order } from '@/types';

export default function Profile() {
  const navigate = useNavigate();
  const { user, token, logout, updateProfile } = useAuthStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEdit, setShowEdit] = useState(false);
  const [nickname, setNickname] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!token) {
      toast('请先登录', 'error');
      navigate('/login');
      return;
    }
    loadData();
  }, [token]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [myProducts, myOrders] = await Promise.all([
        api.getMyProducts(),
        api.getOrders(),
      ]);
      setProducts(myProducts);
      setOrders(myOrders);
    } catch (e: any) {
      toast(e.message || '加载失败', 'error');
    } finally {
      setLoading(false);
    }
  };

  const openEdit = () => {
    if (!user) return;
    setNickname(user.nickname);
    setPhone(user.phone);
    setAddress(user.address);
    setShowEdit(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateProfile({ nickname, phone, address });
      toast('保存成功', 'success');
      setShowEdit(false);
    } catch (e: any) {
      toast(e.message || '保存失败', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('确定要删除此商品吗？')) return;
    try {
      await api.deleteProduct(id);
      toast('删除成功', 'success');
      loadData();
    } catch (e: any) {
      toast(e.message || '删除失败', 'error');
    }
  };

  const handleLogout = () => {
    if (!confirm('确定要退出登录吗？')) return;
    logout();
    toast('已退出登录', 'success');
    navigate('/');
  };

  if (!user) return null;

  const stats = {
    onSale: products.filter(p => p.status === 'on_sale').length,
    sold: products.filter(p => p.status === 'sold').length,
    buying: orders.filter(o => o.buyerId === user.id && !['completed', 'cancelled', 'returned'].includes(o.status)).length,
    selling: orders.filter(o => o.sellerId === user.id && !['completed', 'cancelled', 'returned'].includes(o.status)).length,
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-4 pb-24 sm:pb-8">
      <div className="bg-gradient-to-br from-orange-500 via-pink-500 to-yellow-500 rounded-3xl p-6 text-white mb-5 shadow-lg">
        <div className="flex items-center gap-4">
          <img src={user.avatar} alt="" className="w-16 h-16 rounded-2xl bg-white/20 ring-4 ring-white/30" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold truncate">{user.nickname}</h2>
              <button onClick={openEdit} className="p-1 rounded-lg hover:bg-white/20 transition">
                <Edit3 size={16} />
              </button>
            </div>
            <p className="text-sm text-white/80 mt-0.5">@{user.username}</p>
            <div className="flex items-center gap-4 mt-2">
              <div className="flex items-center gap-1">
                <Wallet size={14} />
                <span className="font-semibold">¥{user.balance.toFixed(2)}</span>
              </div>
              {user.phone && (
                <span className="text-sm text-white/80">{user.phone}</span>
              )}
            </div>
          </div>
          <button onClick={handleLogout} className="p-2 rounded-xl hover:bg-white/20 transition" title="退出登录">
            <LogOut size={20} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2 mb-5">
        <Link to="/orders?role=buyer" className="bg-white rounded-2xl p-4 border border-gray-100 text-center hover:shadow-md transition">
          <ShoppingBag className="mx-auto text-blue-500 mb-1" size={22} />
          <p className="text-xl font-bold text-gray-800">{stats.buying}</p>
          <p className="text-xs text-gray-500">买入中</p>
        </Link>
        <Link to="/orders?role=seller" className="bg-white rounded-2xl p-4 border border-gray-100 text-center hover:shadow-md transition">
          <Package className="mx-auto text-green-500 mb-1" size={22} />
          <p className="text-xl font-bold text-gray-800">{stats.selling}</p>
          <p className="text-xs text-gray-500">卖出中</p>
        </Link>
        <Link to="/favorites" className="bg-white rounded-2xl p-4 border border-gray-100 text-center hover:shadow-md transition">
          <Heart className="mx-auto text-red-500 mb-1" size={22} />
          <p className="text-xl font-bold text-gray-800">-</p>
          <p className="text-xs text-gray-500">我的收藏</p>
        </Link>
        <Link to="/publish" className="bg-white rounded-2xl p-4 border border-gray-100 text-center hover:shadow-md transition">
          <PlusSquare className="mx-auto text-orange-500 mb-1" size={22} />
          <p className="text-xl font-bold text-gray-800">+</p>
          <p className="text-xs text-gray-500">发布商品</p>
        </Link>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 mb-5 overflow-hidden">
        <Link to="/orders" className="flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 transition">
          <Package className="text-gray-400" size={20} />
          <span className="flex-1 text-sm text-gray-700">全部订单</span>
          <ChevronRight className="text-gray-300" size={18} />
        </Link>
        <div className="h-px bg-gray-50" />
        <Link to="/favorites" className="flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 transition">
          <Heart className="text-gray-400" size={20} />
          <span className="flex-1 text-sm text-gray-700">我的收藏</span>
          <ChevronRight className="text-gray-300" size={18} />
        </Link>
        <div className="h-px bg-gray-50" />
        <button onClick={openEdit} className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 transition">
          <Settings className="text-gray-400" size={20} />
          <span className="flex-1 text-sm text-gray-700 text-left">个人设置</span>
          <ChevronRight className="text-gray-300" size={18} />
        </button>
      </div>

      <div className="flex items-center justify-between mb-3 px-1">
        <h3 className="font-semibold text-gray-800">我的商品</h3>
        <Link to="/publish" className="text-sm text-orange-500 hover:underline">+ 发布新商品</Link>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl overflow-hidden border border-gray-100 animate-pulse">
              <div className="aspect-square bg-gray-100" />
              <div className="p-3 space-y-2">
                <div className="h-3 bg-gray-100 rounded" />
                <div className="h-4 bg-gray-100 rounded w-2/3" />
              </div>
            </div>
          ))}
        </div>
      ) : products.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {products.map(p => (
            <div key={p.id} className="relative group">
              <ProductCard product={p} />
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition flex flex-col gap-1">
                <Link
                  to={`/publish?edit=${p.id}`}
                  className="w-7 h-7 rounded-full bg-white/90 hover:bg-white text-gray-600 flex items-center justify-center shadow"
                  title="编辑"
                >
                  <Edit3 size={14} />
                </Link>
                <button
                  onClick={() => handleDelete(p.id)}
                  className="w-7 h-7 rounded-full bg-white/90 hover:bg-red-500 hover:text-white text-gray-600 flex items-center justify-center shadow"
                  title="删除"
                >
                  <AlertCircle size={14} />
                </button>
              </div>
              {p.status !== 'on_sale' && (
                <div className="absolute top-2 left-2 bg-black/70 text-white text-xs px-2 py-0.5 rounded-full">
                  {p.status === 'sold' ? '已售出' : '已下架'}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-gray-400 bg-white rounded-2xl border border-gray-100">
          <User className="mx-auto mb-2 text-gray-300" size={40} />
          <p className="text-sm">还没有发布任何商品</p>
          <Link to="/publish" className="inline-block mt-3 text-sm text-orange-500 hover:underline">
            去发布我的第一件商品 →
          </Link>
        </div>
      )}

      <Modal open={showEdit} onClose={() => setShowEdit(false)} title="编辑个人资料">
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1.5">昵称</label>
            <input
              value={nickname}
              onChange={e => setNickname(e.target.value)}
              className="w-full h-10 px-3 rounded-lg bg-gray-50 border border-gray-200 text-sm outline-none focus:border-orange-400"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1.5">手机号</label>
            <input
              value={phone}
              onChange={e => setPhone(e.target.value)}
              className="w-full h-10 px-3 rounded-lg bg-gray-50 border border-gray-200 text-sm outline-none focus:border-orange-400"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1.5">默认收货地址</label>
            <textarea
              value={address}
              onChange={e => setAddress(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 rounded-lg bg-gray-50 border border-gray-200 text-sm outline-none focus:border-orange-400 resize-none"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" className="flex-1" onClick={() => setShowEdit(false)}>取消</Button>
            <Button className="flex-1" onClick={handleSave} disabled={saving}>
              {saving ? '保存中...' : '保存'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
