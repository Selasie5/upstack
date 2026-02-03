import { Search, Bell, Plus, Menu } from 'lucide-react';
import { Button } from './ui/button';

export function Topbar({ searchQuery, setSearchQuery, onUpload, onMenuClick }) {
    return (
        <header className="h-18 flex items-center justify-between px-8 bg-white/70 backdrop-blur-xl border-b border-slate-200/50 sticky top-0 z-30">
            <div className="flex items-center gap-6 flex-1">
                <button
                    onClick={onMenuClick}
                    className="lg:hidden h-10 w-10 flex items-center justify-center rounded-xl bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100 transition-all"
                >
                    <Menu className="h-5 w-5" />
                </button>

                <div className="relative w-full max-w-md group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Search className="h-4 w-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                    </div>
                    <input
                        className="w-full pl-10 pr-4 h-10.5 bg-slate-100/50 border border-transparent rounded-[14px] text-sm font-semibold text-slate-900 placeholder:text-slate-400 placeholder:font-medium focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500/20 focus:bg-white transition-all outline-none"
                        placeholder="Search workspace..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                    />
                    <div className="absolute inset-y-0 right-3 flex items-center">
                        <kbd className="hidden sm:inline-flex h-5 items-center gap-1 rounded-[6px] border border-slate-200 bg-white px-1.5 font-mono text-[9px] font-bold text-slate-400 shadow-sm">
                            <span className="text-[10px]">⌘</span>K
                        </kbd>
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-3">
                <button className="h-9 w-9 flex items-center justify-center rounded-xl text-slate-400 hover:bg-slate-50 hover:text-slate-900 transition-all relative">
                    <Bell className="h-4.5 w-4.5" />
                    <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-blue-500 rounded-full ring-2 ring-white"></span>
                </button>

                <div className="h-4 w-px bg-slate-200 mx-1"></div>

                <Button
                    className="rounded-xl h-9.5 px-5 shadow-lg shadow-blue-500/10 active:scale-95 transition-all text-[11px] font-bold uppercase tracking-wider"
                    onClick={onUpload}
                >
                    <Plus className="mr-1.5 h-4 w-4 stroke-[3px]" />
                    Upload
                </Button>
            </div>
        </header>
    );
}
