import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Users, Copy, Shield } from 'lucide-react';
import { toast } from 'sonner';

export function ShareDialog({ open, onOpenChange, onShare, file }) {
    const [userId, setUserId] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (userId.trim()) {
            onShare(userId.trim());
            setUserId('');
        }
    };

    const handleCopyLink = () => {
        navigator.clipboard.writeText(`http://upstack.link/file/${file?.id}`);
        toast.success("Link copied to clipboard");
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md border-slate-200">
                <DialogHeader>
                    <DialogTitle className="uppercase tracking-tight">Access Control</DialogTitle>
                    <DialogDescription className="text-[10px] uppercase font-bold tracking-widest text-slate-400">
                        Modify permission set for: {file?.path || file?.name}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                            Resource Identifier
                        </label>
                        <div className="flex items-center gap-2">
                            <Input
                                id="link"
                                className="bg-slate-50 text-xs font-mono rounded-sm h-8"
                                defaultValue={`OBJ_ID_${file?.id?.substring(0, 16) || 'LOADING'}...`}
                                readOnly
                            />
                            <Button type="button" size="icon" className="h-8 w-8 px-0" variant="secondary" onClick={handleCopyLink}>
                                <Copy className="h-3.5 w-3.5" />
                            </Button>
                        </div>
                    </div>

                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t border-slate-100" />
                        </div>
                        <div className="relative flex justify-center text-[10px] uppercase tracking-tighter">
                            <span className="bg-white px-3 text-slate-400 font-bold">ACL Update</span>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-3">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                            Authorize User Identity
                        </label>
                        <div className="flex gap-2">
                            <Input
                                placeholder="UID: BOB_SYSTEM_01"
                                className="h-9 text-sm rounded-sm"
                                value={userId}
                                onChange={(e) => setUserId(e.target.value)}
                            />
                            <Button type="submit" size="sm" className="px-5">
                                <Shield className="mr-2 h-3.5 w-3.5" />
                                Grant
                            </Button>
                        </div>
                    </form>

                    {(file?.raw?.shared_with && file.raw.shared_with.length > 0) && (
                        <div className="space-y-3 pt-4 border-t border-slate-100">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Active Permissions</p>
                            <div className="space-y-1 max-h-32 overflow-y-auto">
                                {file.raw.shared_with.map((u, i) => (
                                    <div key={i} className="bg-slate-50 border border-slate-100 px-3 py-2 rounded-sm flex items-center justify-between">
                                        <div className="flex items-center gap-2 overflow-hidden">
                                            <div className="h-5 w-5 rounded-sm bg-blue-100 flex items-center justify-center text-[10px] text-blue-600 font-black shrink-0">
                                                {u[0].toUpperCase()}
                                            </div>
                                            <span className="text-xs font-bold text-slate-700 truncate tracking-tight">{u}</span>
                                        </div>
                                        <span className="text-[9px] font-black uppercase text-green-600 tracking-tighter">Authorized</span>
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
