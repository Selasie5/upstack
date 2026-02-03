import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter
} from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Users, Copy } from 'lucide-react';
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
        // Demo: In real app this would be a public link
        navigator.clipboard.writeText(`http://upstack.link/file/${file?.id}`);
        toast.success("Link copied to clipboard");
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Share "{file?.path || file?.name}"</DialogTitle>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="flex items-center space-x-2">
                        <div className="grid flex-1 gap-2">
                            <label htmlFor="link" className="sr-only">
                                Link
                            </label>
                            <Input
                                id="link"
                                defaultValue={`http://upstack.link/file/${file?.id}`}
                                readOnly
                            />
                        </div>
                        <Button type="button" size="sm" className="px-3" variant="secondary" onClick={handleCopyLink}>
                            <span className="sr-only">Copy</span>
                            <Copy className="h-4 w-4" />
                        </Button>
                    </div>

                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-white px-2 text-gray-500">Or share with user</span>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="flex gap-2">
                        <div className="flex-1">
                            <Input
                                placeholder="Enter User ID (e.g. bob)"
                                value={userId}
                                onChange={(e) => setUserId(e.target.value)}
                            />
                        </div>
                        <Button type="submit">
                            <Users className="mr-2 h-4 w-4" />
                            Share
                        </Button>
                    </form>

                    {(file?.raw?.shared_with && file.raw.shared_with.length > 0) && (
                        <div className="text-sm">
                            <p className="font-medium mb-2">Shared with:</p>
                            <ul className="space-y-1">
                                {file.raw.shared_with.map((u, i) => (
                                    <li key={i} className="bg-gray-100 px-2 py-1 rounded flex items-center gap-2">
                                        <div className="h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center text-xs text-blue-600 font-bold">
                                            {u[0].toUpperCase()}
                                        </div>
                                        {u}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
