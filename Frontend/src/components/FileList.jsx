import {
  File,
  Folder,
  MoreVertical,
  Download,
  Trash2,
  Share2,
} from 'lucide-react';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { getFileIcon } from './fileIconUtils';

export function FileList({ items, onItemClick, onDownload, onDelete, onShare }) {
  return (
    <div className="bg-white border border-slate-200/60 rounded-[24px] shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="grid grid-cols-12 gap-4 px-8 py-4 bg-slate-50/50 text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100">
        <div className="col-span-6">Resource Name</div>
        <div className="col-span-3">Last Modified</div>
        <div className="col-span-2 text-right">File Size</div>
        <div className="col-span-1"></div>
      </div>
      <div className="divide-y divide-slate-50">
        {items.map((item) => {
          const fileInfo = item.type === 'file' ? getFileIcon(item.name) : null;
          const IconComponent = item.type === 'folder' ? Folder : (fileInfo?.icon || File);
          const iconColor = item.type === 'folder' ? 'text-blue-600' : (fileInfo?.color || 'text-slate-500');
          const bgColor = item.type === 'folder' ? 'bg-blue-50' : (fileInfo?.bg || 'bg-slate-100');

          return (
            <div
              key={item.id}
              className="grid grid-cols-12 gap-4 px-8 py-4 items-center hover:bg-slate-50/80 transition-all cursor-pointer group"
              onClick={() => onItemClick(item)}
            >
              <div className="col-span-6 flex items-center gap-4 overflow-hidden">
                <div className={`h-11 w-11 rounded-2xl shrink-0 border border-slate-100 flex items-center justify-center transition-transform group-hover:scale-105 ${bgColor}`}>
                  <IconComponent className={`h-5 w-5 ${iconColor}`} strokeWidth={1.5} />
                </div>
                <span className="text-sm font-bold text-slate-900 truncate tracking-tight group-hover:text-blue-600 transition-colors">
                  {item.name}
                </span>
              </div>
              <div className="col-span-3 text-sm text-slate-500 font-semibold tracking-tight">
                {item.modified}
              </div>
              <div className="col-span-2 text-sm text-slate-400 text-right font-black tracking-tight">
                {item.type === 'file' ? item.size : '—'}
              </div>
              <div className="col-span-1 text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="opacity-0 group-hover:opacity-100 rounded-xl bg-white border border-slate-200 transition-all"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MoreVertical className="h-4.5 w-4.5 text-slate-400" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="min-w-[180px] p-1.5 rounded-2xl shadow-2xl shadow-slate-200/50 border-slate-200/60"
                    sideOffset={8}
                  >
                    {item.type === 'file' && (
                      <DropdownMenuItem
                        className="rounded-xl font-bold text-xs gap-3 py-2.5"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDownload(item);
                        }}
                      >
                        <Download className="h-4 w-4 text-slate-400" />
                        Download Object
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem
                      className="rounded-xl font-bold text-xs gap-3 py-2.5"
                      onClick={(e) => {
                        e.stopPropagation();
                        onShare(item);
                      }}
                    >
                      <Users className="h-4 w-4 text-slate-400" />
                      Grant Access
                    </DropdownMenuItem>
                    <div className="h-px bg-slate-100 my-1.5 mx-1" />
                    <DropdownMenuItem
                      className="rounded-xl font-bold text-xs gap-3 py-2.5 text-red-600 focus:bg-red-50 focus:text-red-700"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(item);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete Resource
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
