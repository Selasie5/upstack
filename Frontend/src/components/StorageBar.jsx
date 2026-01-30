import { Progress } from './ui/progress';
import { HardDrive } from 'lucide-react';

export function StorageBar({ used, total }) {
  const percentage = (used / total) * 100;
  const isNearLimit = percentage > 80;
  
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow duration-200">
      <div className="flex items-center gap-3 mb-4">
        <div className="rounded-lg bg-blue-100 p-2">
          <HardDrive className={`h-4 w-4 ${isNearLimit ? 'text-red-600' : 'text-blue-600'}`} />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-medium text-gray-900\">Storage</h3>
          <p className="text-xs text-gray-500\">
            {used} GB of {total} GB
          </p>
        </div>
      </div>
      <Progress 
        value={percentage} 
        className={`h-2.5 ${isNearLimit ? '[&>div]:bg-red-600' : ''}`}
      />
      <p className="text-xs text-gray-500 mt-3 text-right\">
        {(total - used).toFixed(1)} GB remaining
      </p>
    </div>
  );
}
