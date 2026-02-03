import { useState } from 'react';
import { Button } from './components/ui/button';
import { Input } from './components/ui/input';
import { Cloud, Lock, ArrowRight, ShieldCheck } from 'lucide-react';

export function LoginPage({ onLogin }) {
    const [userId, setUserId] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!userId.trim()) {
            setError('A valid User ID is required');
            return;
        }
        onLogin(userId);
    };

    return (
        <div className="flex h-screen w-full font-['Manrope'] bg-white overflow-hidden">

            <div className="hidden lg:flex w-[45%] bg-blue-600 p-12 flex-col justify-between relative overflow-hidden">
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-500 rounded-full -translate-y-[40%] translate-x-[30%] opacity-20"></div>
                <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-indigo-500 rounded-full translate-y-[50%] -translate-x-[20%] opacity-10"></div>

                <div className="z-10 flex items-center gap-3">
                    <div className="bg-white/10 backdrop-blur-xl rounded-[18px] p-2.5 border border-white/10 ring-1 ring-white/5 shadow-2xl">
                        <Cloud className="h-6 w-6 text-white" />
                    </div>
                    <h1 className="text-xl font-black text-white tracking-tight">UpStack</h1>
                </div>

                <div className="z-10 max-w-sm">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/30 border border-white/10 backdrop-blur-md mb-6">
                        <div className="h-1.5 w-1.5 rounded-full bg-blue-200 animate-pulse" />
                        <span className="text-[10px] font-black text-blue-100 uppercase tracking-widest">v2.0 Distributed Engine</span>
                    </div>
                    <h2 className="text-5xl font-black text-white leading-[1.1] tracking-tight">
                        The future of <br />
                        <span className="text-blue-200">distributed sync.</span>
                    </h2>
                    <p className="text-blue-100/70 mt-6 text-base font-semibold leading-relaxed">
                        Secure, content-addressable storage infrastructure with enterprise-grade consistency.
                    </p>
                </div>

                <div className="z-10 flex gap-8 text-white/40 uppercase text-[9px] font-black tracking-[0.25em]">
                    <span>High Availability</span>
                    <span>AES-256 Encryption</span>
                    <span>Delta Encoding</span>
                </div>
            </div>

            {/* Right Login Form */}
            <div className="w-full lg:w-[55%] flex items-center justify-center p-8 bg-white selection:bg-blue-50">
                <div className="w-full max-w-[380px] space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-1000">
                    <div className="space-y-2">
                        <h3 className="text-3xl font-black text-slate-900 tracking-tight">Welcome back</h3>
                        <p className="text-slate-400 font-bold text-sm tracking-tight capitalize">authorized credentials required to access nodes.</p>
                    </div>

                    <form className="space-y-8" onSubmit={handleSubmit}>
                        <div className="space-y-6">
                            <div className="space-y-2.5">
                                <label htmlFor="user-id" className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                                    Identity Identifier
                                </label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-300 group-focus-within:text-blue-600 transition-all">
                                        <Lock className="h-4.5 w-4.5" />
                                    </div>
                                    <Input
                                        id="user-id"
                                        name="userid"
                                        type="text"
                                        required
                                        className="pl-11 h-12 rounded-[16px] border-slate-200/60 bg-slate-50/50 focus:bg-white transition-all shadow-sm focus:shadow-blue-500/5 focus:ring-4 focus:ring-blue-500/5"
                                        placeholder="Enter UID..."
                                        value={userId}
                                        onChange={(e) => setUserId(e.target.value)}
                                    />
                                </div>
                                {error && <p className="text-[10px] font-black text-red-500 mt-2 px-1 uppercase tracking-tight">{error}</p>}
                            </div>

                            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100/50 flex gap-4 transition-all hover:bg-blue-50/30 hover:border-blue-100/50 group/card">
                                <div className="h-10 w-10 bg-white rounded-xl flex items-center justify-center shadow-sm shrink-0 border border-slate-100 group-hover/card:border-blue-100">
                                    <ShieldCheck className="h-5 w-5 text-blue-500" />
                                </div>
                                <div>
                                    <h4 className="text-xs font-black text-slate-800 leading-tight uppercase tracking-tight">Security Protocol Active</h4>
                                    <p className="text-slate-400 text-[10px] font-bold mt-1 leading-relaxed">System-wide audit logging is enabled for this session.</p>
                                </div>
                            </div>
                        </div>

                        <Button type="submit" className="w-full h-12 rounded-[16px] text-xs font-black uppercase tracking-widest shadow-2xl shadow-blue-500/20 group">
                            Verify & Enter
                            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                        </Button>
                    </form>

                    <div className="pt-10 border-t border-slate-100 flex justify-between items-center text-slate-300 font-black text-[9px] uppercase tracking-widest">
                        <p>© 2026 UpStack Core</p>
                        <div className="flex gap-6">
                            <a href="#" className="hover:text-blue-600 transition-colors">Privacy</a>
                            <a href="#" className="hover:text-blue-600 transition-colors">Nodes</a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
