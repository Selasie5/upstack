import { useState } from 'react';
import { Button } from './components/ui/button';
import { Input } from './components/ui/input';
import { Cloud, Lock } from 'lucide-react';

export function LoginPage({ onLogin }) {
    const [userId, setUserId] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!userId.trim()) {
            setError('Please enter a User ID');
            return;
        }
        onLogin(userId);
    };

    return (
        <div className="flex h-screen w-full items-center justify-center bg-gray-50">
            <div className="w-full max-w-md space-y-8 rounded-2xl bg-white p-10 shadow-xl">
                <div className="text-center">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
                        <Cloud className="h-8 w-8 text-blue-600" />
                    </div>
                    <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
                        Welcome to UpStack
                    </h2>
                    <p className="mt-2 text-sm text-gray-600">
                        Secure Distributed Cloud Storage
                    </p>
                </div>

                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    <div className="rounded-md shadow-sm space-y-4">
                        <div>
                            <label htmlFor="user-id" className="sr-only">
                                User ID
                            </label>
                            <div className="relative">
                                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                    <Lock className="h-5 w-5 text-gray-400" />
                                </div>
                                <Input
                                    id="user-id"
                                    name="userid"
                                    type="text"
                                    required
                                    className="pl-10 h-12"
                                    placeholder="Enter your User ID to continue"
                                    value={userId}
                                    onChange={(e) => setUserId(e.target.value)}
                                />
                            </div>
                        </div>
                        {error && <p className="text-sm text-red-600">{error}</p>}
                    </div>

                    <div>
                        <Button type="submit" className="w-full h-12 text-lg">
                            Sign in
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
