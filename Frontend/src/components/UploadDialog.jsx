import { useState, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Upload, X, FileIcon, CheckCircle2 } from 'lucide-react';
import { Button } from './ui/button';

export function UploadDialog({ open, onOpenChange, onUpload }) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const files = Array.from(e.dataTransfer.files);
      setSelectedFiles(prev => [...prev, ...files]);
    }
  }, []);

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      setSelectedFiles(prev => [...prev, ...files]);
    }
  };

  const removeFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpload = () => {
    onUpload(selectedFiles);
    setSelectedFiles([]);
    onOpenChange(false);
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md border-slate-200">
        <DialogHeader>
          <DialogTitle className="uppercase tracking-tight">System Upload</DialogTitle>
          <DialogDescription className="text-[10px] uppercase font-bold tracking-widest text-slate-400">
            Stage files for distribution
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          <div
            className={`relative border border-dashed rounded-sm p-12 text-center transition-all bg-slate-50/50 ${dragActive
                ? 'border-blue-500 bg-blue-50/50 scale-[0.99]'
                : 'border-slate-300 hover:border-slate-400'
              }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input
              type="file"
              id="file-upload"
              multiple
              onChange={handleFileSelect}
              className="sr-only"
            />
            <label htmlFor="file-upload" className="cursor-pointer">
              <div className="mx-auto mb-4 rounded-sm bg-white border border-slate-200 p-3 shadow-sm w-fit">
                <Upload className="h-6 w-6 text-slate-500" />
              </div>
              <p className="text-xs font-bold uppercase tracking-tight text-slate-700">
                Drag and drop or <span className="text-blue-600">browse</span>
              </p>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-1">
                MAX 100MB PER OBJECT
              </p>
            </label>
          </div>

          {selectedFiles.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
                  <CheckCircle2 className="h-3 w-3 text-green-600" />
                  STAGING AREA ({selectedFiles.length})
                </h4>
                <button
                  onClick={() => setSelectedFiles([])}
                  className="text-[10px] font-bold text-red-600 uppercase hover:underline"
                >
                  Clear all
                </button>
              </div>
              <div className="space-y-1 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                {selectedFiles.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between border border-slate-100 bg-white p-2 rounded-sm group transition-colors hover:border-slate-300"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <FileIcon className="h-3.5 w-3.5 text-slate-400" />
                      <div className="min-w-0">
                        <p className="truncate text-xs font-bold text-slate-700 uppercase tracking-tight">{file.name}</p>
                        <p className="text-[10px] text-slate-400 font-bold tracking-tighter uppercase">{formatFileSize(file.size)}</p>
                      </div>
                    </div>
                    <button
                      className="text-slate-300 hover:text-red-500 transition-colors p-1"
                      onClick={() => removeFile(index)}
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleUpload}
              disabled={selectedFiles.length === 0}
              className="px-8"
            >
              Commit Upload
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
