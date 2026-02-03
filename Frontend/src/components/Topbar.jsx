import {
    Search,
    Bell,
    Upload,
    Settings,
    LayoutGrid,
    List as ListIcon
} from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';

export function Topbar({ searchQuery, setSearchQuery, onUploadClick, user }) {
    return (
        <header className="h-16 border-b border-border bg-white flex items-center justify-between px-6 sticky top-0 md:z-10 bg-white/80 backdrop-blur-md">
            <div className="flex-1 max-w-xl">
                <div className="relative group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <Input
                        type="search"
                        placeholder="Search resources, chunks, or metadata..."
                        className="pl-9 h-9 w-full bg-muted/30 border-none focus-visible:ring-1 focus-visible:ring-primary shadow-none rounded-sm text-sm"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            <div className="flex items-center gap-3">
                <div className="flex items-center gap-1 pr-3 border-r border-border">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                        <Bell className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                        <Settings className="h-4 w-4" />
                    </Button>
                </div>

                <Button
                    onClick={onUploadClick}
                    className="h-9 gap-2 px-4 text-sm font-medium shadow-sm transition-all hover:shadow-md"
                >
                    <Upload className="h-4 w-4" />
                    Upload Object
                </Button>
            </div>
        </header>
    );
}
