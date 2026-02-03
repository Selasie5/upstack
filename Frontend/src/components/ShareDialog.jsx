import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Mail, Shield, ShieldCheck, UserPlus, Info } from 'lucide-react';

export function ShareDialog({ open, onOpenChange, onShare, file }) {
    const [email, setEmail] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (email.trim()) {
            onShare(email.trim());
            setEmail('');
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md border-slate-200 rounded-[28px] overflow-hidden p-0 gap-0">
                <div className="bg-slate-900 p-8 text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-green-600 rounded-full translate-x-1/2 -translate-y-1/2 opacity-20 blur-2xl"></div>
                    <DialogHeader className="relative z-10">
                        <div className="h-12 w-12 bg-green-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-green-500/20">
                            <ShieldCheck className="h-6 w-6" />
                        </div>
                        <DialogTitle className="text-2xl font-black tracking-tight text-white mb-1">Secure Sharing</DialogTitle>
                        <DialogDescription className="text-green-200/60 font-medium text-xs">
                            {file?.path || file?.name}
                        </DialogDescription>
                    </DialogHeader>
                </div>

                <div className="p-8 space-y-8 bg-white">
                    <div className="space-y-4">
                        <div className="flex items-start gap-4 p-4 bg-green-50/50 border border-green-100/50 rounded-2xl">
                            <Info className="h-4 w-4 text-green-600 mt-1 shrink-0" />
                            <p className="text-[11px] font-bold text-green-900 leading-relaxed uppercase tracking-tight">
                                Sharing will grant full read access to this resource and notify the recipient via email.
                            </p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2.5">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                                    Recipient Email Address
                                </label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-300 group-focus-within:text-green-600 transition-all">
                                        <Mail className="h-4.5 w-4.5" />
                                    </div>
                                    <Input
                                        placeholder="colleague@example.com"
                                        className="pl-11 h-12 rounded-[16px] border-slate-200/60 bg-slate-50/50 focus:bg-white focus:ring-4 focus:ring-green-500/5 transition-all font-bold"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        type="email"
                                    />
                                </div>
                            </div>
                            <Button type="submit" className="w-full h-12 rounded-[16px] bg-slate-900 hover:bg-slate-800 text-xs font-black uppercase tracking-widest shadow-xl">
                                <UserPlus className="mr-2 h-4 w-4" />
                                Grant Authorization
                            </Button>
                        </form>
                    </div>

                    {(file?.raw?.shared_with && file.raw.shared_with.length > 0) && (
                        <div className="space-y-4 pt-6 border-t border-slate-100">
                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Current Authorized Nodes</h4>
                            <div className="grid gap-2 max-h-40 overflow-y-auto pr-2 no-scrollbar">
                                {file.raw.shared_with.map((u, i) => (
                                    <div key={i} className="flex items-center justify-between p-3 bg-slate-50/80 border border-slate-100 rounded-sm group hover:border-green-100 hover:bg-white transition-all">
                                        <div className="flex items-center gap-3 overflow-hidden">
                                            <div className="h-8 w-8 rounded-sm bg-white flex items-center justify-center text-[10px] text-green-600 font-black shadow-sm group-hover:scale-110 transition-transform">
                                                {u[0].toUpperCase()}
                                            </div>
                                            <span className="text-xs font-bold text-slate-700 truncate tracking-tight">{u}</span>
                                        </div>
                                        <div className="flex items-center gap-1 text-[9px] font-black uppercase text-green-600">
                                            <Shield className="h-3 w-3" />
                                            Active
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
