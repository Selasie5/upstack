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
    <div className="space-y-3">
      {items.map((item) => {
        const fileInfo = item.type === 'file' ? getFileIcon(item.name) : null;
        const IconComponent = item.type === 'folder' ? Folder : (fileInfo?.icon || File);
        const iconColor = item.type === 'folder' ? 'text-blue-600' : fileInfo?.color;
        const bgColor = item.type === 'folder' ? 'bg-gradient-to-br from-blue-100 to-blue-50' : fileInfo?.bg;

        return (
          <div
            key={item.id}
            className="group flex items-center justify-between rounded-xl border border-gray-200 bg-white p-3 sm:p-4 shadow-sm hover:bg-blue-50 hover:shadow-lg hover:border-blue-300 transition-all duration-200 cursor-pointer hover:-translate-y-0.5"
            onClick={() => onItemClick(item)}
          >
            <div className="flex items-center space-x-3 flex-1 min-w-0">
              <div className={`rounded-lg p-2 sm:p-2.5 ${bgColor} shrink-0`}>
                <IconComponent className={`h-5 w-5 sm:h-6 sm:w-6 ${iconColor}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm sm:text-base truncate">{item.name}</p>
                <p className="text-xs sm:text-sm text-gray-500">{item.modified}</p>
              </div>
              {item.type === 'file' && item.size && (
                <div className="text-xs sm:text-sm text-gray-500 hidden md:block shrink-0">
                  {item.size}
                </div>
              )}
            </div>

            <div className="ml-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent 
                  align="end" 
                  className="min-w-45 bg-white border-2 shadow-xl z-50"
                  sideOffset={8}
                >
                  {item.type === 'file' && (
                    <DropdownMenuItem onClick={(e) => {
                      e.stopPropagation();
                      onDownload(item);
                    }}>
                      <Download className="mr-2 h-4 w-4" />
                      Download
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={(e) => {
                    e.stopPropagation();
                    onShare(item);
                  }}>
                    <Share2 className="mr-2 h-4 w-4" />
                    Share
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(item);
                    }}
                    className="text-red-600"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        );
      })}
    </div>
  );
}
