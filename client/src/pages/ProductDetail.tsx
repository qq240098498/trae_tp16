import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Heart, MessageCircle, Shield, Truck, Eye, ShoppingCart } from 'lucide-react';
import { api } from '@/lib/api';
import { toast, Modal, Button } from '@/components/UI';
import { useAuthStore } from '@/store/useAuthStore';
import { formatDate } from '@/lib/utils';
import type { Product } from '@/types';

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, token } = useAuthStore();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentImage, setCurrentImage] = useState(0);
  const [isFavorited, setIsFavorited] = useState(false);
  const [favoritesLoading, setFavoritesLoading] = useState(false);
  const [showBuy, setShowBuy] = useState(false);
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [buyerRemark, setBuyerRemark] = useState('');
  const [buying, setBuying] = useState(false);

  useEffect(() => {
    if (!id) return;
    loadProduct();
    if (token) {
      checkFavorite();
    }
  }, [id, token]);

  const loadProduct = async () => {
    setLoading(true);
    try {
      const data = await api.getProduct(Number(id));
      setProduct(data);
    } catch (e: any) {
      toast(e.message || '加载失败', 'error');
    } finally {
      setLoading(false);
    }
  };

  const checkFavorite = async () => {
    try {
      const favs = await api.getFavorites();
      setIsFavorited(favs.some(f => f.productId === Number(id)));
    } catch {
      /* ignore */
    }
  };

  const toggleFavorite = async () => {
    if (!token) {
      toast('请先登录', 'error');
      navigate('/login');
      return;
    }
    setFavoritesLoading(true);
    try {
      if (isFavorited) {
        await api.removeFavorite(Number(id));
        setIsFavorited(false);
        toast('已取消收藏', 'success');
      } else {
        await api.addFavorite(Number(id));
        setIsFavorited(true);
        toast('收藏成功', 'success');
      }
    } catch (e: any) {
      toast(e.message || '操作失败', 'error');
    } finally {
      setFavoritesLoading(false);
    }
  };

  const handleBuy = async () => {
    if (!token) {
      navigate('/login');
      return;
    }
    if (product?.sellerId === user?.id) {
      toast('不能购买自己的商品', 'error');
      return;
    }
    setShowBuy(true);
  };

  const submitOrder = async () => {
    if (!address || !phone) {
      toast('请填写收货地址和联系电话', 'error');
      return;
    }
    setBuying(true);
    try {
      const order = await api.createOrder({
        productId: Number(id),
        address,
        phone,
        buyerRemark,
      });
      toast('订单创建成功，前往支付', 'success');
      setShowBuy(false);
      navigate(`/orders/${order.id}`);
    } catch (e: any) {
      toast(e.message || '下单失败', 'error');
    } finally {
      setBuying(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-4">
        <div className="animate-pulse space-y-4">
          <div className="aspect-square sm:aspect-[4/3] bg-gray-100 rounded-2xl" />
          <div className="h-6 bg-gray-100 rounded w-2/3" />
          <div className="h-8 bg-gray-100 rounded w-1/3" />
          <div className="h-24 bg-gray-100 rounded" />
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center text-gray-400">
        <p>商品不存在或已下架</p>
        <Link to="/" className="text-orange-500 hover:underline text-sm">返回首页</Link>
      </div>
    );
  }

  const isOwner = product.sellerId === user?.id;
  const isSold = product.status !== 'on_sale';

  return (
    <div className="max-w-4xl mx-auto pb-24 sm:pb-8">
      <div className="sticky top-0 z-30 bg-white/80 backdrop-blur border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 h-12 flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-gray-600 hover:text-gray-900">
            <ArrowLeft size={20} />
            <span className="text-sm">返回</span>
          </button>
          <button onClick={toggleFavorite} disabled={favoritesLoading} className="text-gray-500">
            <Heart size={22} className={isFavorited ? 'fill-red-500 stroke-red-500' : ''} />
          </button>
        </div>
      </div>

      <div className="sm:flex sm:gap-6 p-4">
        <div className="sm:w-1/2">
          <div className="aspect-square bg-gray-100 rounded-2xl overflow-hidden mb-2">
            <img src={product.images?.[currentImage]} alt="" className="w-full h-full object-cover" />
          </div>
          {product.images?.length > 1 && (
            <div className="flex gap-2 overflow-x-auto">
              {product.images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentImage(i)}
                  className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 ${
                    i === currentImage ? 'border-orange-500' : 'border-transparent'
                  }`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="sm:w-1/2 mt-4 sm:mt-0">
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-3xl font-bold text-orange-500">¥{product.price}</span>
            {product.originalPrice > product.price && (
              <span className="text-gray-400 line-through text-sm">¥{product.originalPrice}</span>
            )}
          </div>
          <h1 className="text-lg font-semibold text-gray-900 leading-snug mb-3">{product.title}</h1>

          <div className="flex flex-wrap gap-2 mb-4">
            {product.condition && (
              <span className="px-2.5 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">{product.condition}</span>
            )}
            {product.category && (
              <span className="px-2.5 py-1 bg-orange-50 text-orange-500 text-xs rounded-full">{product.category}</span>
            )}
            <span className="px-2.5 py-1 bg-gray-100 text-gray-500 text-xs rounded-full flex items-center gap-1">
              <Eye size={12} /> {product.views || 0} 浏览
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 mb-5 text-center">
            <div className="py-3 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl">
              <Shield className="mx-auto text-green-500 mb-1" size={20} />
              <p className="text-xs text-gray-600">验货担保</p>
            </div>
            <div className="py-3 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl">
              <Truck className="mx-auto text-blue-500 mb-1" size={20} />
              <p className="text-xs text-gray-600">物流追踪</p>
            </div>
            <div className="py-3 bg-gradient-to-br from-orange-50 to-pink-50 rounded-xl">
              <MessageCircle className="mx-auto text-orange-500 mb-1" size={20} />
              <p className="text-xs text-gray-600">售后保障</p>
            </div>
          </div>

          {product.seller && (
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl mb-5">
              <img src={product.seller.avatar} alt="" className="w-10 h-10 rounded-full bg-white" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">{product.seller.nickname}</p>
                <p className="text-xs text-gray-400">卖家</p>
              </div>
            </div>
          )}

          <div className="bg-gray-50 rounded-xl p-4 mb-5">
            <p className="text-sm font-medium text-gray-700 mb-2">商品描述</p>
            <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
              {product.description || '卖家暂未填写描述'}
            </p>
          </div>

          <p className="text-xs text-gray-400">发布于 {formatDate(product.createdAt)}</p>
        </div>
      </div>

      <div className="fixed bottom-16 sm:bottom-0 left-0 right-0 sm:sticky sm:top-[5.5rem] bg-white border-t border-gray-100 sm:rounded-t-2xl sm:border sm:shadow-lg sm:mx-4 sm:mt-4 z-30">
        <div className="max-w-4xl mx-auto px-4 py-3 flex gap-3">
          <button
            onClick={toggleFavorite}
            disabled={favoritesLoading}
            className="flex flex-col items-center justify-center w-14 text-xs text-gray-500"
          >
            <Heart size={22} className={isFavorited ? 'fill-red-500 stroke-red-500' : ''} />
            <span>{isFavorited ? '已收藏' : '收藏'}</span>
          </button>
          {isOwner ? (
            <Link
              to={`/publish?edit=${product.id}`}
              className="flex-1 h-11 rounded-full bg-gray-200 text-gray-700 font-medium text-sm flex items-center justify-center"
            >
              这是你的商品，点击编辑
            </Link>
          ) : isSold ? (
            <div className="flex-1 h-11 rounded-full bg-gray-200 text-gray-500 font-medium text-sm flex items-center justify-center">
              {product.status === 'sold' ? '商品已售出' : '商品已下架'}
            </div>
          ) : (
            <button
              onClick={handleBuy}
              className="flex-1 h-11 rounded-full bg-gradient-to-r from-orange-500 to-pink-500 text-white font-medium text-sm flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition"
            >
              <ShoppingCart size={18} />
              立即购买
            </button>
          )}
        </div>
      </div>

      <Modal open={showBuy} onClose={() => setShowBuy(false)} title="确认下单">
        <div className="space-y-4">
          <div className="flex gap-3 p-3 bg-gray-50 rounded-xl">
            <img src={product.images?.[0]} alt="" className="w-16 h-16 rounded-lg object-cover" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-800 line-clamp-2">{product.title}</p>
              <p className="text-orange-500 font-bold mt-1">¥{product.price}</p>
            </div>
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1.5">收货地址</label>
            <input
              value={address}
              onChange={e => setAddress(e.target.value)}
              placeholder="请输入详细收货地址"
              className="w-full h-10 px-3 rounded-lg bg-gray-50 border border-gray-200 text-sm outline-none focus:border-orange-400"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1.5">联系电话</label>
            <input
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="请输入联系电话"
              className="w-full h-10 px-3 rounded-lg bg-gray-50 border border-gray-200 text-sm outline-none focus:border-orange-400"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1.5">买家留言（可选）</label>
            <textarea
              value={buyerRemark}
              onChange={e => setBuyerRemark(e.target.value)}
              placeholder="有什么想对卖家说的..."
              rows={3}
              className="w-full px-3 py-2 rounded-lg bg-gray-50 border border-gray-200 text-sm outline-none focus:border-orange-400 resize-none"
            />
          </div>
          {user && (
            <p className="text-xs text-gray-400">当前余额：<span className="text-orange-500 font-medium">¥{user.balance}</span></p>
          )}
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" className="flex-1" onClick={() => setShowBuy(false)}>取消</Button>
            <Button className="flex-1" onClick={submitOrder} disabled={buying}>
              {buying ? '下单中...' : '确认下单'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
