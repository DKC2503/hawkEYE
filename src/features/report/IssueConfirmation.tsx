import React from 'react';
import { GlassSurface } from '../../components/ui/GlassSurface';
import { GlassButton } from '../../components/ui/GlassButton';
import { CITIZEN_SELECTABLE_CATEGORIES, SEVERITY_OPTIONS } from '../../types/civic';
import type { IssueCategory, IssueSeverity, StructuredLocation } from '../../types/civic';

interface IssueConfirmationProps {
  imagePreviewUrl?: string;
  location?: StructuredLocation | null;
  category: IssueCategory;
  description: string;
  severity: IssueSeverity;
  onCategoryChange: (category: IssueCategory) => void;
  onDescriptionChange: (desc: string) => void;
  onSeverityChange: (sev: IssueSeverity) => void;
  onNext: () => void;
  onBack: () => void;
  disabled?: boolean;
}

export const IssueConfirmation: React.FC<IssueConfirmationProps> = ({
  imagePreviewUrl,
  location,
  category,
  description,
  severity,
  onCategoryChange,
  onDescriptionChange,
  onSeverityChange,
  onNext,
  onBack,
  disabled = false,
}) => {
  const currentCategoryKey = (category || 'other').toLowerCase() as IssueCategory;
  const currentSeverityKey = (severity || 'medium').toLowerCase() as IssueSeverity;

  return (
    <GlassSurface variant="surface" rounded="3xl" className="p-6 sm:p-8 space-y-6 border-slate-200/80">
      <div className="space-y-1">
        <h3 className="text-xl font-bold text-slate-900">Step 4: Confirm Report Details</h3>
        <p className="text-xs sm:text-sm text-slate-600">
          Review captured details, add extra notes, and correct category if needed.
        </p>
      </div>

      <div className="space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-3 rounded-2xl glass-subtle space-y-2 bg-white/70">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Image Preview</span>
            {imagePreviewUrl ? (
              <img
                src={imagePreviewUrl}
                alt="Captured Issue"
                className="w-full h-32 object-cover rounded-xl border border-slate-200"
              />
            ) : (
              <div className="h-32 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-xs text-slate-500 font-medium">
                No Image Attached
              </div>
            )}
          </div>

          <div className="p-4 rounded-2xl glass-subtle space-y-2 flex flex-col justify-between bg-white/70">
            <div className="space-y-1">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Captured Location</span>
              {location ? (
                <div>
                  {location.area ? (
                    <>
                      <h5 className="text-sm font-bold text-slate-900">{location.area}</h5>
                      <p className="text-xs text-slate-600 font-medium">
                        {[location.city, location.state].filter(Boolean).join(', ')}
                      </p>
                    </>
                  ) : location.city ? (
                    <>
                      <h5 className="text-sm font-bold text-slate-900">{location.city}</h5>
                      <p className="text-xs text-slate-600 font-medium">{location.state || location.country}</p>
                    </>
                  ) : (
                    <h5 className="text-sm font-bold text-slate-900">
                      {location.formattedAddress || 'Location Captured'}
                    </h5>
                  )}
                </div>
              ) : (
                <p className="text-xs text-slate-500 font-medium">Location details unavailable</p>
              )}
            </div>

            <div className="text-[11px] text-slate-600 bg-slate-100/80 p-2 rounded-xl border border-slate-200/60 font-medium">
              GPS & Area verification active for municipal dispatch.
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
            Issue Category
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {CITIZEN_SELECTABLE_CATEGORIES.map((cat) => {
              const isSelected = currentCategoryKey === cat.id;
              return (
                <button
                  type="button"
                  key={cat.id}
                  onClick={() => onCategoryChange(cat.id)}
                  className={`py-2.5 px-3 text-xs rounded-xl font-bold transition-all duration-200 focus-ring flex items-center justify-between text-left ${
                    isSelected
                      ? 'bg-amber-600 text-white shadow-md shadow-amber-600/20 border border-amber-500'
                      : 'glass-subtle text-slate-800 hover:text-slate-950 hover:bg-white bg-white/70 border border-slate-200/80'
                  }`}
                >
                  <span className="truncate">{cat.label}</span>
                  {isSelected && (
                    <svg className="w-4 h-4 shrink-0 text-white ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-2">
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
            Severity Rating
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {SEVERITY_OPTIONS.map((sev) => {
              const isSelected = currentSeverityKey === sev.id;
              return (
                <button
                  type="button"
                  key={sev.id}
                  onClick={() => onSeverityChange(sev.id)}
                  className={`py-3 px-3 text-xs rounded-xl font-bold text-center transition-all duration-200 focus-ring border ${
                    isSelected
                      ? `${sev.buttonActiveBg} shadow-md scale-[1.02]`
                      : 'glass-subtle text-slate-800 hover:text-slate-950 hover:bg-white bg-white/70 border-slate-200/80'
                  }`}
                >
                  <span className="block font-extrabold text-xs">{sev.label}</span>
                  <span className="block text-[10px] opacity-80 font-normal truncate mt-0.5">{sev.description}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-2">
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
            Additional Citizen Notes & Remarks
          </label>
          <textarea
            rows={3}
            value={description}
            onChange={(e) => onDescriptionChange(e.target.value)}
            placeholder="Describe landmarks, urgency, or specific hazards..."
            className="w-full rounded-2xl glass-subtle p-3 text-sm text-slate-900 placeholder:text-slate-400 border border-slate-300/80 outline-none focus:border-amber-500 transition-colors bg-white/90"
          />
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <GlassButton variant="secondary" size="md" fullWidth onClick={onBack} disabled={disabled}>
          &larr; Back
        </GlassButton>
        <GlassButton variant="accent" size="md" fullWidth onClick={onNext} disabled={disabled}>
          {disabled ? 'Checking Nearby Reports...' : 'Proceed to Submission \u2192'}
        </GlassButton>
      </div>
    </GlassSurface>
  );
};
