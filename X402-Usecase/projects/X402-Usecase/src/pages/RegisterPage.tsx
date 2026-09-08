import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Eye, EyeOff } from 'lucide-react';
import { motion } from 'framer-motion';

const RegisterPage: React.FC = () => {
  const { register, user } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [registerData, setRegisterData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    country: '',
    termsAccepted: false,
  });

  const countries = [
    'India', 'United States', 'United Kingdom', 'Canada', 'Australia',
    'Singapore', 'Germany', 'United Arab Emirates',
  ];

  useEffect(() => {
    if (user) {
      if (user.role === 'admin') {
        navigate('/dashboard/admin', { replace: true });
      } else {
        navigate('/dashboard/learner', { replace: true });
      }
    }
  }, [user, navigate]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (registerData.password !== registerData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (!registerData.termsAccepted) {
      setError('You must agree to the Terms & Privacy Policy');
      return;
    }
    if (registerData.password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }
    if (!/[a-z]/.test(registerData.password)) {
      setError('Password must contain at least one lowercase letter');
      return;
    }
    if (!/[A-Z]/.test(registerData.password)) {
      setError('Password must contain at least one uppercase letter');
      return;
    }
    if (!/[0-9]/.test(registerData.password)) {
      setError('Password must contain at least one number');
      return;
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(registerData.password)) {
      setError('Password must contain at least one special character');
      return;
    }

    setIsLoading(true);
    try {
      await register({
        fullName: registerData.fullName,
        email: registerData.email,
        password: registerData.password,
        confirmPassword: registerData.confirmPassword,
        country: registerData.country,
      });
      navigate('/dashboard/learner', { replace: true });
    } catch (err: any) {
      let msg = err.message || 'Registration failed';
      try {
        const parsed = JSON.parse(msg);
        if (Array.isArray(parsed) && parsed[0]?.message) {
          msg = parsed[0].message;
        }
      } catch (_) {}
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex font-sans">

      {/* LEFT PANEL */}
      <div className="hidden lg:relative lg:flex lg:w-1/2 bg-slate-950 overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_80%,transparent_100%)] opacity-70" />
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[100px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-accent/10 rounded-full blur-[100px]" />
        <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:16px_16px]" />
        <Link to="/" className="absolute top-8 left-8 flex items-center gap-2.5 z-20 group">
          <img src="/logo.png" alt="Sikho AI" className="h-14 w-auto object-contain rounded-xl group-hover:scale-105 transition-transform" />
        </Link>
        <div className="absolute bottom-16 left-12 right-12 z-20 text-white">
          <span className="px-3 py-1 bg-primary/20 text-primary border border-primary/30 text-xs font-semibold rounded-full uppercase tracking-wider">
            AI-Powered Career Platform
          </span>
          <h3 className="text-4xl font-extrabold tracking-tight mt-4 leading-tight">
            AI-Generated &amp; Blockchain-Secured Credentials
          </h3>
          <p className="mt-4 text-base text-slate-400 max-w-lg leading-relaxed">
            Build your career path with AI-powered learning, real-world practice, and verifiable credentials secured on the Algorand blockchain.
          </p>
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-20 xl:px-24 bg-white dark:bg-slate-900/40 backdrop-blur-md relative overflow-y-auto">

        <div className="lg:hidden absolute top-8 left-6">
          <Link to="/" className="flex items-center gap-2">
            <img src="/logo.png" alt="Sikho AI" className="h-10 w-auto object-contain rounded-xl" />
          </Link>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md mx-auto"
        >
          <div className="text-center mb-6">
            <p className="text-slate-500 text-sm font-semibold">Create your account to start your career journey</p>
          </div>

          {error && (
            <div className="p-3 mb-4 bg-red-50 border border-red-200 text-red-600 rounded-xl text-xs font-bold flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-red-500 flex-shrink-0 animate-pulse" />
              {error}
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Full Name</label>
              <input
                type="text"
                required
                value={registerData.fullName}
                onChange={e => setRegisterData({ ...registerData, fullName: e.target.value })}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl bg-slate-50/50 text-slate-900 placeholder-slate-400 text-sm font-semibold outline-none focus:border-indigo-500"
                placeholder="Jai Krishna"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Email Address</label>
              <input
                type="email"
                required
                value={registerData.email}
                onChange={e => setRegisterData({ ...registerData, email: e.target.value })}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl bg-slate-50/50 text-slate-900 placeholder-slate-400 text-sm font-semibold outline-none focus:border-indigo-500"
                placeholder="jai@example.com"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={registerData.password}
                  onChange={e => setRegisterData({ ...registerData, password: e.target.value })}
                  className="w-full px-4 py-2.5 pr-10 border border-slate-200 rounded-xl bg-slate-50/50 text-slate-900 placeholder-slate-400 text-sm font-semibold outline-none focus:border-indigo-500"
                  placeholder="Create a password"
                />
                <button type="button" onClick={() => setShowPassword(v => !v)} className="absolute inset-y-0 right-3 flex items-center text-slate-400 hover:text-slate-600">
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Confirm Password</label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  value={registerData.confirmPassword}
                  onChange={e => setRegisterData({ ...registerData, confirmPassword: e.target.value })}
                  className="w-full px-4 py-2.5 pr-10 border border-slate-200 rounded-xl bg-slate-50/50 text-slate-900 placeholder-slate-400 text-sm font-semibold outline-none focus:border-indigo-500"
                  placeholder="Confirm your password"
                />
                <button type="button" onClick={() => setShowConfirmPassword(v => !v)} className="absolute inset-y-0 right-3 flex items-center text-slate-400 hover:text-slate-600">
                  {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Country</label>
              <select
                required
                value={registerData.country}
                onChange={e => setRegisterData({ ...registerData, country: e.target.value })}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl bg-slate-50/50 text-slate-900 text-sm font-semibold outline-none focus:border-indigo-500"
              >
                <option value="" disabled>Select your country</option>
                {countries.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div className="flex items-center gap-2 py-1">
              <input
                type="checkbox"
                id="terms"
                checked={registerData.termsAccepted}
                onChange={e => setRegisterData({ ...registerData, termsAccepted: e.target.checked })}
                className="rounded border-slate-300 focus:ring-indigo-500 h-4 w-4"
              />
              <label htmlFor="terms" className="text-xs text-slate-500 font-semibold leading-none">
                I agree to the{' '}
                <span className="text-indigo-600 font-bold hover:underline cursor-pointer">Terms &amp; Privacy Policy</span>
              </label>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl shadow-md transition-colors"
            >
              {isLoading ? 'Creating Account...' : 'Create Account ?'}
            </Button>
          </form>

          <div className="mt-6 text-center text-xs font-bold text-slate-400">
            Already have an account?{' '}
            <Link to="/login" className="text-indigo-600 hover:underline">Login</Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default RegisterPage;
