interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
  count?: number;
}

export function Skeleton({
  className = '',
  variant = 'text',
  width,
  height,
  count = 1,
}: SkeletonProps) {
  const baseClasses = 'animate-pulse bg-gray-200 dark:bg-gray-700';

  const variantClasses = {
    text: 'rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-lg',
  };

  const style: React.CSSProperties = {};
  if (width) style.width = typeof width === 'number' ? `${width}px` : width;
  if (height) style.height = typeof height === 'number' ? `${height}px` : height;

  if (count === 1) {
    return (
      <div
        className={`${baseClasses} ${variantClasses[variant]} ${className}`}
        style={style}
      />
    );
  }

  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={`${baseClasses} ${variantClasses[variant]} ${className}`}
          style={style}
        />
      ))}
    </>
  );
}

// Pre-built skeleton layouts
export function ClientCardSkeleton() {
  return (
    <div className="glass-card p-5 space-y-4">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Skeleton variant="circular" width={40} height={40} />
          <div className="space-y-2">
            <Skeleton width={120} height={16} />
            <Skeleton width={180} height={12} />
          </div>
        </div>
        <Skeleton width={60} height={24} className="rounded-full" />
      </div>
      <div className="space-y-2">
        <Skeleton height={8} className="w-full" />
        <Skeleton height={8} className="w-3/4" />
      </div>
      <div className="flex gap-2">
        <Skeleton width={80} height={28} className="rounded-full" />
        <Skeleton width={80} height={28} className="rounded-full" />
      </div>
    </div>
  );
}

export function TaskItemSkeleton() {
  return (
    <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
      <Skeleton variant="circular" width={20} height={20} />
      <div className="flex-1 space-y-2">
        <Skeleton width="60%" height={14} />
        <Skeleton width="40%" height={10} />
      </div>
      <Skeleton width={60} height={20} />
    </div>
  );
}

export function DashboardStatsSkeleton() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="glass-card p-6">
          <div className="flex items-center gap-4">
            <Skeleton variant="rectangular" width={48} height={48} />
            <div className="space-y-2">
              <Skeleton width={80} height={12} />
              <Skeleton width={60} height={24} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function TableRowSkeleton({ columns = 4 }: { columns?: number }) {
  return (
    <tr>
      {Array.from({ length: columns }).map((_, i) => (
        <td key={i} className="py-3 px-4">
          <Skeleton width={i === 0 ? '80%' : '60%'} height={16} />
        </td>
      ))}
    </tr>
  );
}
