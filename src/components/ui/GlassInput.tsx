import React from 'react';

export interface GlassInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  icon?: React.ReactNode;
  error?: string | null;
}

export const GlassInput: React.FC<GlassInputProps> = ({
  label,
  icon,
  error,
  className = '',
  ...props
}) => {
  return (
    <div className="space-y-1 font-mono text-xs w-full">
      {label && (
        <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">
          {label}
        </label>
      )}

      <div className="relative flex items-center">
        {icon && <div className="absolute left-3 text-slate-500 pointer-events-none">{icon}</div>}
        <input
          {...props}
          className={`w-full px-3 py-2 rounded-xl bg-slate-900/90 border border-slate-800 text-slate-100 placeholder:text-slate-500 outline-none transition-all focus:border-amber-500/80 focus:ring-2 focus:ring-amber-500/20 font-sans text-xs ${
            icon ? 'pl-9' : ''
          } ${error ? 'border-rose-500' : ''} ${className}`}
        />
      </div>

      {error && <span className="text-[10px] text-rose-400 font-bold block">{error}</span>}
    </div>
  );
};

export interface GlassTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string | null;
}

export const GlassTextarea: React.FC<GlassTextareaProps> = ({
  label,
  error,
  className = '',
  ...props
}) => {
  return (
    <div className="space-y-1 font-mono text-xs w-full">
      {label && (
        <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">
          {label}
        </label>
      )}

      <textarea
        {...props}
        className={`w-full px-3 py-2 rounded-xl bg-slate-900/90 border border-slate-800 text-slate-100 placeholder:text-slate-500 outline-none transition-all focus:border-amber-500/80 focus:ring-2 focus:ring-amber-500/20 font-sans text-xs ${
          error ? 'border-rose-500' : ''
        } ${className}`}
      />

      {error && <span className="text-[10px] text-rose-400 font-bold block">{error}</span>}
    </div>
  );
};
