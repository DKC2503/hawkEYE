import React from 'react';
import type { ReportStep } from '../../types/reportFlow';

interface StepProgressProps {
  currentStep: ReportStep;
  onStepClick?: (step: ReportStep) => void;
}

export const StepProgress: React.FC<StepProgressProps> = ({
  currentStep,
  onStepClick,
}) => {
  const steps: { number: ReportStep; label: string }[] = [
    { number: 1, label: 'Capture Photo' },
    { number: 2, label: 'Location' },
    { number: 3, label: 'AI Review' },
    { number: 4, label: 'Confirm' },
    { number: 5, label: 'Submit' },
  ];

  return (
    <div className="w-full space-y-2">
      <div className="flex items-center justify-between text-xs text-slate-600 font-medium px-1">
        <span>Step {currentStep} of 5</span>
        <span className="text-amber-800 font-bold">{steps[currentStep - 1].label}</span>
      </div>

      <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
        {steps.map((step) => {
          const isCompleted = step.number < currentStep;
          const isCurrent = step.number === currentStep;

          return (
            <button
              key={step.number}
              disabled={!onStepClick || step.number > currentStep}
              onClick={() => onStepClick && onStepClick(step.number)}
              className={`h-2.5 rounded-full transition-all duration-300 focus-ring ${
                isCurrent
                  ? 'bg-amber-600 shadow-md shadow-amber-600/20 ring-2 ring-amber-400/40'
                  : isCompleted
                  ? 'bg-emerald-500/80 hover:bg-emerald-600'
                  : 'bg-slate-200 border border-slate-300/60'
              }`}
              title={step.label}
            />
          );
        })}
      </div>
    </div>
  );
};
