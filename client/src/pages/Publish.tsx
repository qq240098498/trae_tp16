import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, ImagePlus, X } from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from '@/components/UI';
import { useAuthStore } from '@/store/useAuthStore';
import type { Product } from '@/types';

const CONDITIONS = ['全新', '几乎全新', '九成新', '八成新', '七成新', '有瑕疵'];

export default function Publish() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const editId = params.get('edit');
  const { token, user } = useAuthStore();

  const [categories, setCategories] = useState<string[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [originalPrice, setOriginalPrice] = useState('');
  const [category, setCategory] = useState('');
  const [condition, setCondition] = useState('九成新');
  const [images, setImages] = useState<string[]>([]);
  const [status, setStatus] = useState<'on_sale' | 'off_shelf'>('on_sale');
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token) {
      toast('请先登录', 'error');
      navigate('/login');
      return;
    }
    api.getCategories().then(setCategories).catch(() => {});
    if (editId) {
      loadEditProduct();
    }
  }, [token, editId]);

  const loadEditProduct = async () => {
    setLoading(true);
    try {
      const p = await api.getProduct(Number(editId));
      if (p.sellerId !== user?.id) {
        toast('无权限编辑此商品', 'error');
        navigate(-1);
        return;
      }
      setTitle(p.title);
      setDescription(p.description);
      setPrice(String(p.price));
      setOriginalPrice(String(p.originalPrice));
      setCategory(p.category);
      setCondition(p.condition);
      setImages(p.images || []);
      setStatus(p.status as any);
    } catch (e: any) {
      toast(e.message || '加载失败', 'error');
    } finally {
      setLoading(false);
    }
  };

  const addImage = () => {
    const url = prompt('请输入图片URL：');
    if (url) {
      setImages([...images, url]);
    }
  };

  const removeImage = (i: number) => {
    setImages(images.filter((_, idx) => idx !== i));
  };

  const addRandomImage = () => {
    const url = `https://picsum.photos/600/600?random=${Date.now()}`;
    setImages([...images, url]);
  };

  const handleSubmit = async () => {
    if (!title.trim()) { toast('请输入标题', 'error'); return; }
    if (!price || Number(price) <= 0) { toast('请输入有效价格', 'error'); return; }
    if (!category) { toast('请选择分类', 'error'); return; }

    const data: Partial<Product> = {
      title: title.trim(),
      description: description.trim(),
      price: Number(price),
      originalPrice: originalPrice ? Number(originalPrice) : Number(price),
      category,
      condition,
      images: images.length ? images : [
        `https://picsum.photos/600/600?random=${Date.now()}`,
        `https://picsum.photos/600/600?random=${Date.now() + 1}`,
        `https://picsum.photos/600/600?random=${Date.now() + 2}`,
      ],
    };

    setSubmitting(true);
    try {
      if (editId) {
        await api.updateProduct(Number(editId), { ...data, status });
        toast('修改成功', 'success');
      } else {
        await api.createProduct(data);
        toast('发布成功', 'success');
      }
      navigate('/profile');
    } catch (e: any) {
      toast(e.message || '操作失败', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="max-w-2xl mx-auto px-4 py-10 text-center text-gray-400">加载中...</div>;
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-4 pb-24 sm:pb-8">
      <div className="sticky top-0 z-30 bg-white/80 backdrop-blur border-b border-gray-100 -mx-4 px-4 py-3 mb-4">
        <div className="flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-gray-600 hover:text-gray-900">
            <ArrowLeft size={20} />
            <span className="text-sm">返回</span>
          </button>
          <h1 className="font-semibold text-gray-900">{editId ? '编辑商品' : '发布闲置'}</h1>
          <div className="w-12" />
        </div>
      </div>

      <div className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">商品图片</label>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {images.map((img, i) => (
              <div key={i} className="relative aspect-square bg-gray-100 rounded-xl overflow-hidden group">
                <img src={img} alt="" className="w-full h-full object-cover" />
                <button
                  onClick={() => removeImage(i)}
                  className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
            {images.length < 9 && (
              <button
                onClick={addRandomImage}
                className="aspect-square bg-gray-50 rounded-xl border-2 border-dashed border-gray-200 text-gray-400 flex flex-col items-center justify-center hover:border-orange-300 hover:text-orange-400 transition"
              >
                <ImagePlus size={24} />
                <span className="text-xs mt-1">随机图片</span>
              </button>
            )}
          </div>
          <p className="text-xs text-gray-400 mt-2">提示：点击「随机图片」可快速添加示例图片</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">商品标题 *</label>
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            maxLength={50}
            placeholder="简明扼要描述你的宝贝"
            className="w-full h-11 px-4 rounded-xl bg-gray-50 border border-gray-200 text-sm outline-none focus:border-orange-400 focus:bg-white transition"
          />
          <p className="text-xs text-gray-400 mt-1 text-right">{title.length}/50</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">商品描述</label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            rows={5}
            maxLength={1000}
            placeholder="详细描述商品使用情况、购买时间、转手原因等"
            className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-sm outline-none focus:border-orange-400 focus:bg-white transition resize-none"
          />
          <p className="text-xs text-gray-400 mt-1 text-right">{description.length}/1000</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">售价（元）*</label>
            <input
              type="number"
              value={price}
              onChange={e => setPrice(e.target.value)}
              placeholder="0.00"
              className="w-full h-11 px-4 rounded-xl bg-gray-50 border border-gray-200 text-sm outline-none focus:border-orange-400 focus:bg-white transition"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">原价（元）</label>
            <input
              type="number"
              value={originalPrice}
              onChange={e => setOriginalPrice(e.target.value)}
              placeholder="购买时的价格"
              className="w-full h-11 px-4 rounded-xl bg-gray-50 border border-gray-200 text-sm outline-none focus:border-orange-400 focus:bg-white transition"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">分类 *</label>
          <div className="flex flex-wrap gap-2">
            {categories.map(c => (
              <button
                key={c}
                onClick={() => setCategory(c)}
                className={`px-4 py-2 rounded-full text-sm ${
                  category === c
                    ? 'bg-orange-500 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">新旧程度</label>
          <div className="flex flex-wrap gap-2">
            {CONDITIONS.map(c => (
              <button
                key={c}
                onClick={() => setCondition(c)}
                className={`px-4 py-2 rounded-full text-sm ${
                  condition === c
                    ? 'bg-orange-500 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {editId && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">商品状态</label>
            <div className="flex gap-3">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="radio" checked={status === 'on_sale'} onChange={() => setStatus('on_sale')} />
                <span className="text-gray-700">上架中</span>
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="radio" checked={status === 'off_shelf'} onChange={() => setStatus('off_shelf')} />
                <span className="text-gray-700">已下架</span>
              </label>
            </div>
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="w-full h-12 rounded-full bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white font-medium shadow-md disabled:opacity-60 transition"
        >
          {submitting ? '处理中...' : editId ? '保存修改' : '立即发布'}
        </button>
      </div>
    </div>
  );
}
