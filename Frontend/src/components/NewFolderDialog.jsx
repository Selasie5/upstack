import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Folder } from 'lucide-react';

export function NewFolderDialog({ open, onOpenChange, onCreateFolder }) {
  const [folderName, setFolderName] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (folderName.trim()) {
      onCreateFolder(folderName.trim());
      setFolderName('');
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="rounded-lg bg-blue-100 dark:bg-blue-950/30 p-2">
              <Folder className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            Create New Folder
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-3">
            <Label htmlFor="folder-name">Folder Name</Label>
            <Input
              id="folder-name"
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
              placeholder="e.g., Documents, Photos, Projects"
              autoFocus
              className="h-11"
            />
            <p className="text-xs text-gray-500">
              Choose a descriptive name for your folder
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-gray-100\">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!folderName.trim()} className="min-w-25">
              Create Folder
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
