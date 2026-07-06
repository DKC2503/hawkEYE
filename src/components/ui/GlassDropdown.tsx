import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';

export interface GlassDropdownOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
  description?: string;
}

export interface GlassDropdownProps {
  options: GlassDropdownOption[];
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  variant?: 'default' | 'pill' | 'city' | 'amber' | 'dark' | 'rose';
  className?: string;
  dropdownClassName?: string;
  ariaLabel?: string;
  icon?: React.ReactNode;
}

export const GlassDropdown: React.FC<GlassDropdownProps> = ({
  options,
  value,
  onChange,
  placeholder = 'Select option...',
  variant = 'default',
  className = '',
  dropdownClassName = '',
  ariaLabel = 'Select option',
  icon,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState<number>(-1);
  const [menuStyle, setMenuStyle] = useState<React.CSSProperties>({});
  const containerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value) || options[0];

  const updatePosition = useCallback(() => {
    if (isOpen && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setMenuStyle({
        position: 'fixed',
        top: rect.bottom + 8,
        left: rect.left,
        width: rect.width,
        zIndex: 99999,
      });
    }
  }, [isOpen]);

  useEffect(() => {
    updatePosition();
    if (isOpen) {
      window.addEventListener('scroll', updatePosition, true);
      window.addEventListener('resize', updatePosition);
    }
    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [isOpen, updatePosition]);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        containerRef.current && 
        !containerRef.current.contains(target) &&
        (!menuRef.current || !menuRef.current.contains(target))
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!isOpen) {
        if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
          e.preventDefault();
          setIsOpen(true);
          setFocusedIndex(0);
        }
        return;
      }

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setFocusedIndex((prev) => (prev < options.length - 1 ? prev + 1 : 0));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setFocusedIndex((prev) => (prev > 0 ? prev - 1 : options.length - 1));
          break;
        case 'Enter':
        case ' ':
          e.preventDefault();
          if (focusedIndex >= 0 && focusedIndex < options.length) {
            onChange(options[focusedIndex].value);
            setIsOpen(false);
          }
          break;
        case 'Escape':
        case 'Tab':
          setIsOpen(false);
          break;
        default:
          break;
      }
    },
    [isOpen, focusedIndex, options, onChange]
  );

  const handleSelectOption = (optValue: string) => {
    onChange(optValue);
    setIsOpen(false);
  };

  let variantTriggerClasses = 'liquid-glass text-slate-100 border border-white/20 hover:bg-white/10';
  if (variant === 'city') {
    variantTriggerClasses = 'liquid-glass px-4 py-2 rounded-full text-amber-300 font-bold border border-amber-500/40 shadow-lg shadow-amber-500/10 hover:border-amber-400 hover:scale-[1.02] active:scale-[0.97]';
  } else if (variant === 'pill') {
    variantTriggerClasses = 'liquid-glass px-3.5 py-1.5 rounded-full text-slate-200 border border-white/15 hover:border-white/30 text-xs';
  } else if (variant === 'amber') {
    variantTriggerClasses = 'bg-slate-900 border border-amber-500/40 text-amber-300 hover:border-amber-400 rounded-xl px-3 py-2 text-xs font-mono';
  } else if (variant === 'rose') {
    variantTriggerClasses = 'bg-slate-900 border border-rose-500/40 text-rose-300 hover:border-rose-400 rounded-xl px-3 py-2 text-xs font-mono';
  } else if (variant === 'dark') {
    variantTriggerClasses = 'bg-slate-900 border border-slate-800 text-slate-200 hover:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono';
  }

  return (
    <div
      ref={containerRef}
      className={`relative inline-block text-left font-sans select-none ${className}`}
      onKeyDown={handleKeyDown}
    >
      {/* TRIGGER BUTTON */}
      <button
        type="button"
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between gap-2.5 transition-all outline-none focus:ring-2 focus:ring-amber-400/40 ${variantTriggerClasses}`}
      >
        <div className="flex items-center gap-2 truncate">
          {icon || selectedOption?.icon}
          <span className="truncate">{selectedOption?.label || placeholder}</span>
        </div>

        {/* Animated Chevron */}
        <svg
          className={`w-4 h-4 text-amber-400/80 transition-transform duration-300 shrink-0 ${isOpen ? 'rotate-180' : 'rotate-0'}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* FLOATING LIQUID GLASS DROPDOWN PANEL - PORTALED TO BODY */}
      {isOpen && typeof document !== 'undefined' && createPortal(
        <div
          ref={menuRef}
          role="listbox"
          tabIndex={-1}
          className={`p-1.5 rounded-2xl bg-slate-950/95 border border-white/20 backdrop-blur-2xl shadow-2xl shadow-black/80 space-y-1 overflow-hidden transition-all duration-300 origin-top animate-blur-fade-up min-w-[200px] ${dropdownClassName}`}
          style={{ ...menuStyle, animationDuration: '300ms' }}
        >
          {options.map((opt, idx) => {
            const isSelected = opt.value === value;
            const isFocused = idx === focusedIndex;

            return (
              <button
                key={opt.value}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => handleSelectOption(opt.value)}
                onMouseEnter={() => setFocusedIndex(idx)}
                className={`w-full text-left px-3.5 py-2.5 rounded-xl font-mono text-xs transition-all flex items-center justify-between gap-2.5 ${
                  isSelected
                    ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40 shadow-inner'
                    : isFocused
                    ? 'bg-white/10 text-white translate-x-1'
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  {opt.icon || (
                    <svg className={`w-3.5 h-3.5 ${isSelected ? 'text-amber-400' : 'text-slate-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  )}
                  <div>
                    <span className="block font-sans font-medium text-xs">{opt.label}</span>
                    {opt.description && (
                      <span className="text-[10px] text-slate-400 font-mono block">{opt.description}</span>
                    )}
                  </div>
                </div>

                {isSelected && (
                  <svg className="w-4 h-4 text-amber-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
            );
          })}
        </div>,
        document.body
      )}
    </div>
  );
};
