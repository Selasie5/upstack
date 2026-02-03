import { useState, useEffect } from 'react';
import {
  ChevronDown,
  LayoutGrid,
  List as ListIcon
} from 'lucide-react';
import { toast, Toaster } from 'sonner';
import { LoginPage } from './LoginPage';
import { api, auth, computeChunkHash, computeFileHash } from './services/api';
import { Sidebar } from './components/Sidebar';
import { Topbar } from './components/Topbar';
import { EmptyState } from './components/EmptyState';
import { FileGrid } from './components/FileGrid';
import { FileList } from './components/FileList';
import { UploadDialog } from './components/UploadDialog';
import { ShareDialog } from './components/ShareDialog';
import { Button } from './components/ui/button';

const CHUNK_SIZE = 4 * 1024 * 1024; // 4MB

export default function App() {
  const [user, setUser] = useState(auth.getUser());
  const [viewMode, setViewMode] = useState('list'); // Default to list for professional feel
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
    }
  };

  const handleLogin = (userData) => {
    setUser(userData);
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
    const toastId = toast.loading("Preparing objects...");
    try {
      for (const file of files) {
        const chunkCount = Math.ceil(file.size / CHUNK_SIZE);
        const chunkHashes = [];

        for (let i = 0; i < chunkCount; i++) {
          const start = i * CHUNK_SIZE;
          const end = Math.min(file.size, start + CHUNK_SIZE);
          const chunk = file.slice(start, end);
          const hash = await computeChunkHash(chunk);
          chunkHashes.push({ hash, blob: chunk, index: i, offset: start, size: end - start });
        }

        const missing = await api.checkChunks(chunkHashes.map(c => c.hash));
        const missingSet = new Set(missing.missing);

        for (const ch of chunkHashes) {
          if (missingSet.has(ch.hash)) {
            await api.uploadChunk(ch.hash, ch.blob);
          }
        }

        const fileHash = await computeFileHash(file);
        const metadata = {
          id: file.name + Date.now(),
          path: file.name,
          owner_id: user.id || user.email,
          size: file.size,
          mod_time: new Date().toISOString(),
          version: 1,
          hash: fileHash,
          chunks: chunkHashes.map(c => ({
            index: c.index,
            offset: c.offset,
            size: c.size,
            hash: c.hash
          }))
        };

        await api.commitMetadata(metadata);
      }
      toast.success("Upload complete", { id: toastId });
      loadFiles();
    } catch (e) {
      toast.error("Upload failed", { id: toastId });
    }
  };

  const handleDownload = async (item) => {
    const toastId = toast.loading("Assembling object...");
    try {
      const sortedChunks = [...item.raw.chunks].sort((a, b) => a.index - b.index);
      const blobs = [];

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

      toast.success("Download complete", { id: toastId });
    } catch (e) {
      toast.error("Download failed", { id: toastId });
    }
  };

  const handleShare = (item) => {
    setFileToShare(item);
    setShareDialogOpen(true);
  };

  const submitShare = async (shareEmail) => {
    try {
      await api.share(fileToShare.id, shareEmail);
      toast.success(`Access granted to ${shareEmail}`);
      setShareDialogOpen(false);
      loadFiles();
    } catch (e) {
      toast.error("Sharing failed: " + e.message);
    }
  };

  if (!user) {
    return <LoginPage onLogin={handleLogin} />;
  }

  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;

    if (activeSection === 'shared') {
      return item.raw.owner_id !== user.id && item.raw.shared_with?.includes(user.id || user.email);
    }
    if (activeSection === 'my-files') {
      return item.raw.owner_id === (user.id || user.email);
    }
    return true;
  });

  return (
    <div className="grid grid-cols-[240px_1fr] h-screen bg-background overflow-hidden selection:bg-primary/10 selection:text-primary">
      <Sidebar
        activeSection={activeSection}
        setActiveSection={setActiveSection}
        user={user}
        onLogout={handleLogout}
      />

      <div className="flex flex-col overflow-hidden">
        <Topbar
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          onUploadClick={() => setUploadDialogOpen(true)}
          user={user}
        />

        <main className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto p-6 space-y-6">
            <header className="flex items-center justify-between">
              <div className="space-y-1">
                <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                  {activeSection === 'my-files' ? 'My Files' :
                    activeSection === 'shared' ? 'Shared with me' :
                      activeSection.charAt(0).toUpperCase() + activeSection.slice(1)}
                </h1>
                <p className="text-sm text-muted-foreground">
                  Manage and sync your distributed objects.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex items-center bg-muted p-1 rounded-sm border border-border">
                  <Button
                    variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                    size="icon"
                    className="h-7 w-7 rounded-sm"
                    onClick={() => setViewMode('list')}
                  >
                    <ListIcon className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                    size="icon"
                    className="h-7 w-7 rounded-sm"
                    onClick={() => setViewMode('grid')}
                  >
                    <LayoutGrid className="h-4 w-4" />
                  </Button>
                </div>
                <Button variant="outline" size="sm" className="h-9 font-medium">
                  Sort by: Name <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
                </Button>
              </div>
            </header>

            <div className="relative min-h-[400px]">
              {filteredItems.length === 0 ? (
                <EmptyState
                  onUpload={() => setUploadDialogOpen(true)}
                  onSync={() => toast.info("Directory sync triggered")}
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
        </main>
      </div>

      <UploadDialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen} onUpload={handleUpload} />
      <ShareDialog open={shareDialogOpen} onOpenChange={setShareDialogOpen} onShare={submitShare} file={fileToShare} />

      <Toaster
        richColors
        position="bottom-right"
        theme="light"
        toastOptions={{
          className: 'rounded-sm border-border bg-card text-foreground shadow-lg font-sans',
        }}
      />
    </div>
  );
}
