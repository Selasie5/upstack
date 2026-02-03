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
  ChevronDown,
  Bell,
  Settings,
  HelpCircle,
  Plus,
  LayoutGrid,
} from 'lucide-react';
import { Button } from './components/ui/button';
import { FileGrid } from './components/FileGrid';
import { FileList } from './components/FileList';
import { StorageBar } from './components/StorageBar';
import { UploadDialog } from './components/UploadDialog';
import { ShareDialog } from './components/ShareDialog';
import { toast, Toaster } from 'sonner';
import { LoginPage } from './LoginPage';
import { api, auth, computeChunkHash, computeFileHash } from './services/api';
import { Sidebar } from './components/Sidebar';
import { Topbar } from './components/Topbar';
import { EmptyState } from './components/EmptyState';

const CHUNK_SIZE = 4 * 1024 * 1024; // 4MB

export default function App() {
  const [user, setUser] = useState(auth.getUser());
  const [viewMode, setViewMode] = useState('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [fileToShare, setFileToShare] = useState(null);
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
          name: f.path,
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
    toast.success(`Welcome back, ${userId}`);
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
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const handleUpload = async (files) => {
    const toastId = toast.loading("Finalizing objects...");
    try {
      for (const file of files) {
        const chunks = [];
        const chunkCount = Math.ceil(file.size / CHUNK_SIZE);
        const chunkHashes = [];

        for (let i = 0; i < chunkCount; i++) {
          const start = i * CHUNK_SIZE;
          const end = Math.min(start + CHUNK_SIZE, file.size);
          const blob = file.slice(start, end);
          const hash = await computeChunkHash(blob);
          chunks.push({ index: i, blob, hash, offset: start, size: blob.size });
          chunkHashes.push(hash);
        }

        const fullHash = await computeFileHash(file);
        const { missing } = await api.checkChunks(chunkHashes);
        const missingSet = new Set(missing);

        for (const chunk of chunks) {
          if (missingSet.has(chunk.hash)) {
            await api.uploadChunk(chunk.hash, chunk.blob);
          }
        }

        const meta = {
          id: `${Date.now()}-${file.name}`,
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
      toast.success("All files synchronized");
      loadFiles();
    } catch (err) {
      toast.dismiss(toastId);
      toast.error("Process failed: " + err.message);
    }
  };

  const handleDownload = async (item) => {
    const toastId = toast.loading("Reassembling " + item.name);
    try {
      const meta = item.raw;
      const blobs = [];
      const sortedChunks = (meta.chunks || []).sort((a, b) => a.index - b.index);

      for (const chunk of sortedChunks) {
        const blob = await api.downloadChunk(chunk.hash);
        blobs.push(blob);
      }

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
      toast.success("Download complete");
    } catch (e) {
      toast.dismiss(toastId);
      toast.error("Download failed");
    }
  };

  const handleShare = (item) => {
    setFileToShare(item);
    setShareDialogOpen(true);
  };

  const submitShare = async (userId) => {
    try {
      await api.share(fileToShare.id, userId);
      toast.success(`Access granted to ${userId}`);
      setShareDialogOpen(false);
    } catch (e) {
      toast.error("Sharing failed: " + e.message);
    }
  };


  if (!user) {
    return <LoginPage onLogin={handleLogin} />;
  }

  const filteredItems = items.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex h-screen bg-[#f8fafc] text-slate-900 overflow-hidden font-['Manrope'] selection:bg-rose-100 selection:text-rose-900">
      <Sidebar
        activeSection={activeSection}
        setActiveSection={setActiveSection}
        user={user}
        onLogout={handleLogout}
      />

      <main className="flex-1 flex flex-col relative overflow-hidden lg:pl-64">
        <Topbar
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          onUpload={() => setUploadDialogOpen(true)}
        />

        {/* Scrollable Content Container */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 lg:p-10 no-scrollbar">
          <div className="max-w-7xl mx-auto">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-rose-600 font-bold text-[10px] uppercase tracking-[0.25em] mb-1.5">
                  <div className="h-1 w-3 bg-rose-600 rounded-full" />
                  Distributed Node Console
                </div>
                <h2 className="text-3xl font-black text-slate-900 tracking-tight cursor-default">
                  {activeSection.split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ')}
                </h2>
                <p className="text-slate-500 font-medium text-sm max-w-sm">
                  Access and manage your cloud objects synchronized across the system.
                </p>
              </div>

              <div className="flex items-center gap-2 p-1 bg-white border border-slate-200/50 rounded-2xl shadow-sm">
                <Button
                  variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                  size="icon-sm"
                  className={`rounded-xl transition-all ${viewMode === 'grid' ? 'bg-slate-100 text-slate-900' : 'text-slate-400'}`}
                  onClick={() => setViewMode('grid')}
                >
                  <Grid3x3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                  size="icon-sm"
                  className={`rounded-xl transition-all ${viewMode === 'list' ? 'bg-slate-100 text-slate-900' : 'text-slate-400'}`}
                  onClick={() => setViewMode('list')}
                >
                  <List className="h-4 w-4" />
                </Button>
                <div className="w-px h-4 bg-slate-200 mx-1.5" />
                <Button variant="ghost" size="sm" className="font-bold text-[10px] h-8 px-3 rounded-xl text-slate-500 hover:text-slate-900 uppercase tracking-widest">
                  Recent <ChevronDown className="ml-1 h-3.5 w-3.5" />
                </Button>
              </div>
            </div>

            {/* Main Listing Section */}
            <div className="relative">
              {filteredItems.length === 0 ? (
                <EmptyState
                  onUpload={() => setUploadDialogOpen(true)}
                  onSync={() => toast.info("Directory sync triggered via local engine")}
                />
              ) : viewMode === 'grid' ? (
                <FileGrid
                  items={filteredItems}
                  onItemClick={() => { }}
                  onDownload={handleDownload}
                  onDelete={() => { }}
                  onShare={handleShare}
                />
              ) : (
                <FileList
                  items={filteredItems}
                  onItemClick={() => { }}
                  onDownload={handleDownload}
                  onDelete={() => { }}
                  onShare={handleShare}
                />
              )}
            </div>
          </div>
        </div>
      </main>

      <UploadDialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen} onUpload={handleUpload} />
      <ShareDialog open={shareDialogOpen} onOpenChange={setShareDialogOpen} onShare={submitShare} file={fileToShare} />
      <Toaster
        richColors
        closeButton
        position="top-center"
        theme="light"
        expand={false}
        toastOptions={{
          style: {
            borderRadius: '16px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.05)',
            fontFamily: "'Manrope', sans-serif",
            fontWeight: 600,
          }
        }}
      />
    </div>
  );
}
