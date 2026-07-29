import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Mail, Lock, ArrowRight, Sparkles } from 'lucide-react';
import authSidebarImg from '../assets/auth_sidebar.png';

const LoginPage: React.FC = () => {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loginData, setLoginData] = useState({ email: '', password: '' });

  useEffect(() => {
    if (user) {
      if (user.role === 'admin') {
        navigate('/dashboard/admin');
      } else {
        navigate('/dashboard/learner');
      }
    }
  }, [user, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      await login(loginData.email, loginData.password);
      setSuccess('Login successful!');
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex">
      {/* Left side: Premium Split Graphic (Hidden on mobile) */}
      <div className="hidden lg:relative lg:flex lg:w-1/2 bg-slate-950 overflow-hidden">
        {/* Modern Vector Grid & Glow Illustration */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_80%,transparent_100%)] opacity-70" />
        
        {/* Glow Spheres */}
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[100px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-accent/10 rounded-full blur-[100px]" />
        
        {/* Diagonal dot decoration */}
        <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:16px_16px]" />

        {/* Top-Left Logo */}
        <Link to="/" className="absolute top-8 left-8 flex items-center gap-2.5 z-20 group">
          <img src="/logo.png" alt="Logo" className="h-14 w-auto object-contain rounded-xl group-hover:scale-105 transition-transform" />
        </Link>

        {/* Bottom Text Overlay */}
        <div className="absolute bottom-16 left-12 right-12 z-20 text-white">
          <span className="px-3 py-1 bg-primary/20 text-primary border border-primary/30 text-xs font-semibold rounded-full uppercase tracking-wider">
            Web3 Educational Platform
          </span>
          <h3 className="text-4xl font-extrabold tracking-tight mt-4 leading-tight">
            AI-Generated & Blockchain-Secured Credentials
          </h3>
          <p className="mt-4 text-base text-slate-350 max-w-lg leading-relaxed">
            Construct specialized lessons dynamically tailored by artificial intelligence and secure your academic achievements natively on the Algorand blockchain.
          </p>
        </div>
      </div>

      {/* Right side: Login form */}
      <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-20 xl:px-24 bg-white dark:bg-slate-900/40 backdrop-blur-md relative">
        
        {/* Mobile top logo (Hidden on desktop) */}
        <div className="lg:hidden absolute top-8 left-6">
          <Link to="/" className="flex items-center gap-2">
            <img src="/logo.png" alt="Logo" className="h-10 w-auto object-contain rounded-xl" />
          </Link>
        </div>
        <div className="mx-auto w-full max-w-sm lg:w-96">
          <div>
            <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Welcome back
            </h2>
          </div>

          <div className="mt-8">
            <div className="space-y-6">
              {error && (
                <div className="p-3.5 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 rounded-xl text-sm font-medium flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-red-500 flex-shrink-0" />
                  {error}
                </div>
              )}

              {success && (
                <div className="p-3.5 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 text-green-600 dark:text-green-400 rounded-xl text-sm font-medium flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-green-500 flex-shrink-0" />
                  {success}
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Email Address
                  </label>
                  <div className="relative rounded-xl shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-slate-400" />
                    </div>
                    <input
                      type="email"
                      required
                      value={loginData.email}
                      onChange={(e) =>
                        setLoginData({ ...loginData, email: e.target.value })
                      }
                      className="block w-full pl-10 pr-4 py-3 border border-slate-200 dark:border-slate-800 rounded-xl bg-white/50 dark:bg-slate-950/50 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                      placeholder="you@example.com"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Password
                  </label>
                  <div className="relative rounded-xl shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-slate-400" />
                    </div>
                    <input
                      type="password"
                      required
                      value={loginData.password}
                      onChange={(e) =>
                        setLoginData({ ...loginData, password: e.target.value })
                      }
                      className="block w-full pl-10 pr-4 py-3 border border-slate-200 dark:border-slate-800 rounded-xl bg-white/50 dark:bg-slate-950/50 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <Button
                    type="submit"
                    className="w-full py-3.5 rounded-xl shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all font-semibold flex items-center justify-center gap-2"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      'Logging in...'
                    ) : (
                      <>
                        Log In <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </div>
            
            <div className="mt-12 pt-6 border-t border-slate-200 dark:border-slate-800 text-center">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                New to the platform?{' '}
                <Link
                  to="/register"
                  className="font-semibold text-primary dark:text-primary hover:text-primary/80 transition-colors"
                >
                  Create a free account
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
