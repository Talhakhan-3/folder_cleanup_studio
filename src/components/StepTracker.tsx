import React from 'react';
import { Check } from 'lucide-react';

interface StepTrackerProps {
  currentStep: number;
  onSelectStep?: (step: number) => void;
  maxStepReached: number;
}

const STEPS = [
  { id: 1, label: 'Start' },
  { id: 2, label: 'Scan' },
  { id: 3, label: 'Run' },
  { id: 4, label: 'Results' },
];

export const StepTracker: React.FC<StepTrackerProps> = ({
  currentStep,
  onSelectStep,
  maxStepReached,
}) => {
  return (
    <div className="flex items-center justify-center gap-2 md:gap-4 my-6 py-3 px-5 bg-white/[0.02] border border-white/10 rounded-2xl max-w-xl mx-auto backdrop-blur-md">
      {STEPS.map((step, idx) => {
        const isDone = currentStep > step.id;
        const isActive = currentStep === step.id;
        const isSelectable = step.id <= maxStepReached;

        return (
          <React.Fragment key={step.id}>
            <button
              type="button"
              disabled={!isSelectable}
              onClick={() => isSelectable && onSelectStep && onSelectStep(step.id)}
              className={`flex items-center gap-2.5 text-xs md:text-sm font-medium transition-all ${
                isActive
                  ? 'text-white'
                  : isDone
                  ? 'text-[#6bcb77] hover:text-[#6bcb77]/80'
                  : isSelectable
                  ? 'text-[#a8a29e] hover:text-white'
                  : 'text-white/30 cursor-not-allowed'
              }`}
            >
              <span
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-gradient-to-br from-[#ff6b6b] to-[#a78bfa] text-white shadow-[0_0_16px_rgba(255,107,107,0.4)] scale-110'
                    : isDone
                    ? 'bg-[#6bcb77]/20 border border-[#6bcb77]/50 text-[#6bcb77]'
                    : 'bg-white/5 border border-white/15 text-white/50'
                }`}
              >
                {isDone ? <Check className="w-3.5 h-3.5" /> : step.id}
              </span>
              <span>{step.label}</span>
            </button>

            {idx < STEPS.length - 1 && (
              <span className="text-white/20 select-none text-xs">›</span>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};
