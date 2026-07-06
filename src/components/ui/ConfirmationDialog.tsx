import React from 'react';
import { GlassSurface } from './GlassSurface';
import { GlassButton } from './GlassButton';

interface ConfirmationDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  variant?: 'danger' | 'primary' | 'accent';
}

export const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
  variant = 'primary',
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <GlassSurface
        variant="elevated"
        rounded="2xl"
        className="w-full max-w-md p-6 space-y-4 border-slate-200/80 bg-white/95 text-slate-900 shadow-2xl"
      >
        <h3 className="text-xl font-bold text-slate-900">{title}</h3>
        <p className="text-slate-600 text-sm leading-relaxed">{message}</p>
        <div className="flex items-center justify-end gap-3 pt-2">
          <GlassButton variant="ghost" size="sm" onClick={onCancel}>
            {cancelLabel}
          </GlassButton>
          <GlassButton variant={variant} size="sm" onClick={onConfirm}>
            {confirmLabel}
          </GlassButton>
        </div>
      </GlassSurface>
    </div>
  );
};
