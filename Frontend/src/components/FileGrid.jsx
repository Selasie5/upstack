import {
  File,
  Folder,
  MoreVertical,
  Download,
  Trash2,
  Share2,
  ExternalLink,
  Users,
} from "lucide-react";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { getFileIcon } from "./fileIconUtils";

export function FileGrid({
  items,
  onItemClick,
  onDownload,
  onDelete,
  onShare,
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {items.map((item) => {
        const fileInfo = item.type === "file" ? getFileIcon(item.name) : null;
        const IconComponent = item.type === "folder" ? Folder : fileInfo?.icon || File;
        const iconColor = item.type === "folder" ? "text-blue-600" : (fileInfo?.color || "text-slate-500");
        const bgColor = item.type === "folder" ? "bg-blue-50" : (fileInfo?.bg || "bg-slate-100");

        return (
          <div
            key={item.id}
            className="group relative bg-white border border-slate-200/60 rounded-3xl p-6 hover:border-blue-400/50 hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all duration-300 animate-in fade-in zoom-in-95 cursor-pointer"
            onClick={() => onItemClick(item)}
          >
            <div className="flex items-start justify-between mb-8">
              <div className={`h-16 w-16 rounded-[22px] ${bgColor} flex items-center justify-center transition-all group-hover:scale-105 duration-500 group-hover:shadow-lg group-hover:shadow-blue-500/5`}>
                <IconComponent className={`h-8 w-8 ${iconColor}`} strokeWidth={1.5} />
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="rounded-xl opacity-0 group-hover:opacity-100 transition-opacity bg-slate-50 border border-slate-100"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MoreVertical className="h-4.5 w-4.5 text-slate-400" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="p-1.5 rounded-2xl min-w-[160px] shadow-2xl shadow-slate-200/50 border-slate-200/60">
                  {item.type === "file" && (
                    <DropdownMenuItem
                      className="rounded-xl font-bold text-xs gap-3 py-2.5"
                      onClick={(e) => { e.stopPropagation(); onDownload(item); }}
                    >
                      <Download className="h-4 w-4 text-slate-400" />
                      Download Object
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem
                    className="rounded-xl font-bold text-xs gap-3 py-2.5"
                    onClick={(e) => { e.stopPropagation(); onShare(item); }}
                  >
                    <Share2 className="h-4 w-4 text-slate-400" />
                    Share Access
                  </DropdownMenuItem>
                  <div className="h-px bg-slate-100 my-1.5 mx-1" />
                  <DropdownMenuItem
                    className="rounded-xl font-bold text-xs gap-3 py-2.5 text-red-600 focus:bg-red-50 focus:text-red-700"
                    onClick={(e) => { e.stopPropagation(); onDelete(item); }}
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete Resource
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="space-y-1.5">
              <h4 className="text-base font-black text-slate-900 truncate tracking-tight group-hover:text-blue-600 transition-colors">{item.name}</h4>
              <div className="flex items-center gap-2 text-slate-400 font-bold text-[10px] uppercase tracking-wider">
                <span>{item.type === "file" ? item.size : 'Virtual Directory'}</span>
                <span className="w-1 h-1 rounded-full bg-slate-200"></span>
                <span>{item.modified}</span>
              </div>
            </div>

            <div className="mt-8 flex items-center justify-between pt-5 border-t border-slate-50">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-tight">Synchronized</span>
              </div>

              {(item.raw?.shared_with?.length > 0) ? (
                <div className="flex -space-x-3">
                  {item.raw.shared_with.slice(0, 3).map((u, i) => (
                    <div key={i} className="h-7 w-7 rounded-full bg-white border-2 border-slate-50 shadow-sm flex items-center justify-center text-[10px] font-black text-blue-600" title={u}>
                      {u[0].toUpperCase()}
                    </div>
                  ))}
                  {item.raw.shared_with.length > 3 && (
                    <div className="h-7 w-7 rounded-full bg-slate-50 border-2 border-white flex items-center justify-center text-[8px] font-black text-slate-400">
                      +{item.raw.shared_with.length - 3}
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-slate-300">
                  <Users className="h-3.5 w-3.5" />
                  <span className="text-[10px] font-bold">Private</span>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
