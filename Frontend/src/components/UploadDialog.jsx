import { useState, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from './ui/dialog';
import { Button } from './ui/button';
import { Cloud, X, File, AlertCircle } from 'lucide-react';
import { cn } from '../lib/utils';

export function UploadDialog({ open, onOpenChange, onUpload }) {
  const [dragActive, setDragActive] = useState(false);
  const [files, setFiles] = useState([]);

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
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFiles(prev => [...prev, ...Array.from(e.dataTransfer.files)]);
    }
  }, []);

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      setFiles(prev => [...prev, ...Array.from(e.target.files)]);
    }
  };

  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (files.length > 0) {
      onUpload(files);
      setFiles([]);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] p-0 overflow-hidden border-border shadow-2xl">
        <DialogHeader className="p-6 bg-muted/30 border-b border-border">
          <DialogTitle className="text-xl font-semibold tracking-tight">Upload objects</DialogTitle>
          <DialogDescription className="text-sm">
            Add new files to your distributed storage node.
          </DialogDescription>
        </DialogHeader>

        <div className="p-6 space-y-6">
          <div
            className={cn(
              "relative border-2 border-dashed rounded-sm p-8 transition-all flex flex-col items-center justify-center text-center gap-4",
              dragActive ? "border-primary bg-primary/5" : "border-border hover:bg-muted/30"
            )}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input
              type="file"
              multiple
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              onChange={handleChange}
            />
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Cloud className="h-6 w-6 text-primary" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold">Click to upload or drag and drop</p>
              <p className="text-xs text-muted-foreground">Any file type up to 10GB</p>
            </div>
          </div>

          {files.length > 0 && (
            <div className="space-y-2">
              <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Pending Objects ({files.length})</p>
              <div className="max-h-[160px] overflow-y-auto space-y-2 pr-1 no-scrollbar">
                {files.map((file, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-muted/30 border border-border rounded-sm group">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <File className="h-4 w-4 text-primary shrink-0" />
                      <span className="text-xs font-medium truncate">{file.name}</span>
                    </div>
                    <button
                      onClick={() => removeFile(i)}
                      className="p-1 hover:bg-destructive/10 hover:text-destructive rounded-sm transition-colors"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center gap-3 p-3 bg-primary/5 border border-primary/10 rounded-sm">
            <AlertCircle className="h-4 w-4 text-primary shrink-0" />
            <p className="text-[10px] font-medium text-primary uppercase tracking-tight leading-relaxed">
              Files will be chunked and encrypted before transmission to ensure strong consistency and data integrity.
            </p>
          </div>
        </div>

        <DialogFooter className="p-6 bg-muted/30 border-t border-border gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="px-6">
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={files.length === 0} className="px-8 font-semibold shadow-sm">
            Complete Upload
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
