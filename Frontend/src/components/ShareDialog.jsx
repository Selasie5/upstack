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
            <DialogContent className="sm:max-w-md border-border rounded-sm overflow-hidden p-0 gap-0">
                <div className="bg-slate-900 px-6 py-8 text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary rounded-full translate-x-1/2 -translate-y-1/2 opacity-20 blur-2xl"></div>
                    <DialogHeader className="relative z-10 flex flex-col items-center text-center">
                        <div className="h-12 w-12 bg-primary rounded-sm flex items-center justify-center mb-4 shadow-lg shadow-primary/20">
                            <ShieldCheck className="h-6 w-6" />
                        </div>
                        <DialogTitle className="text-xl font-bold tracking-tight text-white mb-1">Secure Authorization</DialogTitle>
                        <DialogDescription className="text-primary-foreground/60 font-medium text-xs truncate max-w-[280px]">
                            {file?.path || file?.name}
                        </DialogDescription>
                    </DialogHeader>
                </div>

                <div className="p-6 space-y-6 bg-white">
                    <div className="space-y-4">
                        <div className="flex items-start gap-3 p-3 bg-primary/5 border border-primary/10 rounded-sm">
                            <Info className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                            <p className="text-[11px] font-bold text-primary uppercase tracking-tight leading-relaxed">
                                Recipients will receive an encrypted notification with access credentials.
                            </p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">
                                    Recipient Email
                                </label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground group-focus-within:text-primary transition-all">
                                        <Mail className="h-4 w-4" />
                                    </div>
                                    <Input
                                        placeholder="user@example.com"
                                        className="pl-10 h-10 rounded-sm"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        type="email"
                                    />
                                </div>
                            </div>
                            <Button type="submit" className="w-full h-10 rounded-sm font-bold uppercase tracking-widest text-xs">
                                <UserPlus className="mr-2 h-4 w-4" />
                                Grant Access
                            </Button>
                        </form>
                    </div>

                    {(file?.raw?.shared_with && file.raw.shared_with.length > 0) && (
                        <div className="space-y-3 pt-4 border-t border-border">
                            <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Authorized Entities</h4>
                            <div className="grid gap-2 max-h-40 overflow-y-auto pr-1 no-scrollbar">
                                {file.raw.shared_with.map((u, i) => (
                                    <div key={i} className="flex items-center justify-between p-2.5 bg-muted/30 border border-border rounded-sm group hover:border-primary/30 transition-all">
                                        <div className="flex items-center gap-2.5 overflow-hidden">
                                            <div className="h-7 w-7 rounded-sm bg-white flex items-center justify-center text-[10px] text-primary font-bold border border-border">
                                                {u[0].toUpperCase()}
                                            </div>
                                            <span className="text-xs font-semibold text-foreground truncate">{u}</span>
                                        </div>
                                        <div className="flex items-center gap-1 text-[9px] font-black uppercase text-primary">
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
