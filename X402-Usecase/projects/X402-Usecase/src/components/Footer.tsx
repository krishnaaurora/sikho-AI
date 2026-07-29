import { Globe, Terminal, MessageSquare, Code2 } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-455 pt-20 pb-12 px-4 border-t border-slate-200 dark:border-slate-850">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-12 mb-16">
          <div className="col-span-2 space-y-6">
            <div className="flex items-center gap-2">
              <img src="/logo.png" alt="Logo" className="h-12 w-auto object-contain rounded-xl" />
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm leading-relaxed">
              AI-guided custom learning platform. Unlock individual knowledge increments with secure, instant blockchain micropayments.
            </p>
            <div className="flex gap-3">
              <a href="#" className="w-8 h-8 rounded-lg border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-500 hover:text-primary hover:border-primary/40 dark:hover:border-primary/40 transition-colors" title="Github">
                <Terminal className="h-4 w-4" />
              </a>
              <a href="#" className="w-8 h-8 rounded-lg border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-500 hover:text-primary hover:border-primary/40 dark:hover:border-primary/40 transition-colors" title="Twitter">
                <Globe className="h-4 w-4" />
              </a>
              <a href="#" className="w-8 h-8 rounded-lg border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-500 hover:text-primary hover:border-primary/40 dark:hover:border-primary/40 transition-colors" title="Slack">
                <MessageSquare className="h-4 w-4" />
              </a>
              <a href="#" className="w-8 h-8 rounded-lg border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-500 hover:text-primary hover:border-primary/40 dark:hover:border-primary/40 transition-colors" title="Website">
                <Code2 className="h-4 w-4" />
              </a>
            </div>
          </div>

          <div>
            <h4 className="font-bold text-xs text-slate-900 dark:text-white uppercase tracking-wider mb-6">Platform</h4>
            <ul className="space-y-3.5 text-xs">
              <li><a href="#" className="hover:text-primary transition-colors">About App</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Course Catalog</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Key Features</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Developer API</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-xs text-slate-900 dark:text-white uppercase tracking-wider mb-6">Support</h4>
            <ul className="space-y-3.5 text-xs">
              <li><a href="#" className="hover:text-primary transition-colors">Help Center</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Contact Support</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Terms of Service</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-xs text-slate-900 dark:text-white uppercase tracking-wider mb-6">Company</h4>
            <ul className="space-y-3.5 text-xs">
              <li><a href="#" className="hover:text-primary transition-colors">Our Blog</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Careers</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Partnerships</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Press Kit</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-200 dark:border-slate-850 pt-8 flex flex-col md:flex-row justify-between items-center text-xs text-slate-400 gap-4">
          <p>&copy; {new Date().getFullYear()} SikhoAI. All rights reserved.</p>
          <div className="flex gap-4">
            <a href="#" className="hover:underline">Privacy Policy</a>
            <a href="#" className="hover:underline">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
