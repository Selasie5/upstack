import {
    LayoutGrid,
    Clock,
    Star,
    Users,
    Trash2 as TrashIcon,
    Settings,
    HelpCircle,
    LogOut,
    Plus,
    Cloud,
    Shield
} from 'lucide-react';
import { Button } from './ui/button';
import { cn } from '../lib/utils';

export function Sidebar({ activeSection, setActiveSection, user, onLogout }) {
    const mainLinks = [
        { id: 'my-files', label: 'My Files', icon: LayoutGrid },
        { id: 'shared', label: 'Shared with me', icon: Users },
        { id: 'recent', label: 'Recent', icon: Clock },
    ];

    const utilityLinks = [
        { id: 'starred', label: 'Starred', icon: Star },
        { id: 'trash', label: 'Trash', icon: TrashIcon },
    ];

    return (
        <aside className="flex flex-col h-dvh bg-[#0F172A] text-[#94A3B8] border-r border-[#1E293B] font-sans">
            {/* Logo Section */}
            <div className="h-16 flex items-center px-6 border-b border-[#1E293B]">
                <div className="flex items-center gap-2.5">
                    <div className="bg-primary rounded-sm p-1.5 shadow-lg shadow-primary/10">
                        <Cloud className="h-5 w-5 text-white" />
                    </div>
                    <span className="font-bold text-lg tracking-tight text-white uppercase">UpStack</span>
                </div>
            </div>

            {/* Navigation */}
            <div className="flex-1 py-6 px-3 space-y-8 overflow-y-auto no-scrollbar">
                <div>
                    <div className="px-3 mb-2 flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-[#475569]">Workspace</span>
                        <Button variant="ghost" size="icon" className="h-5 w-5 hover:bg-[#1E293B] text-[#475569]">
                            <Plus className="h-3 w-3" />
                        </Button>
                    </div>
                    <nav className="space-y-0.5">
                        {mainLinks.map((item) => {
                            const Icon = item.icon;
                            const isActive = activeSection === item.id;
                            return (
                                <button
                                    key={item.id}
                                    onClick={() => setActiveSection(item.id)}
                                    className={cn(
                                        "w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-sm transition-colors",
                                        isActive
                                            ? "bg-[#1E293B] text-white shadow-sm"
                                            : "hover:bg-[#1E293B]/50 hover:text-[#CBD5E1]"
                                    )}
                                >
                                    <Icon className={cn("h-4 w-4", isActive ? "text-primary" : "text-[#475569]")} />
                                    {item.label}
                                </button>
                            );
                        })}
                    </nav>
                </div>

                <div>
                    <span className="px-3 text-[10px] font-bold uppercase tracking-widest text-[#475569] block mb-2">Folders</span>
                    <nav className="space-y-0.5">
                        {utilityLinks.map((item) => {
                            const Icon = item.icon;
                            const isActive = activeSection === item.id;
                            return (
                                <button
                                    key={item.id}
                                    onClick={() => setActiveSection(item.id)}
                                    className={cn(
                                        "w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-sm transition-colors",
                                        isActive
                                            ? "bg-[#1E293B] text-white"
                                            : "hover:bg-[#1E293B]/50 hover:text-[#CBD5E1]"
                                    )}
                                >
                                    <Icon className={cn("h-4 w-4", isActive ? "text-primary" : "text-[#475569]")} />
                                    {item.label}
                                </button>
                            );
                        })}
                    </nav>
                </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-[#1E293B] space-y-4">
                <nav className="space-y-0.5">
                    <button className="w-full flex items-center gap-3 px-3 py-2 text-xs font-medium rounded-sm hover:bg-[#1E293B]/50 hover:text-[#CBD5E1] transition-colors">
                        <Settings className="h-4 w-4 text-[#475569]" />
                        Settings
                    </button>
                    <button className="w-full flex items-center gap-3 px-3 py-2 text-xs font-medium rounded-sm hover:bg-[#1E293B]/50 hover:text-[#CBD5E1] transition-colors">
                        <HelpCircle className="h-4 w-4 text-[#475569]" />
                        Support
                    </button>
                </nav>

                <div className="mt-2 pt-4 border-t border-[#1E293B]">
                    <div className="flex items-center justify-between p-2 rounded-sm bg-[#1E293B]/30 border border-[#1E293B]">
                        <div className="flex items-center gap-3 overflow-hidden">
                            <div className="h-8 w-8 rounded-sm bg-primary/20 flex items-center justify-center text-[10px] font-bold text-primary shrink-0">
                                {user?.name?.[0].toUpperCase() || user?.email?.[0].toUpperCase() || '?'}
                            </div>
                            <div className="min-w-0">
                                <p className="text-xs font-semibold text-white truncate">{user?.name || 'User'}</p>
                                <div className="flex items-center gap-1">
                                    <Shield className="h-2.5 w-2.5 text-primary" />
                                    <span className="text-[9px] text-[#64748B] font-bold uppercase tracking-tight">Enterprise</span>
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={onLogout}
                            className="p-1.5 text-[#475569] hover:text-white hover:bg-[#1E293B] rounded-sm transition-all"
                        >
                            <LogOut className="h-3.5 w-3.5" />
                        </button>
                    </div>
                </div>
            </div>
        </aside>
    );
}
