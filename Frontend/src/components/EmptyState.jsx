import { Upload, ArrowUpRight, FolderOpen } from 'lucide-react';
import { Button } from './ui/button';

export function EmptyState({ onUpload, onSync }) {
    return (
        <div className="flex flex-col items-center justify-center py-24 px-6 bg-white border border-dashed border-border rounded-sm">
            <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mb-6">
                <FolderOpen className="h-8 w-8 text-muted-foreground" />
            </div>

            <div className="max-w-xs text-center space-y-2 mb-8">
                <h3 className="text-lg font-semibold text-foreground tracking-tight">
                    No files yet
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed font-medium">
                    Upload files or add a folder to get started.
                </p>
            </div>

            <div className="flex items-center gap-3">
                <Button
                    onClick={onUpload}
                    className="px-6 shadow-sm"
                >
                    <Upload className="mr-2 h-4 w-4" />
                    Upload files
                </Button>
                <Button
                    variant="outline"
                    onClick={onSync}
                    className="px-6"
                >
                    <ArrowUpRight className="mr-2 h-4 w-4" />
                    Connect Node
                </Button>
            </div>
        </div>
    );
}
