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

export function FileList({ items, onItemClick, onDownload, onDelete, onShare }) {
  return (
    <div className="bg-white border border-border rounded-sm shadow-sm overflow-hidden">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-muted/30 border-b border-border">
            <th className="px-6 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Name</th>
            <th className="px-6 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider hidden md:table-cell">Last Modified</th>
            <th className="px-6 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider text-right">Size</th>
            <th className="px-6 py-3 w-10"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {items.map((item) => {
            const fileInfo = item.type === 'file' ? getFileIcon(item.name) : null;
            const IconComponent = item.type === 'folder' ? Folder : (fileInfo?.icon || File);
            const iconColor = item.type === 'folder' ? 'text-primary' : (fileInfo?.color || 'text-muted-foreground');
            const bgColor = item.type === 'folder' ? 'bg-primary/10' : (fileInfo?.bg || 'bg-muted/50');

            return (
              <tr
                key={item.id}
                className="group hover:bg-muted/30 transition-colors cursor-pointer"
                onClick={() => onItemClick(item)}
              >
                <td className="px-6 py-3.5">
                  <div className="flex items-center gap-3">
                    <div className={cn("h-9 w-9 rounded-sm flex items-center justify-center border border-border/50 shadow-sm", bgColor)}>
                      <IconComponent className={cn("h-4.5 w-4.5", iconColor)} strokeWidth={1.5} />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
                        {item.name}
                      </span>
                      <div className="flex items-center gap-2 mt-0.5">
                        {item.raw?.shared_with?.length > 0 && (
                          <div className="flex items-center gap-1">
                            <Users className="h-3 w-3 text-muted-foreground" />
                            <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-tight">Shared</span>
                          </div>
                        )}
                        {item.raw?.version && (
                          <div className="flex items-center gap-1">
                            <span className="text-[10px] text-muted-foreground/60 font-medium">v{item.raw.version}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-3.5 hidden md:table-cell">
                  <span className="text-xs text-muted-foreground font-medium">
                    {item.modified}
                  </span>
                </td>
                <td className="px-6 py-3.5 text-right">
                  <span className="text-xs text-muted-foreground font-semibold">
                    {item.type === 'file' ? item.size : '—'}
                  </span>
                </td>
                <td className="px-6 py-3.5 text-right">
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
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
