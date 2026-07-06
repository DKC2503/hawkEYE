import React from 'react';
import { CITIZEN_SELECTABLE_CATEGORIES } from '../../types/civic';
import type { IssueCategory } from '../../types/civic';

interface CategoryFilterChipsProps {
  selectedCategory?: IssueCategory | 'all';
  onSelectCategory: (category: IssueCategory | 'all') => void;
}

export const CategoryFilterChips: React.FC<CategoryFilterChipsProps> = ({
  selectedCategory = 'all',
  onSelectCategory,
}) => {
  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar max-w-full">
      <button
        onClick={() => onSelectCategory('all')}
        className={`px-3.5 py-1.5 text-xs font-bold rounded-xl whitespace-nowrap transition-all duration-200 focus-ring ${
          selectedCategory === 'all'
            ? 'glass-elevated bg-amber-600 text-white shadow-sm border-amber-500/40'
            : 'glass-subtle text-slate-800 hover:text-slate-950 hover:bg-white bg-white/70'
        }`}
      >
        All Issues
      </button>

      {CITIZEN_SELECTABLE_CATEGORIES.map((cat) => {
        const isSelected = selectedCategory === cat.id;
        return (
          <button
            key={cat.id}
            onClick={() => onSelectCategory(cat.id)}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl whitespace-nowrap transition-all duration-200 focus-ring ${
              isSelected
                ? 'glass-elevated bg-amber-600 text-white shadow-sm border-amber-500/40 font-bold'
                : 'glass-subtle text-slate-800 hover:text-slate-950 hover:bg-white bg-white/70'
            }`}
          >
            {cat.label}
          </button>
        );
      })}
    </div>
  );
};
