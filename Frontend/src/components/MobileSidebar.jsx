import { 
  Home,
  Clock,
  Star,
  Trash2,
  Users,
  Upload,
  FolderPlus
} from 'lucide-react';
import { Button } from './ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from './ui/sheet';
import { StorageBar } from './StorageBar';

export function MobileSidebar({
  open,
  onOpenChange,
  activeSection,
  onSectionChange,
  onUploadClick,
  onNewFolderClick,
}) {
  const sidebarItems = [
    { id: 'my-files', label: 'My Files', icon: Home },
    { id: 'recent', label: 'Recent', icon: Clock },
    { id: 'starred', label: 'Starred', icon: Star },
    { id: 'shared', label: 'Shared with me', icon: Users },
    { id: 'trash', label: 'Trash', icon: Trash2 },
  ];

  const handleSectionClick = (section) => {
    onSectionChange(section);
    onOpenChange(false);
  };

  const handleUploadClick = () => {
    onUploadClick();
    onOpenChange(false);
  };

  const handleNewFolderClick = () => {
    onNewFolderClick();
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-70 p-0">
        <div className="flex flex-col h-full p-4">
          <SheetHeader className="mb-6">
            <SheetTitle className="text-left">
              <h1 className="text-xl mb-1">FileStorage</h1>
              <p className="text-xs text-gray-500">Cloud Storage</p>
            </SheetTitle>
          </SheetHeader>

          <div className="space-y-2 mb-6">
            <Button 
              className="w-full justify-start" 
              onClick={handleUploadClick}
            >
              <Upload className="mr-2 h-4 w-4" />
              Upload Files
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={handleNewFolderClick}
            >
              <FolderPlus className="mr-2 h-4 w-4" />
              New Folder
            </Button>
          </div>

          <nav className="space-y-1 flex-1">
            {sidebarItems.map((item) => {
              const Icon = item.icon;
              return (
                <Button
                  key={item.id}
                  variant={activeSection === item.id ? 'secondary' : 'ghost'}
                  className="w-full justify-start"
                  onClick={() => handleSectionClick(item.id)}
                >
                  <Icon className="mr-2 h-4 w-4" />
                  {item.label}
                </Button>
              );
            })}
          </nav>

          <div className="mt-auto">
            <StorageBar used={42.5} total={100} />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
