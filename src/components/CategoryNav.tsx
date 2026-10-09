import React from 'react';
import { Category } from '../types';
import { Grid } from 'lucide-react';

interface CategoryNavProps {
  categories: Category[];
  selectedCategory: string;
  onSelectCategory: (categoryName: string) => void;
  productCountByCategory: Record<string, number>;
  totalProductsCount: number;
}

export const CategoryNav: React.FC<CategoryNavProps> = ({
  categories,
  selectedCategory,
  onSelectCategory,
  productCountByCategory,
  totalProductsCount,
}) => {
  return (
    <div className="bg-white border-b border-slate-200 sticky top-16 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar scroll-smooth py-1">
          {/* All Products option */}
          <button
            onClick={() => onSelectCategory('all')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all flex-shrink-0 ${
              selectedCategory === 'all'
                ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Grid className="w-3.5 h-3.5" />
            <span>All Gadgets</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                selectedCategory === 'all'
                  ? 'bg-blue-700 text-white'
                  : 'bg-slate-200 text-slate-600'
              }`}
            >
              {totalProductsCount}
            </span>
          </button>

          {/* Dynamic Categories */}
          {categories.map((cat) => {
            const count = productCountByCategory[cat.name] || 0;
            const isSelected = selectedCategory.toLowerCase() === cat.name.toLowerCase();

            return (
              <button
                key={cat.id || cat.slug}
                onClick={() => onSelectCategory(cat.name)}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all flex-shrink-0 ${
                  isSelected
                    ? 'bg-blue-600 text-white font-semibold shadow-sm shadow-blue-500/20'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <span>{cat.name}</span>
                {count > 0 && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                      isSelected
                        ? 'bg-blue-700 text-white'
                        : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
