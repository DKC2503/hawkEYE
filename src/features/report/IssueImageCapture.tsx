import React, { useRef, useState } from 'react';
import { GlassSurface } from '../../components/ui/GlassSurface';
import { GlassButton } from '../../components/ui/GlassButton';

interface IssueImageCaptureProps {
  imageFile?: File;
  imagePreviewUrl?: string;
  onImageSelected: (file: File, previewUrl: string) => void;
  onImageRemoved: () => void;
  onNext: () => void;
}

export const IssueImageCapture: React.FC<IssueImageCaptureProps> = ({
  imagePreviewUrl,
  onImageSelected,
  onImageRemoved,
  onNext,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file (PNG, JPG, WEBP).');
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    onImageSelected(file, previewUrl);
  };

  return (
    <GlassSurface variant="surface" rounded="3xl" className="p-6 sm:p-8 space-y-6 border-slate-200/80">
      <div className="space-y-1">
        <h3 className="text-xl font-bold text-slate-900">Step 1: Capture Issue Photo</h3>
        <p className="text-xs sm:text-sm text-slate-600">
          Provide a clear photo of the civic issue (e.g. pothole, broken light, garbage).
        </p>
      </div>

      {/* Hidden File Inputs */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />
      <input
        type="file"
        ref={cameraInputRef}
        onChange={handleFileChange}
        accept="image/*"
        capture="environment"
        className="hidden"
      />

      {error && (
        <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold">
          {error}
        </div>
      )}

      {/* Image Preview or Drop Zone */}
      {imagePreviewUrl ? (
        <div className="space-y-4">
          <div className="relative rounded-2xl overflow-hidden border border-slate-200 max-h-80 bg-slate-100 flex items-center justify-center">
            <img
              src={imagePreviewUrl}
              alt="Issue Preview"
              className="w-full max-h-80 object-contain rounded-2xl"
            />
            <div className="absolute top-3 right-3 flex gap-2">
              <button
                type="button"
                onClick={onImageRemoved}
                aria-label="Remove image"
                className="p-2 rounded-xl bg-white/90 text-rose-700 hover:text-rose-900 hover:bg-white backdrop-blur-md shadow-md transition-colors focus-ring"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>

          <div className="flex gap-3">
            <GlassButton
              variant="secondary"
              size="md"
              fullWidth
              onClick={() => fileInputRef.current?.click()}
            >
              Replace Photo
            </GlassButton>
            <GlassButton variant="accent" size="md" fullWidth onClick={onNext}>
              Continue to Location &rarr;
            </GlassButton>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-300 hover:border-amber-500/60 rounded-3xl p-8 sm:p-12 text-center space-y-4 cursor-pointer transition-colors glass-subtle bg-white/60"
          >
            <div className="w-16 h-16 rounded-2xl glass-elevated text-amber-700 flex items-center justify-center mx-auto shadow-sm">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>

            <div className="space-y-1">
              <h4 className="text-base font-bold text-slate-900">Tap to Select or Upload Photo</h4>
              <p className="text-xs text-slate-500">Supports PNG, JPG, WEBP up to 10MB</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <GlassButton
              variant="primary"
              size="md"
              leftIcon={
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                </svg>
              }
              onClick={() => cameraInputRef.current?.click()}
            >
              Take Photo
            </GlassButton>

            <GlassButton
              variant="secondary"
              size="md"
              leftIcon={
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
              }
              onClick={() => fileInputRef.current?.click()}
            >
              Upload Photo
            </GlassButton>
          </div>
        </div>
      )}
    </GlassSurface>
  );
};
