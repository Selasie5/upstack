import {
  File,
  Folder,
  MoreVertical,
  Download,
  Trash2,
  Share2,
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
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-4 sm:gap-5 lg:gap-6">
      {items.map((item) => {
        const fileInfo =
          item.type === "file" ? getFileIcon(item.name) : null;
        const IconComponent =
          item.type === "folder"
            ? Folder
            : fileInfo?.icon || File;
        const iconColor =
          item.type === "folder"
            ? "text-blue-600 dark:text-blue-400"
            : fileInfo?.color;
        const bgColor =
          item.type === "folder"
            ? "bg-gradient-to-br from-blue-100 to-blue-50"
            : fileInfo?.bg;

        return (
          <div
            key={item.id}
            className="group relative rounded-xl border border-gray-200 bg-white shadow-sm hover:shadow-lg hover:border-blue-300 transition-all duration-200 cursor-pointer overflow-hidden hover:scale-105"
            onClick={() => onItemClick(item)}
          >
            <div className="absolute top-2 right-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity z-10">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="secondary"
                    size="icon"
                    className="h-7 w-7 shadow-sm"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MoreVertical className="h-3.5 w-3.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="min-w-45 bg-gray-950 border-2 shadow-xl z-50"
                  sideOffset={8}
                >
                  {item.type === "file" && (
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        onDownload(item);
                      }}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Download
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      onShare(item);
                    }}
                  >
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

            <div className="p-4 flex flex-col items-center space-y-3">
              <div
                className={`rounded-xl p-4 ${bgColor} group-hover:scale-110 transition-transform duration-200`}
              >
                <IconComponent
                  className={`h-10 w-10 sm:h-12 sm:w-12 ${iconColor}`}
                />
              </div>
              <div className="text-center w-full px-1">
                <p className="text-xs sm:text-sm truncate">
                  {item.name}
                </p>
                {item.type === "file" && item.size && (
                  <p className="text-xs text-gray-500 mt-1">
                    {item.size}
                  </p>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
