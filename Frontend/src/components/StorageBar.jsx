import { Progress } from './ui/progress';
import { HardDrive } from 'lucide-react';

export function StorageBar({ used, total, variant = "default" }) {
  const percentage = (used / total) * 100;
  const isNearLimit = percentage > 80;

  if (variant === "adorned") {
    return (
      <div className="space-y-3 px-3">
        <div className="flex items-end justify-between px-1">
          <div className="space-y-0.5">
            <p className="text-[9px] font-black text-rose-200 uppercase tracking-widest">Node Storage</p>
            <p className="text-xs font-black text-white">{used}GB / {total}GB</p>
          </div>
        </div>
        <div className="h-1.5 w-full bg-black/20 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-1000 ${isNearLimit ? 'bg-amber-400' : 'bg-white'}`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-3xl border border-slate-200/50 bg-slate-50/50 p-5 shadow-sm transition-all hover:bg-white hover:shadow-md group">
      <div className="flex items-center gap-3.5 mb-4">
        <div className={`rounded-xl p-2.5 shadow-sm transition-colors ${isNearLimit ? 'bg-red-50' : 'bg-white'}`}>
          <HardDrive className={`h-4.5 w-4.5 transition-colors ${isNearLimit ? 'text-red-500' : 'text-blue-600'}`} strokeWidth={2} />
        </div>
        <div className="flex-1 overflow-hidden">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] leading-none mb-1.5">Storage Overview</h3>
          <div className="flex items-baseline gap-1.5">
            <span className="text-sm font-black text-slate-900 leading-none">{used}</span>
            <span className="text-[10px] font-bold text-slate-400 uppercase">GB of {total} GB used</span>
          </div>
        </div>
      </div>

      <div className="relative pt-1 px-0.5">
        <Progress
          value={percentage}
          className={`h-2 rounded-full bg-slate-200/60 overflow-hidden ${isNearLimit ? '[&>div]:bg-red-500' : '[&>div]:bg-blue-600'}`}
        />
      </div>

      <div className="flex items-center justify-between mt-4">
        <div className="flex items-center gap-1.5">
          <div className={`h-1.5 w-1.5 rounded-full ${isNearLimit ? 'bg-red-500 animate-pulse' : 'bg-blue-600'}`} />
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">
            {isNearLimit ? 'Critically Low' : 'System Optimized'}
          </p>
        </div>
        <p className="text-[10px] font-black text-slate-900 bg-white px-2 py-0.5 rounded-lg border border-slate-100 shadow-sm">
          {percentage.toFixed(0)}%
        </p>
      </div>
    </div>
  );
}
