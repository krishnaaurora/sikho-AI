import React, { useState, useEffect } from "react";
import { Menu, X, User, Settings, Bell, LogOut, Wallet, Sparkles, Upload } from "lucide-react";
import { Button } from "./ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useWallet } from "@txnlab/use-wallet-react";
import { ellipseAddress } from "../utils/ellipseAddress";
import ConnectWallet from "./ConnectWallet";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [walletModalOpen, setWalletModalOpen] = useState(false);
  
  const { user, logout } = useAuth();
  const { activeAddress } = useWallet();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/');
    setIsOpen(false);
  };

  const dashboardPath = user?.role === 'admin' ? '/dashboard/admin' : '/dashboard/learner';

  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';

  if (isAuthPage) {
    return null;
  }

  return (
    <>
      <nav
        className={`fixed z-50 transition-all duration-355 left-1/2 -translate-x-1/2 ${
          user
            ? "top-0 w-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800"
            : scrolled
            ? "top-4 w-[90%] max-w-5xl rounded-full bg-white/90 backdrop-blur-md border border-slate-200 dark:border-slate-800 shadow-lg"
            : "top-4 w-[90%] max-w-5xl rounded-full bg-white/70 backdrop-blur-sm border border-slate-250/50 shadow-md"
        }`}
      >
        {/* Animated border line using Sparkle gradient effect */}
        <div className="absolute inset-x-0 bottom-0 h-[1.5px] bg-gradient-to-r from-transparent via-indigo-500 via-purple-500 via-orange-500 via-sky-400 to-transparent opacity-80" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className={`flex items-center justify-between ${user ? 'h-20' : 'h-16'}`}>
            
            {/* Brand Logo with dynamic sparkle badge */}
            <Link to="/" className="flex items-center gap-2 group">
              <div className="relative flex items-center gap-2">
                <img src="/logo.png" alt="Logo" className={`${user ? 'h-12' : 'h-10'} w-auto object-contain rounded-xl`} />
                <div className="absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <Sparkles className="h-3.5 w-3.5 text-indigo-550 animate-bounce" />
                </div>
              </div>
            </Link>

            {/* LOGGED IN NAVBAR LAYOUT */}
            {user ? (
              <>
                <div className="hidden md:flex items-center gap-6">
                  {user.role === 'admin' ? (
                    <>
                      <div className="flex flex-col items-end text-right">
                        <span className="text-base font-extrabold text-slate-900 dark:text-white leading-none">
                          SikhoAI Control Center
                        </span>
                        <span className="text-[11px] text-slate-500 mt-1 font-medium">
                          Signed in as <span className="text-slate-700 dark:text-slate-300 font-semibold">{user.fullName}</span>
                        </span>
                      </div>
                      <Button
                        variant="outline"
                        onClick={() => window.dispatchEvent(new Event('refresh-admin-logs'))}
                        className="rounded-xl font-medium border-slate-200"
                      >
                        Refresh Logs
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={handleLogout}
                        className="rounded-xl font-medium"
                      >
                        Logout Admin
                      </Button>
                    </>
                  ) : (
                    <>
                      {activeAddress ? (
                        <Button
                          variant="outline"
                          className="border-primary/20 bg-primary/5 text-primary hover:bg-primary/10 flex items-center gap-2 rounded-xl transition-all"
                          onClick={() => setWalletModalOpen(true)}
                        >
                          <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                          <span className="font-mono text-xs">{ellipseAddress(activeAddress)}</span>
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          className="border-slate-250 bg-white/55 hover:bg-slate-100 flex items-center gap-2 rounded-xl transition-all font-semibold"
                          onClick={() => setWalletModalOpen(true)}
                        >
                          <Wallet className="h-4 w-4" />
                          <span>Connect Wallet</span>
                        </Button>
                      )}


                      <button className="p-2 rounded-xl text-slate-600 hover:text-indigo-600 hover:bg-slate-100 transition-all relative">
                        <Bell className="h-5 w-5" />
                        <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-indigo-500 animate-pulse" />
                      </button>

                      <button className="p-2 rounded-xl text-slate-600 hover:text-indigo-600 hover:bg-slate-100 transition-all">
                        <Settings className="h-5 w-5" />
                      </button>

                      <Button
                        variant="ghost"
                        className="p-2 rounded-xl text-slate-600 hover:text-indigo-650 hover:bg-slate-100 flex items-center gap-2"
                        asChild
                      >
                        <Link to={dashboardPath}>
                          <User className="h-5 w-5" />
                          <span className="text-sm font-semibold">{user.fullName.split(' ')[0]}</span>
                        </Link>
                      </Button>

                      <Button 
                        variant="ghost" 
                        className="p-2 rounded-xl text-slate-650 hover:text-red-500 hover:bg-red-50 flex items-center gap-2 transition-all"
                        onClick={handleLogout}
                      >
                        <LogOut className="h-5 w-5" />
                        <span>Logout</span>
                      </Button>
                    </>
                  )}
                </div>

                <button
                  className="md:hidden text-slate-600 p-2"
                  onClick={() => setIsOpen(!isOpen)}
                >
                  {isOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
              </>
            ) : (
              /* LANDING NAVBAR LAYOUT (LOGGED OUT) */
              <>
                <div className="hidden md:flex items-center gap-8">
                  {[
                    { name: "How It Works", href: "#how-it-works", color: "hover:after:bg-orange-500" },
                    { name: "Learn", href: "#learning-experience", color: "hover:after:bg-blue-500" },
                    { name: "Labs", href: "#labs", color: "hover:after:bg-orange-500" },
                    { name: "Career", href: "#career", color: "hover:after:bg-blue-500" },
                    { name: "Research", href: "#research", color: "hover:after:bg-orange-500" }
                  ].map((link) => (
                    <a 
                      key={link.name} 
                      href={link.href} 
                      className={`relative text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors duration-200 after:absolute after:-bottom-1 after:left-0 after:h-[2px] after:w-0 hover:after:w-full after:transition-all after:duration-300 ${link.color}`}
                    >
                      {link.name}
                    </a>
                  ))}
                </div>

                <div className="hidden md:flex items-center gap-4">
                  <Button variant="ghost" asChild className="rounded-xl font-bold text-slate-700 hover:bg-slate-150">
                    <Link to="/login">Sign In</Link>
                  </Button>
                  
                  {/* Premium Sparkle visual button */}
                  <Button asChild className="relative rounded-xl font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-500/20 overflow-hidden group">
                    <Link to="/register" className="flex items-center gap-1.5 text-white">
                      <span className="text-white">Get Started</span>
                      <Sparkles className="h-3.5 w-3.5 text-orange-400 group-hover:animate-spin" />
                    </Link>
                  </Button>
                </div>

                <button
                  className="md:hidden text-slate-600 p-2"
                  onClick={() => setIsOpen(!isOpen)}
                >
                  {isOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="md:hidden bg-white/95 backdrop-blur-md border-b border-slate-200 overflow-hidden"
            >
              <div className="px-4 py-4 space-y-3">
                {user ? (
                  <div className="space-y-3 pt-2">
                    {user.role === 'admin' ? (
                      <>
                        <div className="flex flex-col items-start px-3 py-2 bg-slate-50 rounded-xl">
                          <span className="font-extrabold text-sm text-slate-900 leading-none">
                            SikhoAI Control Center
                          </span>
                          <span className="text-xs text-slate-500 mt-1 font-medium">
                            Signed in as <span className="font-semibold text-slate-700">{user.fullName}</span>
                          </span>
                        </div>
                        <Button
                          variant="outline"
                          className="w-full flex items-center justify-center gap-2 rounded-xl font-medium"
                          onClick={() => {
                            window.dispatchEvent(new Event('refresh-admin-logs'));
                            setIsOpen(false);
                          }}
                        >
                          Refresh Logs
                        </Button>
                        <Button
                          variant="destructive"
                          className="w-full flex items-center justify-center gap-2 rounded-xl font-medium"
                          onClick={handleLogout}
                        >
                          Logout Admin
                        </Button>
                      </>
                    ) : (
                      <>
                        <div className="flex items-center justify-between px-3 py-2 bg-slate-50 rounded-xl">
                          <div className="flex items-center gap-2 text-slate-700">
                            <User className="h-5 w-5" />
                            <span className="font-semibold text-sm">{user.fullName}</span>
                          </div>
                          <span className="text-xs bg-primary/10 text-primary px-2.5 py-1 rounded-full uppercase font-bold">{user.role}</span>
                        </div>

                        {activeAddress ? (
                          <div className="flex items-center justify-between px-3 py-2 border border-primary/20 bg-primary/5 text-primary rounded-xl">
                            <span className="text-sm font-semibold">Wallet:</span>
                            <span className="font-mono text-sm">{ellipseAddress(activeAddress)}</span>
                          </div>
                        ) : (
                          <Button
                            variant="outline"
                            className="w-full flex items-center justify-center gap-2 rounded-xl"
                            onClick={() => { setWalletModalOpen(true); setIsOpen(false); }}
                          >
                            <Wallet className="h-4 w-4" />
                            <span>Connect Wallet</span>
                          </Button>
                        )}

                        <Button variant="ghost" className="w-full justify-start rounded-xl" asChild onClick={() => setIsOpen(false)}>
                          <Link to={dashboardPath}>Dashboard</Link>
                        </Button>
                        
                        <Button variant="ghost" className="w-full justify-start rounded-xl" onClick={() => setIsOpen(false)}>
                          <div className="flex items-center gap-2">
                            <Bell className="h-4 w-4" />
                            <span>Notifications</span>
                          </div>
                        </Button>

                        <Button variant="ghost" className="w-full justify-start rounded-xl" onClick={() => setIsOpen(false)}>
                          <div className="flex items-center gap-2">
                            <Settings className="h-4 w-4" />
                            <span>Settings</span>
                          </div>
                        </Button>

                        <div className="border-t border-slate-100 pt-2">
                          <Button
                            variant="ghost"
                            className="w-full justify-start text-red-650 hover:bg-red-50 rounded-xl"
                            onClick={handleLogout}
                          >
                            <div className="flex items-center gap-2">
                              <LogOut className="h-4 w-4" />
                              <span>Log Out</span>
                            </div>
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                  <>
                    <div className="space-y-2 flex flex-col pt-2 pb-4">
                      <a href="#how-it-works" onClick={() => setIsOpen(false)} className="px-3 py-2 text-sm font-semibold text-slate-650 hover:text-indigo-650 transition-all">How It Works</a>
                      <a href="#learning-experience" onClick={() => setIsOpen(false)} className="px-3 py-2 text-sm font-semibold text-slate-650 hover:text-indigo-650 transition-all">Learn</a>
                      <a href="#labs" onClick={() => setIsOpen(false)} className="px-3 py-2 text-sm font-semibold text-slate-650 hover:text-indigo-650 transition-all">Labs</a>
                      <a href="#career" onClick={() => setIsOpen(false)} className="px-3 py-2 text-sm font-semibold text-slate-650 hover:text-indigo-650 transition-all">Career</a>
                      <a href="#research" onClick={() => setIsOpen(false)} className="px-3 py-2 text-sm font-semibold text-slate-650 hover:text-indigo-650 transition-all">Research</a>
                      <div className="border-t border-slate-200 pt-2 flex flex-col gap-2">
                        <Button variant="ghost" className="w-full rounded-xl font-bold" asChild onClick={() => setIsOpen(false)}>
                          <Link to="/login">Sign In</Link>
                        </Button>
                        <Button className="w-full rounded-xl font-bold bg-indigo-650 text-white" asChild onClick={() => setIsOpen(false)}>
                          <Link to="/register" className="flex items-center justify-center gap-1.5">
                            <span>Get Started</span>
                            <Sparkles className="h-3.5 w-3.5 text-orange-400" />
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
      
      <ConnectWallet
        openModal={walletModalOpen}
        closeModal={() => setWalletModalOpen(false)}
      />
    </>
  );
};

export default Navbar;
