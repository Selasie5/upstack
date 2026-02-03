import { useState } from 'react';
import { Button } from './components/ui/button';
import { Input } from './components/ui/input';
import { Cloud, Lock, ArrowRight, ShieldCheck, Mail, User, Loader2 } from 'lucide-react';
import { auth } from './services/api';
import { toast } from 'sonner';

export function LoginPage({ onLogin }) {
    const [mode, setMode] = useState('login'); // 'login' or 'register'
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (mode === 'login') {
                const data = await auth.login(email, password);
                toast.success(`Welcome back, ${data.user.name}`);
                onLogin(data.user);
            } else {
                const data = await auth.register(email, password, name);
                toast.success(`Account created! Welcome, ${data.user.name}`);
                onLogin(data.user);
            }
        } catch (err) {
            toast.error(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex h-screen w-full font-sans bg-white overflow-hidden">
            {/* Left Decorative Panel */}
            <div className="hidden lg:flex w-[45%] bg-green-600 p-12 flex-col justify-between relative overflow-hidden">
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-green-500 rounded-full -translate-y-[40%] translate-x-[30%] opacity-20 animate-pulse"></div>
                <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-indigo-500 rounded-full translate-y-[50%] -translate-x-[20%] opacity-10"></div>

                <div className="z-10 flex items-center gap-3">
                    <div className="bg-white/10 backdrop-blur-xl rounded-[18px] p-2.5 border border-white/10 ring-1 ring-white/5 shadow-2xl">
                        <Cloud className="h-6 w-6 text-white" />
                    </div>
                    <h1 className="text-xl font-black text-white tracking-tight">UpStack</h1>
                </div>

                <div className="z-10 max-w-sm">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/30 border border-white/10 backdrop-blur-md mb-6">
                        <div className="h-1.5 w-1.5 rounded-full bg-green-200 animate-pulse" />
                        <span className="text-[10px] font-black text-green-100 uppercase tracking-widest">v2.1 Real-Auth Engine</span>
                    </div>
                    <h2 className="text-5xl font-black text-white leading-[1.1] tracking-tight">
                        {mode === 'login' ? 'Continue your' : 'Start your'} <br />
                        <span className="text-green-200">distributed journey.</span>
                    </h2>
                    <p className="text-green-100/70 mt-6 text-base font-semibold leading-relaxed">
                        Secure, production-grade authentication with decentralized file synchronization.
                    </p>
                </div>

                <div className="z-10 flex gap-8 text-white/40 uppercase text-[9px] font-black tracking-[0.25em]">
                    <span>JWT Security</span>
                    <span>MongoDB Persistence</span>
                    <span>SMTP Integration</span>
                </div>
            </div>

            {/* Right Login Form */}
            <div className="w-full lg:w-[55%] flex items-center justify-center p-8 bg-white selection:bg-green-50">
                <div className="w-full max-w-[380px] space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
                    <div className="space-y-3">
                        <h3 className="text-4xl font-black text-slate-900 tracking-tight leading-none">
                            {mode === 'login' ? 'Sign In' : 'Join the Node'}
                        </h3>
                        <p className="text-slate-400 font-bold text-sm tracking-tight capitalize">
                            {mode === 'login'
                                ? 'authorized credentials required to access nodes.'
                                : 'Initialize your identity for global synchronization.'}
                        </p>
                    </div>

                    <form className="space-y-6" onSubmit={handleSubmit}>
                        <div className="space-y-5">
                            {mode === 'register' && (
                                <div className="space-y-2.5">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-300 group-focus-within:text-green-600 transition-all">
                                            <User className="h-4.5 w-4.5" />
                                        </div>
                                        <Input
                                            type="text"
                                            required
                                            className="pl-11 h-12 rounded-[16px] border-slate-200"
                                            placeholder="Enter your name..."
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                        />
                                    </div>
                                </div>
                            )}

                            <div className="space-y-2.5">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-300 group-focus-within:text-green-600 transition-all">
                                        <Mail className="h-4.5 w-4.5" />
                                    </div>
                                    <Input
                                        type="email"
                                        required
                                        className="pl-11 h-12 rounded-[16px] border-slate-200"
                                        placeholder="user@example.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2.5">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Security Keyphrase</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-300 group-focus-within:text-green-600 transition-all">
                                        <Lock className="h-4.5 w-4.5" />
                                    </div>
                                    <Input
                                        type="password"
                                        required
                                        className="pl-11 h-12 rounded-[16px] border-slate-200"
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>

                        <Button
                            disabled={loading}
                            type="submit"
                            className="w-full h-12 rounded-[16px] text-xs font-black uppercase tracking-widest shadow-2xl shadow-green-500/20 group bg-green-600 hover:bg-green-700"
                        >
                            {loading ? <Loader2 className="animate-spin h-4 w-4" /> : (
                                <>
                                    {mode === 'login' ? 'Verify & Enter' : 'Initialize Account'}
                                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                                </>
                            )}
                        </Button>
                    </form>

                    <div className="text-center">
                        <button
                            type="button"
                            onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
                            className="text-[11px] font-black text-green-600 uppercase tracking-widest hover:text-green-700 transition-colors"
                        >
                            {mode === 'login' ? 'Create New Node Identity' : 'Already have credentials? Sign in'}
                        </button>
                    </div>

                    <div className="pt-8 border-t border-slate-100 flex justify-between items-center text-slate-300 font-black text-[9px] uppercase tracking-widest">
                        <p>© 2026 UpStack Core</p>
                        <div className="flex gap-4">
                            <ShieldCheck className="h-3.5 w-3.5" />
                            <span>SSL Encryption Active</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
