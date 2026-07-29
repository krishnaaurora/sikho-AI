import React, { useState, useEffect } from "react";
import { Menu, X, User, Settings, Bell, LogOut, Wallet } from "lucide-react";
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

  const navLinks = [
    { name: "Courses", href: "/courses" },
    { name: "Features", href: "/#features" },
    { name: "AI Tutor", href: "/#ai-tutor" },
    { name: "Pricing", href: "/#pricing" },
    { name: "About", href: "/#about" },
  ];

  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';

  if (isAuthPage) {
    return null;
  }

  return (
    <>
      <nav
        className={`fixed z-50 transition-all duration-300 left-1/2 -translate-x-1/2 ${
          user
            ? "top-0 w-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800"
            : scrolled
            ? "top-4 w-[90%] max-w-5xl rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-lg"
            : "top-4 w-[90%] max-w-5xl rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className={`flex items-center justify-between ${user ? 'h-20' : 'h-16'}`}>
            {/* Logo - Present in both states */}
            <Link to="/" className="flex items-center gap-2">
              <img src="/logo.png" alt="Logo" className={`${user ? 'h-12' : 'h-10'} w-auto object-contain rounded-xl`} />
            </Link>

            {/* LOGGED IN NAVBAR LAYOUT */}
            {user ? (
              <>
                {/* Desktop View */}
                <div className="hidden md:flex items-center gap-6">
                  {user.role === 'admin' ? (
                    <>
                      <div className="flex flex-col items-end text-right">
                        <span className="text-base font-extrabold text-slate-900 dark:text-white leading-none">
                          SikhoAI Control Center
                        </span>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-medium">
                          Signed in as <span className="text-slate-700 dark:text-slate-300 font-semibold">{user.fullName}</span>
                        </span>
                      </div>
                      <Button
                        variant="outline"
                        onClick={() => window.dispatchEvent(new Event('refresh-admin-logs'))}
                        className="rounded-xl font-medium border-slate-200 dark:border-slate-800"
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
                      {/* Wallet Connection / Address */}
                      {activeAddress ? (
                        <Button
                          variant="outline"
                          className="border-primary/20 dark:border-primary/30 bg-primary/5 dark:bg-primary/10 text-primary dark:text-primary hover:bg-primary/10 dark:hover:bg-primary/20 flex items-center gap-2 rounded-xl transition-all"
                          onClick={() => setWalletModalOpen(true)}
                        >
                          <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                          <span className="font-mono text-xs">{ellipseAddress(activeAddress)}</span>
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          className="border-slate-200 dark:border-slate-800 bg-white/55 dark:bg-slate-950/50 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 rounded-xl transition-all"
                          onClick={() => setWalletModalOpen(true)}
                        >
                          <Wallet className="h-4 w-4" />
                          <span>Connect Wallet</span>
                        </Button>
                      )}

                      {/* Notification Icon */}
                      <button className="p-2 rounded-xl text-slate-600 dark:text-slate-400 hover:text-primary dark:hover:text-primary hover:bg-slate-100 dark:hover:bg-slate-800 transition-all relative">
                        <Bell className="h-5 w-5" />
                        <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-primary" />
                      </button>

                      {/* Settings Icon */}
                      <button className="p-2 rounded-xl text-slate-600 dark:text-slate-400 hover:text-primary dark:hover:text-primary hover:bg-slate-100 dark:hover:bg-slate-800 transition-all">
                        <Settings className="h-5 w-5" />
                      </button>

                      {/* Profile Icon / Link to Dashboard */}
                      <Button
                        variant="ghost"
                        className="p-2 rounded-xl text-slate-600 dark:text-slate-400 hover:text-primary dark:hover:text-primary hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2"
                        asChild
                      >
                        <Link to={dashboardPath}>
                          <User className="h-5 w-5" />
                          <span className="text-sm font-medium">{user.fullName.split(' ')[0]}</span>
                        </Link>
                      </Button>

                      {/* Logout Button */}
                      <Button 
                        variant="ghost" 
                        className="p-2 rounded-xl text-slate-600 dark:text-slate-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 flex items-center gap-2 transition-all"
                        onClick={handleLogout}
                      >
                        <LogOut className="h-5 w-5" />
                        <span>Logout</span>
                      </Button>
                    </>
                  )}
                </div>

                {/* Mobile Menu Toggle */}
                <button
                  className="md:hidden text-slate-600 dark:text-slate-300 p-2"
                  onClick={() => setIsOpen(!isOpen)}
                >
                  {isOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
              </>
            ) : (
              /* LANDING NAVBAR LAYOUT (LOGGED OUT) */
              <>
                <div className="hidden md:flex items-center gap-4">
                  <Button variant="ghost" asChild>
                    <Link to="/login">Log in</Link>
                  </Button>
                  <Button asChild>
                    <Link to="/register">Sign up</Link>
                  </Button>
                </div>

                <button
                  className="md:hidden text-slate-600 dark:text-slate-300 p-2"
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
              className="md:hidden bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 overflow-hidden"
            >
              <div className="px-4 py-4 space-y-3">
                {user ? (
                  /* Mobile Logged In Controls */
                  <div className="space-y-3 pt-2">
                    {user.role === 'admin' ? (
                      <>
                        <div className="flex flex-col items-start px-3 py-2 bg-slate-50 dark:bg-slate-850 rounded-xl">
                          <span className="font-extrabold text-sm text-slate-900 dark:text-white leading-none">
                            SikhoAI Control Center
                          </span>
                          <span className="text-xs text-slate-550 dark:text-slate-400 mt-1 font-medium">
                            Signed in as <span className="font-semibold text-slate-700 dark:text-slate-300">{user.fullName}</span>
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
                        <div className="flex items-center justify-between px-3 py-2 bg-slate-50 dark:bg-slate-850 rounded-xl">
                          <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                            <User className="h-5 w-5" />
                            <span className="font-semibold text-sm">{user.fullName}</span>
                          </div>
                          <span className="text-xs bg-primary/10 text-primary px-2.5 py-1 rounded-full uppercase font-bold">{user.role}</span>
                        </div>

                        {activeAddress ? (
                          <div className="flex items-center justify-between px-3 py-2 border border-primary/20 dark:border-primary/30 bg-primary/5 dark:bg-primary/10 text-primary dark:text-primary rounded-xl">
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

                        <div className="border-t border-slate-100 dark:border-slate-800 pt-2">
                          <Button
                            variant="ghost"
                            className="w-full justify-start text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-xl"
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
                  /* Mobile Landing Navigation */
                  <>
                    <div className="space-y-2">
                      <Button variant="ghost" className="w-full" asChild onClick={() => setIsOpen(false)}>
                        <Link to="/login">Log in</Link>
                      </Button>
                      <Button className="w-full" asChild onClick={() => setIsOpen(false)}>
                        <Link to="/register">Sign up</Link>
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
      
      {/* Global Connect Wallet dialog */}
      <ConnectWallet
        openModal={walletModalOpen}
        closeModal={() => setWalletModalOpen(false)}
      />
    </>
  );
};

export default Navbar;
