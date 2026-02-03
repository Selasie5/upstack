import { useState, useEffect } from 'react';
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
  LogOut,
} from 'lucide-react';
import { Button } from './components/ui/button';
import { FileGrid } from './components/FileGrid';
import { FileList } from './components/FileList';
import { StorageBar } from './components/StorageBar';
import { UploadDialog } from './components/UploadDialog';
import { MobileSidebar } from './components/MobileSidebar';
import { ShareDialog } from './components/ShareDialog';
import { toast, Toaster } from 'sonner';
import { LoginPage } from './LoginPage';
import { api, auth, computeChunkHash, computeFileHash } from './services/api';

const CHUNK_SIZE = 4 * 1024 * 1024; // 4MB

export default function App() {
  const [user, setUser] = useState(auth.getUser());
  const [viewMode, setViewMode] = useState('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [fileToShare, setFileToShare] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [items, setItems] = useState([]);
  const [activeSection, setActiveSection] = useState('my-files');

  useEffect(() => {
    if (user) {
      loadFiles();
    }
  }, [user]);

  const loadFiles = async () => {
    try {
      const data = await api.listFiles();
      if (data.files) {
        const mapped = data.files.map(f => ({
          id: f.id,
          name: f.path, // Virtual paths
          type: 'file',
          size: formatBytes(f.size),
          modified: new Date(f.mod_time).toLocaleDateString(),
          raw: f
        }));
        setItems(mapped);
      }
    } catch (err) {
      toast.error("Failed to load files");
      console.error(err);
    }
  };

  const handleLogin = (userId) => {
    auth.login(userId);
    setUser(userId);
    toast.success(`Welcome, ${userId}`);
  };

  const handleLogout = () => {
    auth.logout();
    setUser(null);
  };

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleUpload = async (files) => {
    const toastId = toast.loading("Processing upload...");

    try {
      for (const file of files) {
        // 1. Chunking logic
        const chunks = [];
        const chunkCount = Math.ceil(file.size / CHUNK_SIZE);
        const chunkHashes = [];

        // Calculate Hashes
        for (let i = 0; i < chunkCount; i++) {
          const start = i * CHUNK_SIZE;
          const end = Math.min(start + CHUNK_SIZE, file.size);
          const blob = file.slice(start, end);
          const hash = await computeChunkHash(blob);
          chunks.push({ index: i, blob, hash, offset: start, size: blob.size });
          chunkHashes.push(hash);
        }

        const fullHash = await computeFileHash(file); // Compute full hash

        // 2. Check
        const { missing } = await api.checkChunks(chunkHashes);
        const missingSet = new Set(missing);

        // 3. Upload Missing
        let uploadedCount = 0;
        for (const chunk of chunks) {
          if (missingSet.has(chunk.hash)) {
            await api.uploadChunk(chunk.hash, chunk.blob);
            uploadedCount++;
          }
        }

        // 4. Metadata
        const meta = {
          id: `${Date.now()}-${file.name}`, // Simple ID gen
          path: file.name,
          size: file.size,
          mod_time: new Date().toISOString(),
          version: Date.now(),
          hash: fullHash,
          is_deleted: false,
          chunks: chunks.map(c => ({
            index: c.index,
            offset: c.offset,
            size: c.size,
            hash: c.hash
          }))
        };

        await api.commitMetadata(meta);
      }
      toast.dismiss(toastId);
      toast.success("Upload complete!");
      loadFiles();
    } catch (err) {
      toast.dismiss(toastId);
      toast.error("Upload failed: " + err.message);
    }
  };

  const handleDownload = async (item) => {
    const toastId = toast.loading("Downloading " + item.name);
    try {
      const meta = item.raw;
      // Download all chunks
      const blobs = [];
      // Sort chunks by index to be safe, though usually ordered
      const sortedChunks = (meta.chunks || []).sort((a, b) => a.index - b.index);

      for (const chunk of sortedChunks) {
        const blob = await api.downloadChunk(chunk.hash);
        blobs.push(blob);
      }

      // Combine
      const finalBlob = new Blob(blobs);
      const url = window.URL.createObjectURL(finalBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = item.name;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.dismiss(toastId);
      toast.success("Downloaded");
    } catch (e) {
      toast.dismiss(toastId);
      toast.error("Download failed");
      console.error(e);
    }
  };

  const handleShare = (item) => {
    setFileToShare(item);
    setShareDialogOpen(true);
  };

  const submitShare = async (userId) => {
    try {
      await api.share(fileToShare.id, userId);
      toast.success(`Shared ${fileToShare.name} with ${userId}`);
      setShareDialogOpen(false);
    } catch (e) {
      toast.error("Share failed: " + e.message);
    }
  };

  // --- Render Helpers ---

  const filteredItems = items.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const sidebarItems = [
    { id: 'my-files', label: 'My Files', icon: Home },
    { id: 'recent', label: 'Recent', icon: Clock },
    { id: 'starred', label: 'Starred', icon: Star },
    { id: 'shared', label: 'Shared with me', icon: Users },
    { id: 'trash', label: 'Trash', icon: TrashIcon },
  ];

  if (!user) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <div className="flex h-screen bg-gray-50 text-slate-900">
      {/* Sidebar */}
      <aside className="hidden lg:flex w-64 xl:w-72 border-r border-gray-200 bg-white/80 p-6 flex-col gap-6 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="bg-blue-600 rounded-lg p-1.5">
            <Home className="h-5 w-5 text-white" />
          </div>
          <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
            UpStack
          </h1>
        </div>

        <div className="flex flex-col gap-3">
          <Button
            className="w-full justify-start shadow-md bg-blue-600 hover:bg-blue-700 text-white"
            onClick={() => setUploadDialogOpen(true)}
          >
            <Upload className="mr-2 h-4 w-4" />
            Upload File
          </Button>
        </div>

        <nav className="space-y-1 flex-1">
          {sidebarItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            return (
              <Button
                key={item.id}
                variant={isActive ? 'secondary' : 'ghost'}
                className={`w-full justify-start ${isActive ? 'bg-blue-50 text-blue-700' : ''}`}
                onClick={() => setActiveSection(item.id)}
              >
                <Icon className="mr-2 h-4 w-4" />
                {item.label}
              </Button>
            );
          })}
        </nav>

        <div className="mt-auto border-t pt-4">
          <div className="mb-4 flex items-center justify-between">
            <span className="text-sm font-medium">{user}</span>
            <Button variant="ghost" size="icon" onClick={handleLogout} title="Logout">
              <LogOut className="h-4 w-4 text-gray-500 hover:text-red-500" />
            </Button>
          </div>
          <StorageBar used={0} total={100} />
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 flex flex-col overflow-hidden bg-white">
        <header className="border-b border-gray-100 p-4 flex items-center justify-between">
          <div className="relative w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-blue-100 outline-none transition-all"
              placeholder="Search files..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Button variant={viewMode === 'grid' ? 'secondary' : 'ghost'} size="icon" onClick={() => setViewMode('grid')}>
              <Grid3x3 className="h-4 w-4" />
            </Button>
            <Button variant={viewMode === 'list' ? 'secondary' : 'ghost'} size="icon" onClick={() => setViewMode('list')}>
              <List className="h-4 w-4" />
            </Button>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-6">
          <h2 className="text-xl font-semibold mb-6">Recent Files</h2>
          {filteredItems.length === 0 ? (
            <div className="text-center py-20 text-gray-400">
              <p>No files found. Upload something!</p>
            </div>
          ) : viewMode === 'grid' ? (
            <FileGrid items={filteredItems} onItemClick={() => { }} onDownload={handleDownload} onDelete={() => { }} onShare={handleShare} />
          ) : (
            <FileList items={filteredItems} onItemClick={() => { }} onDownload={handleDownload} onDelete={() => { }} onShare={handleShare} />
          )}
        </div>
      </main>

      <UploadDialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen} onUpload={handleUpload} />
      <ShareDialog open={shareDialogOpen} onOpenChange={setShareDialogOpen} onShare={submitShare} file={fileToShare} />
      <Toaster richColors />
    </div>
  );
}
