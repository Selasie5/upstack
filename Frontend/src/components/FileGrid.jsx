import {
  File,
  Folder,
  MoreVertical,
  Download,
  Trash2,
  Share2,
  Users,
  Eye
} from 'lucide-react';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from './ui/dropdown-menu';
import { getFileIcon } from './fileIconUtils';
import { cn } from '../lib/utils';

export function FileGrid({ items, onItemClick, onDownload, onDelete, onShare }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {items.map((item) => {
        const fileInfo = item.type === 'file' ? getFileIcon(item.name) : null;
        const IconComponent = item.type === 'folder' ? Folder : (fileInfo?.icon || File);
        const iconColor = item.type === 'folder' ? 'text-primary' : (fileInfo?.color || 'text-muted-foreground');
        const bgColor = item.type === 'folder' ? 'bg-primary/10' : (fileInfo?.bg || 'bg-muted/50');

        return (
          <div
            key={item.id}
            className="group relative bg-white border border-border rounded-sm p-4 hover:border-primary/30 hover:shadow-md transition-all cursor-pointer"
            onClick={() => onItemClick(item)}
          >
            <div className="flex items-start justify-between mb-4">
              <div className={cn("h-12 w-12 rounded-sm flex items-center justify-center border border-border/50", bgColor)}>
                <IconComponent className={cn("h-6 w-6", iconColor)} strokeWidth={1.5} />
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MoreVertical className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onItemClick(item); }}>
                    <Eye className="mr-2 h-4 w-4" /> View Details
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onDownload(item); }}>
                    <Download className="mr-2 h-4 w-4" /> Download
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onShare(item); }}>
                    <Share2 className="mr-2 h-4 w-4" /> Share
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive focus:bg-destructive/10"
                    onClick={(e) => { e.stopPropagation(); onDelete(item); }}
                  >
                    <Trash2 className="mr-2 h-4 w-4" /> Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                {item.name}
              </h3>
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-muted-foreground font-medium uppercase tracking-tight">
                  {item.type === 'file' ? item.size : 'Folder'}
                </span>
                <span className="text-[11px] text-muted-foreground font-medium">
                  {item.modified}
                </span>
              </div>
            </div>

            {item.raw?.shared_with?.length > 0 && (
              <div className="mt-3 pt-3 border-t border-border/50 flex items-center gap-1.5">
                <Users className="h-3 w-3 text-primary" />
                <span className="text-[10px] font-bold text-primary uppercase tracking-widest">Shared Object</span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
