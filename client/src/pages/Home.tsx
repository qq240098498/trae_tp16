import { useEffect, useState } from 'react';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from '@/components/UI';
import ProductCard from '@/components/ProductCard';
import type { Product } from '@/types';

export default function Home() {
  const [categories, setCategories] = useState<string[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [category, setCategory] = useState<string>('');
  const [keyword, setKeyword] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [showFilter, setShowFilter] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    api.getCategories().then(setCategories).catch(() => {});
  }, []);

  useEffect(() => {
    loadProducts();
  }, [category, keyword, minPrice, maxPrice, page]);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const res = await api.getProducts({
        category,
        keyword,
        minPrice: minPrice || undefined,
        maxPrice: maxPrice || undefined,
        page,
        limit: 20,
      });
      setProducts(res.list);
      setTotal(res.total);
    } catch (e: any) {
      toast(e.message || '加载失败', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setKeyword(searchInput.trim());
    setPage(1);
  };

  const handleReset = () => {
    setCategory('');
    setKeyword('');
    setSearchInput('');
    setMinPrice('');
    setMaxPrice('');
    setPage(1);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-4 pb-24 sm:pb-8">
      <div className="flex gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            placeholder="搜索二手好物..."
            className="w-full h-10 pl-10 pr-4 rounded-full bg-gray-100 border-none focus:ring-2 focus:ring-orange-300 outline-none text-sm"
          />
        </div>
        <button
          onClick={handleSearch}
          className="px-5 h-10 bg-orange-500 hover:bg-orange-600 text-white rounded-full text-sm font-medium"
        >
          搜索
        </button>
        <button
          onClick={() => setShowFilter(!showFilter)}
          className={`px-3 h-10 rounded-full text-sm font-medium border ${
            showFilter ? 'bg-orange-50 border-orange-300 text-orange-500' : 'bg-white border-gray-200 text-gray-600'
          }`}
        >
          <SlidersHorizontal size={18} />
        </button>
      </div>

      {showFilter && (
        <div className="mb-4 p-4 bg-gray-50 rounded-2xl">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-700">价格区间</span>
            <button onClick={() => setShowFilter(false)} className="text-gray-400"><X size={16} /></button>
          </div>
          <div className="flex items-center gap-2 mb-4">
            <input
              type="number"
              value={minPrice}
              onChange={e => setMinPrice(e.target.value)}
              placeholder="最低"
              className="flex-1 h-9 px-3 rounded-lg bg-white border border-gray-200 text-sm outline-none focus:border-orange-400"
            />
            <span className="text-gray-400">-</span>
            <input
              type="number"
              value={maxPrice}
              onChange={e => setMaxPrice(e.target.value)}
              placeholder="最高"
              className="flex-1 h-9 px-3 rounded-lg bg-white border border-gray-200 text-sm outline-none focus:border-orange-400"
            />
          </div>
          <div className="flex gap-2">
            <button onClick={handleReset} className="flex-1 h-9 rounded-lg bg-white border border-gray-200 text-gray-600 text-sm">重置</button>
            <button onClick={() => { setShowFilter(false); setPage(1); }} className="flex-1 h-9 rounded-lg bg-orange-500 text-white text-sm">应用</button>
          </div>
        </div>
      )}

      <div className="flex gap-2 overflow-x-auto pb-2 mb-4 -mx-1 px-1 scrollbar-hide">
        <button
          onClick={() => { setCategory(''); setPage(1); }}
          className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm ${
            !category ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          全部
        </button>
        {categories.map(c => (
          <button
            key={c}
            onClick={() => { setCategory(c); setPage(1); }}
            className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm ${
              category === c ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {(keyword || category || minPrice || maxPrice) && (
        <div className="flex items-center gap-2 mb-3 text-sm text-gray-500">
          <span>搜索结果：共 {total} 件</span>
          <button onClick={handleReset} className="text-orange-500 hover:underline">清除筛选</button>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl overflow-hidden border border-gray-100 animate-pulse">
              <div className="aspect-square bg-gray-100" />
              <div className="p-3 space-y-2">
                <div className="h-4 bg-gray-100 rounded" />
                <div className="h-4 bg-gray-100 rounded w-2/3" />
                <div className="h-5 bg-gray-100 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : products.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
          {products.map(p => <ProductCard key={p.id} product={p} />)}
        </div>
      ) : (
        <div className="text-center py-16 text-gray-400">
          <div className="text-5xl mb-3">📦</div>
          <p>暂无商品</p>
        </div>
      )}

      {total > products.length && (
        <div className="mt-6 flex items-center justify-center gap-2">
          <button
            disabled={page <= 1}
            onClick={() => setPage(p => p - 1)}
            className="px-4 py-2 rounded-lg bg-white border border-gray-200 text-sm disabled:opacity-40"
          >
            上一页
          </button>
          <span className="text-sm text-gray-500">第 {page} 页</span>
          <button
            disabled={page * 20 >= total}
            onClick={() => setPage(p => p + 1)}
            className="px-4 py-2 rounded-lg bg-white border border-gray-200 text-sm disabled:opacity-40"
          >
            下一页
          </button>
        </div>
      )}
    </div>
  );
}
