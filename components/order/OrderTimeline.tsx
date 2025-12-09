'use client';

interface OrderTimelineProps {
  status: string;
  date: string | null;
  dateCompleted: string | null;
}

export function OrderTimeline({
  status,
  date,
  dateCompleted,
}: OrderTimelineProps) {
  const timelineSteps = [
    {
      key: 'PENDING',
      label: 'Đơn hàng đã được đặt',
      date: date,
      active: ['PENDING', 'PROCESSING', 'ON_HOLD', 'COMPLETED'].includes(status),
      completed: !['PENDING'].includes(status),
    },
    {
      key: 'PROCESSING',
      label: 'Đang xử lý',
      date: null,
      active: ['PROCESSING', 'ON_HOLD', 'COMPLETED'].includes(status),
      completed: ['COMPLETED'].includes(status),
    },
    {
      key: 'SHIPPING',
      label: 'Đang vận chuyển',
      date: null,
      active: ['COMPLETED'].includes(status),
      completed: ['COMPLETED'].includes(status),
    },
    {
      key: 'COMPLETED',
      label: 'Hoàn thành',
      date: dateCompleted,
      active: ['COMPLETED'].includes(status),
      completed: ['COMPLETED'].includes(status),
    },
  ];

  return (
    <div className="space-y-4">
      <h3 className="font-heading text-lg font-semibold mb-4">
        Trạng thái đơn hàng
      </h3>
      <div className="relative">
        {timelineSteps.map((step, index) => {
          const isLast = index === timelineSteps.length - 1;
          const isActive = step.active;
          const isCompleted = step.completed;

          return (
            <div key={step.key} className="relative flex gap-4 pb-6">
              {/* Timeline line */}
              {!isLast && (
                <div
                  className={`absolute left-3 top-8 w-0.5 h-full ${
                    isCompleted ? 'bg-primary' : 'bg-muted'
                  }`}
                />
              )}

              {/* Timeline dot */}
              <div
                className={`relative z-10 flex-shrink-0 w-6 h-6 rounded-full border-2 ${
                  isCompleted
                    ? 'bg-primary border-primary'
                    : isActive
                    ? 'bg-primary/20 border-primary'
                    : 'bg-background border-muted'
                }`}
              >
                {isCompleted && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <svg
                      className="w-3 h-3 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                )}
              </div>

              {/* Timeline content */}
              <div className="flex-1 min-w-0">
                <p
                  className={`font-medium ${
                    isActive ? 'text-text-main' : 'text-text-muted'
                  }`}
                >
                  {step.label}
                </p>
                {step.date && (
                  <p className="text-xs text-text-muted mt-1">
                    {new Date(step.date).toLocaleDateString('vi-VN', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

