import {
    LayoutGrid,
    Clock,
    Star,
    Users,
    Trash2 as TrashIcon,
    Settings,
    HelpCircle,
    LogOut,
    ChevronRight,
    ShieldCheck
} from 'lucide-react';
import { StorageBar } from './StorageBar';

export function Sidebar({ activeSection, setActiveSection, user, onLogout }) {
    const sidebarLinks = [
        { id: 'my-files', label: 'Dashboard', icon: LayoutGrid },
        { id: 'recent', label: 'Recent', icon: Clock },
        { id: 'starred', label: 'Starred', icon: Star },
        { id: 'shared', label: 'Shared with me', icon: Users },
        { id: 'trash', label: 'Trash', icon: TrashIcon },
    ];

    return (
        <aside className="hidden lg:flex w-64 bg-rose-600 text-white flex-col fixed left-0 top-0 h-screen z-20 sudo shadow-2xl">
            {/* Logo Section */}
            <div className="flex-shrink-0 w-full">
                <div className="w-full h-16 border-b border-rose-400/30 flex items-center px-4 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="bg-white rounded-xl p-2 shadow-lg shadow-black/10">
                            <ShieldCheck className="h-5 w-5 text-rose-600" />
                        </div>
                        <div className="flex flex-col">
                            <h1 className="text-sm font-black tracking-[0.1em] text-white leading-none uppercase">
                                UpStack
                            </h1>
                            <span className="text-[8px] font-bold text-rose-200 uppercase tracking-widest mt-1">
                                Distributed Console
                            </span>
                        </div>
                    </div>
                </div>
            </div>


            <div className="flex-1 overflow-y-auto px-3 space-y-8 no-scrollbar">
                <div className="px-1">
                    <StorageBar used={0} total={100} variant="adorned" />
                </div>

                <nav className="space-y-1">
                    <p className="px-4 text-[9px] font-black text-rose-200 uppercase tracking-[0.25em] mb-4 opacity-70">
                        Object Management
                    </p>
                    {sidebarLinks.map((item) => {
                        const Icon = item.icon;
                        const isActive = activeSection === item.id;
                        return (
                            <button
                                key={item.id}
                                onClick={() => setActiveSection(item.id)}
                                className={`w-full flex items-center justify-between group px-4 py-3 text-sm font-bold rounded-xl transition-all duration-300 ${isActive
                                    ? 'bg-black/30 text-white'
                                    : 'text-rose-50 hover:bg-black/20 hover:text-white'
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <Icon className={`h-4.5 w-4.5 transition-colors ${isActive ? 'text-white' : 'text-rose-200 group-hover:text-white'}`} />
                                    {item.label}
                                </div>
                                {isActive && <div className="h-1.5 w-1.5 rounded-full bg-white shadow-[0_0_8px_white]" />}
                            </button>
                        );
                    })}
                </nav>
            </div>

            {/* Footer / User Profile */}
            <div className="mt-auto p-3 space-y-4">
                <nav className="space-y-1">
                    <button className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-rose-100 hover:bg-black/20 hover:text-white rounded-xl transition-all">
                        <Settings className="h-4.5 w-4.5 text-rose-300" />
                        System Settings
                    </button>
                    <button className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-rose-100 hover:bg-black/20 hover:text-white rounded-xl transition-all">
                        <HelpCircle className="h-4.5 w-4.5 text-rose-300" />
                        Technical Support
                    </button>
                </nav>

                <div className="p-3 bg-black/20 border border-white/5 rounded-[22px] flex items-center justify-between shadow-lg">
                    <div className="flex items-center gap-3 overflow-hidden">
                        <div className="h-9 w-9 rounded-full bg-white flex items-center justify-center text-xs font-black text-rose-600 shrink-0 border-2 border-rose-400/50">
                            {user[0].toUpperCase()}
                        </div>
                        <div className="min-w-0">
                            <p className="text-xs font-bold truncate text-white">{user}</p>
                            <p className="text-[9px] text-rose-200 font-bold uppercase tracking-tight">Root Admin</p>
                        </div>
                    </div>
                    <button
                        onClick={onLogout}
                        className="h-7 w-7 flex items-center justify-center text-rose-300 hover:text-white hover:bg-white/10 transition-all rounded-lg"
                    >
                        <LogOut className="h-4 w-4" />
                    </button>
                </div>
            </div>
        </aside>
    );
}
