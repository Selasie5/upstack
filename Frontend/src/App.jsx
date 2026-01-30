import { useState } from 'react';
import { 
  Search, 
  Grid3x3, 
  List, 
  Upload, 
  FolderPlus, 
  ChevronRight,
  Home,
  Star,
  Clock,
  Trash2 as TrashIcon, 
  Users,
  Menu,
} from 'lucide-react';
import { Button } from './components/ui/button';
import { Input } from './components/ui/input';
import { FileGrid } from './components/FileGrid';
import { FileList } from './components/FileList';
import { StorageBar } from './components/StorageBar';
import { UploadDialog } from './components/UploadDialog';
import { NewFolderDialog } from './components/NewFolderDialog';
import { MobileSidebar } from './components/MobileSidebar';
import { toast, Toaster } from 'sonner';

export default function App() {
  const [viewMode, setViewMode] = useState('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [folderDialogOpen, setFolderDialogOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currentPath, setCurrentPath] = useState(['My Files']);
  const [activeSection, setActiveSection] = useState('my-files');

  const [items, setItems] = useState([
    {
      id: '1',
      name: 'Projects',
      type: 'folder',
      modified: '2 days ago',
    },
    {
      id: '2',
      name: 'Documents',
      type: 'folder',
      modified: '1 week ago',
    },
    {
      id: '3',
      name: 'Presentation.pptx',
      type: 'file',
      size: '4.2 MB',
      modified: '3 hours ago',
    },
    {
      id: '4',
      name: 'Budget-2025.xlsx',
      type: 'file',
      size: '1.8 MB',
      modified: '1 day ago',
    },
    {
      id: '5',
      name: 'Design-mockups.fig',
      type: 'file',
      size: '12.5 MB',
      modified: '2 days ago',
    },
    {
      id: '6',
      name: 'Photos',
      type: 'folder',
      modified: '1 week ago',
    },
    {
      id: '7',
      name: 'Meeting-notes.pdf',
      type: 'file',
      size: '856 KB',
      modified: '5 hours ago',
    },
    {
      id: '8',
      name: 'Report-Q4.docx',
      type: 'file',
      size: '2.1 MB',
      modified: '3 days ago',
    },
    {
      id: '9',
      name: 'vacation-photo.jpg',
      type: 'file',
      size: '3.4 MB',
      modified: '4 days ago',
    },
    {
      id: '10',
      name: 'intro-video.mp4',
      type: 'file',
      size: '25.6 MB',
      modified: '1 week ago',
    },
    {
      id: '11',
      name: 'app.js',
      type: 'file',
      size: '45 KB',
      modified: '2 hours ago',
    },
    {
      id: '12',
      name: 'archive.zip',
      type: 'file',
      size: '18.2 MB',
      modified: '3 days ago',
    },
  ]);

  const filteredItems = items.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getSectionContent = () => {
    let sectionItems = filteredItems;
    
    switch (activeSection) {
      case 'recent':
        sectionItems = filteredItems.filter(item => item.type === 'file');
        break;
      case 'starred':
        sectionItems = [];
        break;
      case 'shared':
        sectionItems = [];
        break;
      case 'trash':
        sectionItems = [];
        break;
      case 'my-files':
      default:
        sectionItems = filteredItems;
        break;
    }
    
    return sectionItems;
  };

  const displayItems = getSectionContent();

  const getSectionEmptyMessage = () => {
    switch (activeSection) {
      case 'recent':
        return 'No recent files';
      case 'starred':
        return 'No starred items yet';
      case 'shared':
        return 'No shared files';
      case 'trash':
        return 'Trash is empty';
      default:
        return searchQuery ? 'No files found' : 'No files yet';
    }
  };

  const getSectionEmptyDescription = () => {
    switch (activeSection) {
      case 'recent':
        return 'Files you\'ve recently accessed will appear here';
      case 'starred':
        return 'Star files and folders to find them quickly';
      case 'shared':
        return 'Files shared with you will appear here';
      case 'trash':
        return 'Deleted items will be stored here for 30 days';
      default:
        return searchQuery 
          ? 'Try adjusting your search terms or browse your files' 
          : 'Get started by uploading your first file or creating a folder';
    }
  };

  const handleItemClick = (item) => {
    if (item.type === 'folder') {
      setCurrentPath([...currentPath, item.name]);
      toast.success(`Opened ${item.name}`);
    } else {
      toast.info(`Opening ${item.name}`);
    }
  };

  const handleDownload = (item) => {
    toast.success(`Downloading ${item.name}`);
  };

  const handleDelete = (item) => {
    setItems(items.filter(i => i.id !== item.id));
    toast.success(`${item.name} moved to trash`);
  };

  const handleShare = (item) => {
    toast.success(`Share link copied for ${item.name}`);
  };

  const handleUpload = (files) => {
    const newItems = files.map((file, index) => ({
      id: `upload-${Date.now()}-${index}`,
      name: file.name,
      type: 'file',
      size: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
      modified: 'Just now',
    }));
    setItems([...newItems, ...items]);
    toast.success(`Uploaded ${files.length} file${files.length > 1 ? 's' : ''}`);
  };

  const handleCreateFolder = (name) => {
    const newFolder = {
      id: `folder-${Date.now()}`,
      name,
      type: 'folder',
      modified: 'Just now',
    };
    setItems([newFolder, ...items]);
    toast.success(`Created folder "${name}"`);
  };

  const handleBreadcrumbClick = (index) => {
    setCurrentPath(currentPath.slice(0, index + 1));
  };

  const sidebarItems = [
    { id: 'my-files', label: 'My Files', icon: Home },
    { id: 'recent', label: 'Recent', icon: Clock },
    { id: 'starred', label: 'Starred', icon: Star },
    { id: 'shared', label: 'Shared with me', icon: Users },
    { id: 'trash', label: 'Trash', icon: TrashIcon },
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 xl:w-72 border-r border-gray-200 bg-white/80 backdrop-blur-sm p-8 flex-col gap-6 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold mb-1 text-blue-600">
            FileStorage
          </h1>
          <p className="text-xs text-gray-500 font-medium">Secure Cloud Storage</p>
        </div>

        <div className="flex flex-col gap-3 mb-18">
          <Button 
            className="w-full flex justify-start shadow-md px-4 hover:shadow-lg transition-all duration-200" 
            onClick={() => setUploadDialogOpen(true)}
          >
            <Upload className="mr-2 h-4 w-4" />
            Upload Files
          </Button>
          <Button 
            variant="outline" 
            className="w-full flex justify-start hover:bg-gray-100"
            onClick={() => setFolderDialogOpen(true)}
          >
            <FolderPlus className="mr-2 h-4 w-4" />
            New Folder
          </Button>
        </div>

        <nav className="space-y-2.5 flex-1 mt-18">
          {sidebarItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            return (
              <Button
                key={item.id}
                variant={isActive ? 'secondary' : 'ghost'}
                className={`w-full justify-start transition-all duration-150 ${
                  isActive ? 'shadow-sm bg-blue-50 border border-blue-200 text-blue-700' : ''
                }`}
                onClick={() => setActiveSection(item.id)}
              >
                <Icon className="mr-2 h-4 w-4" />
                {item.label}
              </Button>
            );
          })}
        </nav>

        <div className="mt-auto pt-6 border-t border-gray-200">
          <StorageBar used={42.5} total={100} />
        </div>
      </aside>

      {/* Mobile Sidebar */}
      <MobileSidebar
        open={mobileMenuOpen}
        onOpenChange={setMobileMenuOpen}
        activeSection={activeSection}
        onSectionChange={setActiveSection}
        onUploadClick={() => setUploadDialogOpen(true)}
        onNewFolderClick={() => setFolderDialogOpen(true)}
      />

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="border-b border-gray-200 bg-white/80 backdrop-blur-sm shadow-sm">
          <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-5">
            <div className="flex items-center justify-between gap-3 sm:gap-4 mb-4">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                {/* Mobile Menu Button */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="lg:hidden"
                  onClick={() => setMobileMenuOpen(true)}
                >
                  <Menu className="h-5 w-5" />
                </Button>

                {/* Breadcrumb */}
                <div className="flex items-center space-x-1 sm:space-x-2 text-xs sm:text-sm overflow-x-auto">
                  {currentPath.map((path, index) => (
                    <div key={index} className="flex items-center shrink-0">
                      {index > 0 && <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4 mx-0.5 sm:mx-1 text-gray-500" />}
                      <button
                        onClick={() => handleBreadcrumbClick(index)}
                        className="hover:text-blue-600 transition-colors whitespace-nowrap"
                      >
                        {path}
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* View Toggle */}
              <div className="flex items-center gap-4 mt-8 sm:gap-3">
                <Button
                  variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                  size="icon"
                  className="h-8 w-8 sm:h-9 sm:w-9"
                  onClick={() => setViewMode('grid')}
                >
                  <Grid3x3 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                  size="icon"
                  className="h-8 w-8 sm:h-9 sm:w-9"
                  onClick={() => setViewMode('list')}
                >
                  <List className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                </Button>
              </div>
            </div>

            {/* Search Bar */}
            <div className="flex items-center gap-2 px-6 mb-8 border-b-2 border-blue-600 rounded-2xl">
              <Search className=" h-4 w-4 text-gray-500" />
              <input
                type="search"
                placeholder="Search files and folders..."
                className="h-10 sm:h-11 w-full focus:outline-none"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Mobile Action Buttons */}
          <div className="px-4 sm:px-6 lg:px-8 pb-4 flex gap-2 border-t border-gray-100 lg:hidden">
            <Button 
              className="flex-1 text-xs sm:text-sm h-9 shadow-sm"
              onClick={() => setUploadDialogOpen(true)}
            >
              <Upload className="mr-1.5 h-3.5 w-3.5" />
              Upload
            </Button>
            <Button 
              variant="outline" 
              className="flex-1 text-xs sm:text-sm h-9"
              onClick={() => setFolderDialogOpen(true)}
            >
              <FolderPlus className="mr-1.5 h-3.5 w-3.5" />
              New Folder
            </Button>
          </div>
        </header>

        {/* File Content Area */}
        <div className="flex-1 mt-8 overflow-auto bg-gradient-to-b from-gray-50 to-white">
          <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
            {displayItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full min-h-96 text-center px-4">
                <div className="rounded-full bg-blue-50 p-6 sm:p-8 mb-4 sm:mb-6">
                  {activeSection === 'trash' ? (
                    <TrashIcon className="h-12 w-12 sm:h-16 sm:w-16 text-blue-600" />
                  ) : activeSection === 'starred' ? (
                    <Star className="h-12 w-12 sm:h-16 sm:w-16 text-blue-600" />
                  ) : activeSection === 'shared' ? (
                    <Users className="h-12 w-12 sm:h-16 sm:w-16 text-blue-600" />
                  ) : activeSection === 'recent' ? (
                    <Clock className="h-12 w-12 sm:h-16 sm:w-16 text-blue-600" />
                  ) : (
                    <Upload className="h-12 w-12 sm:h-16 sm:w-16 text-blue-600" />
                  )}
                </div>
                <h3 className="text-base sm:text-lg mb-2">
                  {getSectionEmptyMessage()}
                </h3>
                <p className="text-xs sm:text-sm text-gray-500 mb-4 sm:mb-6 max-w-sm">
                  {getSectionEmptyDescription()}
                </p>
                {!searchQuery && activeSection === 'my-files' && (
                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                    <Button onClick={() => setUploadDialogOpen(true)} className="shadow-md">
                      <Upload className="mr-2 h-4 w-4" />
                      Upload Files
                    </Button>
                    <Button variant="outline" onClick={() => setFolderDialogOpen(true)}>
                      <FolderPlus className="mr-2 h-4 w-4" />
                      New Folder
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <>
                {viewMode === 'grid' ? (
                  <FileGrid
                    items={displayItems}
                    onItemClick={handleItemClick}
                    onDownload={handleDownload}
                    onDelete={handleDelete}
                    onShare={handleShare}
                  />
                ) : (
                  <FileList
                    items={displayItems}
                    onItemClick={handleItemClick}
                    onDownload={handleDownload}
                    onDelete={handleDelete}
                    onShare={handleShare}
                  />
                )}
              </>
            )}
          </div>
        </div>
      </main>

      {/* Dialogs */}
      <UploadDialog
        open={uploadDialogOpen}
        onOpenChange={setUploadDialogOpen}
        onUpload={handleUpload}
      />
      <NewFolderDialog
        open={folderDialogOpen}
        onOpenChange={setFolderDialogOpen}
        onCreateFolder={handleCreateFolder}
      />
      <Toaster richColors position="top-center" />
    </div>
  );
}
