import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Heart, Trash2 } from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from '@/components/UI';
import { useAuthStore } from '@/store/useAuthStore';
import type { Favorite } from '@/types';

export default function Favorites() {
  const navigate = useNavigate();
  const { token } = useAuthStore();
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      toast('请先登录', 'error');
      navigate('/login');
      return;
    }
    loadFavorites();
  }, [token]);

  const loadFavorites = async () => {
    setLoading(true);
    try {
      const data = await api.getFavorites();
      setFavorites(data);
    } catch (e: any) {
      toast(e.message || '加载失败', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (productId: number) => {
    try {
      await api.removeFavorite(productId);
      toast('已取消收藏', 'success');
      setFavorites(favorites.filter(f => f.productId !== productId));
    } catch (e: any) {
      toast(e.message || '操作失败', 'error');
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-4 pb-24 sm:pb-8">
      <div className="sticky top-0 z-30 bg-white/80 backdrop-blur border-b border-gray-100 -mx-4 px-4 py-3 mb-4">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="text-gray-600 hover:text-gray-900">
            <ArrowLeft size={20} />
          </button>
          <h1 className="font-semibold text-gray-900">我的收藏</h1>
          <span className="text-sm text-gray-400">({favorites.length})</span>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl overflow-hidden border border-gray-100 animate-pulse">
              <div className="aspect-square bg-gray-100" />
              <div className="p-3 space-y-2">
                <div className="h-3 bg-gray-100 rounded" />
                <div className="h-4 bg-gray-100 rounded w-2/3" />
              </div>
            </div>
          ))}
        </div>
      ) : favorites.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
          {favorites.map(fav => fav.product && (
            <div key={fav.id} className="relative group">
              <Link
                to={`/product/${fav.productId}`}
                className="block bg-white rounded-2xl overflow-hidden border border-gray-100 hover:shadow-lg hover:-translate-y-0.5 transition-all"
              >
                <div className="aspect-square bg-gray-50 overflow-hidden">
                  <img
                    src={fav.product.images?.[0]}
                    alt=""
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <div className="p-3">
                  <h3 className="text-sm font-medium text-gray-800 line-clamp-2 leading-snug min-h-[2.5rem]">
                    {fav.product.title}
                  </h3>
                  <div className="mt-2 flex items-baseline gap-1">
                    <span className="text-orange-500 font-bold text-lg">¥{fav.product.price}</span>
                    {fav.product.originalPrice > fav.product.price && (
                      <span className="text-gray-400 text-xs line-through">¥{fav.product.originalPrice}</span>
                    )}
                  </div>
                </div>
              </Link>
              <button
                onClick={(e) => { e.preventDefault(); handleRemove(fav.productId); }}
                className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/90 hover:bg-red-500 hover:text-white text-gray-500 flex items-center justify-center shadow opacity-80 group-hover:opacity-100 transition"
                title="取消收藏"
              >
                <Heart size={16} className="fill-red-500 stroke-red-500" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 text-gray-400">
          <Heart className="mx-auto mb-3 text-gray-300" size={48} />
          <p>还没有收藏任何商品</p>
          <Link to="/" className="text-orange-500 hover:underline text-sm inline-block mt-2">去逛逛 →</Link>
        </div>
      )}
    </div>
  );
}
