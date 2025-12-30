/**
 * Loading Progress Indicator Component
 * 
 * PHASE 2: Loading Progress Indicator (7.9.3)
 * 
 * Displays progress steps và time estimate cho loading states
 */

'use client';

import { useEffect, useState } from 'react';
import { Loader2, CheckCircle2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

export type LoadingStep = 
  | 'idle'
  | 'fetching'
  | 'validating'
  | 'saving'
  | 'processing'
  | 'complete';

interface LoadingProgressIndicatorProps {
  step: LoadingStep;
  message?: string;
  showTimeEstimate?: boolean;
  totalSteps?: number;
  currentStep?: number;
}

const STEP_CONFIG: Record<LoadingStep, { label: string; progress: number; estimatedTime?: number }> = {
  idle: { label: 'Sẵn sàng', progress: 0 },
  fetching: { label: 'Đang tải dữ liệu...', progress: 20, estimatedTime: 1 },
  validating: { label: 'Đang xác thực...', progress: 50, estimatedTime: 0.5 },
  saving: { label: 'Đang lưu thay đổi...', progress: 75, estimatedTime: 1.5 },
  processing: { label: 'Đang xử lý...', progress: 90, estimatedTime: 1 },
  complete: { label: 'Hoàn thành', progress: 100 },
};

export function LoadingProgressIndicator({
  step,
  message,
  showTimeEstimate = true,
  totalSteps,
  currentStep,
}: LoadingProgressIndicatorProps) {
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [estimatedTimeRemaining, setEstimatedTimeRemaining] = useState<number | null>(null);

  const config = STEP_CONFIG[step];
  const displayMessage = message || config.label;
  
  // Calculate progress based on step or custom steps
  const progress = totalSteps && currentStep !== undefined
    ? Math.round((currentStep / totalSteps) * 100)
    : config.progress;

  // Time estimation logic
  useEffect(() => {
    if (step === 'idle' || step === 'complete') {
      setTimeElapsed(0);
      setEstimatedTimeRemaining(null);
      return;
    }

    const interval = setInterval(() => {
      setTimeElapsed((prev) => prev + 0.1);
    }, 100);

    // Estimate remaining time based on step
    if (config.estimatedTime && showTimeEstimate) {
      const estimatedTotal = config.estimatedTime;
      setEstimatedTimeRemaining((prevRemaining) => {
        const remaining = Math.max(0, estimatedTotal - timeElapsed);
        return remaining;
      });
    }

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, config.estimatedTime, showTimeEstimate]); // timeElapsed intentionally excluded to avoid infinite re-render

  // Format time display
  const formatTime = (seconds: number): string => {
    if (seconds < 1) {
      return '< 1 giây';
    }
    if (seconds < 60) {
      return `${Math.ceil(seconds)} giây`;
    }
    const minutes = Math.floor(seconds / 60);
    const secs = Math.ceil(seconds % 60);
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  if (step === 'idle') {
    return null;
  }

  return (
    <div className="flex flex-col items-center gap-3 p-4 bg-white/95 backdrop-blur-sm rounded-lg border border-slate-200 shadow-sm">
      {/* Progress Icon */}
      <div className="relative">
        {step === 'complete' ? (
          <CheckCircle2 className="h-8 w-8 text-green-500" />
        ) : (
          <Loader2 className="h-8 w-8 animate-spin text-slate-600" />
        )}
      </div>

      {/* Progress Message */}
      <div className="text-center">
        <p className="text-sm font-medium text-slate-700">{displayMessage}</p>
        {showTimeEstimate && step !== 'complete' && (
          <div className="mt-1 space-y-1">
            {estimatedTimeRemaining !== null && estimatedTimeRemaining > 0 && (
              <p className="text-xs text-slate-500">
                Ước tính còn lại: {formatTime(estimatedTimeRemaining)}
              </p>
            )}
            {timeElapsed > 0 && (
              <p className="text-xs text-slate-400">
                Đã mất: {formatTime(timeElapsed)}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Progress Bar */}
      <div className="w-full max-w-xs space-y-1">
        <Progress value={progress} className="h-2" />
        {totalSteps && currentStep !== undefined && (
          <p className="text-xs text-center text-slate-500">
            Bước {currentStep} / {totalSteps}
          </p>
        )}
      </div>
    </div>
  );
}

