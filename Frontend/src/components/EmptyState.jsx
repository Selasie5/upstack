import { Upload, FolderPlus, ArrowUpRight } from 'lucide-react';
import { Button } from './ui/button';

export function EmptyState({ onUpload, onSync }) {
    return (
        <div className="flex flex-col items-center justify-center py-20 px-6 bg-white border border-slate-200/60 rounded-[32px] shadow-sm relative overflow-hidden group">
            {/* Background Decorative Elements */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

            <div className="relative mb-8">
                <div className="w-24 h-24 bg-blue-50 rounded-[24px] flex items-center justify-center rotate-3 group-hover:rotate-0 transition-transform duration-500">
                    <Upload className="h-10 w-10 text-blue-600" />
                </div>
                <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-white border border-slate-100 rounded-xl shadow-lg flex items-center justify-center -rotate-6 group-hover:rotate-0 transition-transform duration-500 delay-75">
                    <FolderPlus className="h-5 w-5 text-indigo-500" />
                </div>
            </div>

            <div className="max-w-sm text-center space-y-3">
                <h3 className="text-2xl font-bold text-slate-900 tracking-tight">
                    No files in this workspace
                </h3>
                <p className="text-slate-500 font-medium leading-relaxed">
                    Your cloud storage is currently empty. Start by uploading a file or
                    synchronizing your local directory to see them here.
                </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 mt-10">
                <Button
                    onClick={onUpload}
                    className="rounded-2xl px-8 h-12 bg-blue-600 hover:bg-blue-700 shadow-xl shadow-blue-500/20 w-full sm:w-auto"
                >
                    <Upload className="mr-2 h-4.5 w-4.5" />
                    Upload Files
                </Button>
                <Button
                    variant="outline"
                    onClick={onSync}
                    className="rounded-2xl px-8 h-12 border-slate-200 hover:bg-slate-50 w-full sm:w-auto"
                >
                    <ArrowUpRight className="mr-2 h-4.5 w-4.5 text-slate-400" />
                    Sync Folder
                </Button>
            </div>

            <p className="mt-8 text-xs font-bold text-slate-400 uppercase tracking-widest">
                Distributed sync active
            </p>
        </div>
    );
}
