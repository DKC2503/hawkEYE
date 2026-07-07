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
      <div className="flex flex-row items-center justify-between text-[11px] sm:text-xs text-slate-600 font-medium px-1 min-w-0">
        <span className="shrink-0">Step {currentStep} of 5</span>
        <span className="text-amber-800 font-bold truncate ml-2 text-right">{steps[currentStep - 1].label}</span>
      </div>

      <div className="flex w-full gap-1 sm:gap-1.5">
        {steps.map((step) => {
          const isCompleted = step.number < currentStep;
          const isCurrent = step.number === currentStep;

          return (
            <button
              key={step.number}
              disabled={!onStepClick || step.number > currentStep}
              onClick={() => onStepClick && onStepClick(step.number)}
              className={`flex-1 min-w-0 h-2 sm:h-2.5 rounded-full transition-all duration-300 focus-ring ${
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
