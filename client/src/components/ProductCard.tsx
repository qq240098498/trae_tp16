import { Link } from 'react-router-dom';
import { Eye, Heart } from 'lucide-react';
import type { Product } from '@/types';

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const discount = product.originalPrice > product.price
    ? Math.round((1 - product.price / product.originalPrice) * 100)
    : 0;

  return (
    <Link
      to={`/product/${product.id}`}
      className="group block bg-white rounded-2xl overflow-hidden border border-gray-100 hover:shadow-lg hover:-translate-y-0.5 transition-all"
    >
      <div className="relative aspect-square bg-gray-50 overflow-hidden">
        <img
          src={product.images?.[0]}
          alt={product.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        {discount > 0 && (
          <div className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
            -{discount}%
          </div>
        )}
        {product.condition && (
          <div className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-0.5 rounded-full">
            {product.condition}
          </div>
        )}
      </div>
      <div className="p-3">
        <h3 className="text-sm font-medium text-gray-800 line-clamp-2 leading-snug min-h-[2.5rem]">
          {product.title}
        </h3>
        <div className="mt-2 flex items-end justify-between">
          <div className="flex items-baseline gap-1">
            <span className="text-orange-500 font-bold text-lg">¥{product.price}</span>
            {product.originalPrice > product.price && (
              <span className="text-gray-400 text-xs line-through">¥{product.originalPrice}</span>
            )}
          </div>
        </div>
        <div className="mt-2 flex items-center gap-3 text-xs text-gray-400">
          <span className="flex items-center gap-0.5"><Eye size={12} />{product.views || 0}</span>
          <span className="flex items-center gap-0.5"><Heart size={12} />{product.favorites || 0}</span>
        </div>
      </div>
    </Link>
  );
}
