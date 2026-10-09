import React, { useState } from 'react';
import { Product, StoreSettings } from '../types';
import { useCart } from '../context/CartContext';
import { ShoppingCart, Eye, Sparkles, AlertCircle } from 'lucide-react';

interface ProductCardProps {
  product: Product;
  settings: StoreSettings;
  onViewDetails: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  settings,
  onViewDetails,
}) => {
  const { addToCart } = useCart();
  const [imageError, setImageError] = useState(false);
  const [addedAnim, setAddedAnim] = useState(false);

  const currency = settings.currencySymbol || '$';
  const isOutOfStock = product.status === 'out_of_stock' || product.stock <= 0;

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isOutOfStock) return;
    addToCart(product, 1);
    setAddedAnim(true);
    setTimeout(() => setAddedAnim(false), 1500);
  };

  // Condition color helper
  const getConditionBadge = (condition: string) => {
    switch (condition) {
      case 'Brand New':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'Open Box':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Refurbished':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'Used - Like New':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  // Status badge helper
  const getStatusBadge = () => {
    if (isOutOfStock) {
      return <span className="text-[9px] sm:text-[10px] font-semibold text-rose-600 bg-rose-50 px-1.5 sm:px-2 py-0.5 rounded-full border border-rose-200 whitespace-nowrap">Out of Stock</span>;
    }
    if (product.status === 'low_stock' || (product.stock > 0 && product.stock <= 3)) {
      return <span className="text-[9px] sm:text-[10px] font-semibold text-amber-600 bg-amber-50 px-1.5 sm:px-2 py-0.5 rounded-full border border-amber-200 whitespace-nowrap">Only {product.stock} Left</span>;
    }
    return <span className="text-[9px] sm:text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 sm:px-2 py-0.5 rounded-full border border-emerald-200 whitespace-nowrap">In Stock</span>;
  };

  return (
    <div
      onClick={() => onViewDetails(product)}
      className="group bg-white rounded-xl sm:rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md hover:border-slate-300 transition-all cursor-pointer flex flex-col h-full min-w-0 w-full"
    >
      {/* Image Container with Badges */}
      <div className="relative w-full pt-[90%] bg-slate-50 overflow-hidden border-b border-slate-100">
        {product.isFeatured && (
          <div className="absolute top-2 left-2 z-10 bg-amber-500 text-slate-950 font-bold text-[9px] sm:text-[10px] px-1.5 sm:px-2 py-0.5 rounded-md flex items-center gap-0.5 sm:gap-1 shadow-xs">
            <Sparkles className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
            <span>Featured</span>
          </div>
        )}

        <div className="absolute top-2 right-2 z-10">
          <span className={`text-[9px] sm:text-[10px] font-medium px-1.5 sm:px-2 py-0.5 rounded-md border ${getConditionBadge(product.condition)}`}>
            {product.condition}
          </span>
        </div>

        {/* Product Image */}
        <div className="absolute inset-0 p-2.5 sm:p-4 flex items-center justify-center">
          {product.imageUrl && !imageError ? (
            <img
              src={product.imageUrl}
              alt={product.name}
              loading="lazy"
              onError={() => setImageError(true)}
              className="max-h-full max-w-full object-contain"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 bg-slate-100 rounded-xl p-2 text-center">
              <AlertCircle className="w-6 h-6 sm:w-8 sm:h-8 text-slate-300 mb-1" />
              <span className="text-[11px] sm:text-xs font-medium text-slate-500">Image not available</span>
            </div>
          )}
        </div>
      </div>

      {/* Card Body */}
      <div className="p-2.5 sm:p-4 flex flex-col flex-1 justify-between gap-2 sm:gap-3 min-w-0">
        <div>
          {/* Brand & Category */}
          <div className="flex items-center justify-between text-[10px] sm:text-xs text-slate-500 mb-1 gap-1 min-w-0">
            <span className="font-semibold text-blue-600 uppercase tracking-wider text-[10px] sm:text-[11px] truncate max-w-[65%]">
              {product.brand}
            </span>
            <span className="text-[10px] sm:text-[11px] truncate max-w-[35%] text-slate-400">
              {product.category}
            </span>
          </div>

          {/* Title */}
          <h3 className="font-bold text-slate-900 text-xs sm:text-sm md:text-base leading-snug line-clamp-2 break-words group-hover:text-blue-600 transition-colors">
            {product.name}
          </h3>

          {/* Storage & Color chips if present */}
          {(product.storageCapacity || product.colors) && (
            <div className="flex flex-wrap items-center gap-1 sm:gap-1.5 mt-1.5 sm:mt-2">
              {product.storageCapacity && (
                <span className="bg-slate-100 text-slate-700 text-[9px] sm:text-[10px] font-medium px-1.5 py-0.5 rounded truncate max-w-full">
                  {product.storageCapacity}
                </span>
              )}
              {product.colors && (
                <span className="bg-slate-100 text-slate-700 text-[9px] sm:text-[10px] font-medium px-1.5 py-0.5 rounded truncate max-w-[120px] sm:max-w-[140px]">
                  {product.colors}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Pricing & Stock Status */}
        <div className="pt-1.5 sm:pt-2 border-t border-slate-100">
          <div className="flex flex-col min-[380px]:flex-row min-[380px]:items-baseline justify-between gap-1 mb-2 min-w-0">
            <div className="flex items-baseline gap-1 flex-wrap min-w-0">
              <span className="text-sm min-[360px]:text-base sm:text-lg font-extrabold text-slate-900 truncate">
                {currency}{product.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              {product.originalPrice && product.originalPrice > product.price && (
                <span className="text-[10px] sm:text-xs text-slate-400 line-through truncate">
                  {currency}{product.originalPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              )}
            </div>
            <div className="self-start min-[380px]:self-auto flex-shrink-0">
              {getStatusBadge()}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-1.5 sm:gap-2 pt-1">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onViewDetails(product);
              }}
              className="flex items-center justify-center gap-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] sm:text-xs font-semibold py-1.5 sm:py-2 px-1 sm:px-2 rounded-lg sm:rounded-xl transition-colors min-w-0"
            >
              <Eye className="w-3 h-3 sm:w-3.5 sm:h-3.5 flex-shrink-0" />
              <span className="truncate">Details</span>
            </button>

            <button
              type="button"
              disabled={isOutOfStock}
              onClick={handleQuickAdd}
              className={`flex items-center justify-center gap-1 text-[11px] sm:text-xs font-semibold py-1.5 sm:py-2 px-1 sm:px-2 rounded-lg sm:rounded-xl transition-colors min-w-0 ${
                isOutOfStock
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  : addedAnim
                  ? 'bg-emerald-600 text-white'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              <ShoppingCart className="w-3 h-3 sm:w-3.5 sm:h-3.5 flex-shrink-0" />
              <span className="truncate">{isOutOfStock ? 'Sold Out' : addedAnim ? 'Added!' : 'Add'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
