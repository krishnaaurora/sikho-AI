import React from "react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Zap, Play, CheckCircle, Brain, Terminal, CreditCard, Sparkles, MessageSquare, BarChart2 } from "lucide-react";
import { Link } from "react-router-dom";
import Dither from "@/components/ui/Dither/Dither";

const Hero = () => {
  return (
    <section className="relative pt-20 pb-16 sm:pt-28 sm:pb-20 lg:pt-36 lg:pb-28 px-4 overflow-hidden bg-gradient-to-b from-white via-slate-50 to-white dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      {/* Floating Dither Background */}
      <div className="absolute inset-0 z-0 opacity-40 dark:opacity-20 pointer-events-none">
        <Dither
          waveColor={[0.39, 0.44, 0.98]}
          disableAnimation={false}
          enableMouseInteraction={true}
          mouseRadius={0.3}
          colorNum={4}
          waveAmplitude={0.2}
          waveFrequency={2.5}
          waveSpeed={0.03}
        />
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="grid lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* Hero Content (left) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-5 text-left z-10"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-indigo-100/90 dark:bg-indigo-950/80 border border-indigo-350 dark:border-indigo-850 rounded-full mb-6 shadow-sm">
              <Zap className="h-4 w-4 text-indigo-700 dark:text-indigo-400" />
              <span className="text-xs font-bold text-indigo-950 dark:text-indigo-200 uppercase tracking-wider">
                Powered by AI & Algorand x402
              </span>
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold leading-[1.1] mb-6 tracking-tight text-slate-950 dark:text-white">
              Learn Anything.<br />
              <span className="bg-gradient-to-r from-indigo-900 via-indigo-700 to-purple-800 dark:from-indigo-350 dark:via-indigo-200 dark:to-purple-300 bg-clip-text text-transparent drop-shadow-sm">
                Pay Only For What You Learn.
              </span>
            </h1>
            
            <p className="text-lg text-slate-850 dark:text-slate-200 font-medium mb-8 max-w-lg leading-relaxed drop-shadow-sm">
              Unlock bite-sized knowledge increments instantly via secure, direct blockchain micropayments. Get guided by a personal AI tutor who details topics in real-time.
            </p>
            
            <div className="flex flex-wrap gap-4">
              <Button size="lg" className="rounded-xl px-8 shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all font-semibold flex items-center gap-2" asChild>
                <Link to="/courses">
                  Explore Courses <Play className="h-4 w-4 fill-white" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="rounded-xl px-8 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all" asChild>
                <Link to="/register">
                  Get Started
                </Link>
              </Button>
            </div>
          </motion.div>

          {/* SaaS Interface Mockup Showcase (right) */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="lg:col-span-7 relative w-full"
          >
            {/* Background glowing effects */}
            <div className="absolute -top-16 -right-16 w-80 h-80 bg-primary/10 rounded-full blur-[100px]" />
            <div className="absolute -bottom-16 -left-16 w-80 h-80 bg-accent/10 rounded-full blur-[100px]" />
            
            {/* The main browser / application window mock */}
            <div className="relative rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-slate-950/70 backdrop-blur-xl shadow-2xl overflow-hidden">
              
              {/* Window Title Bar */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200/80 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/50">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-rose-500/80 block" />
                  <span className="w-3 h-3 rounded-full bg-amber-500/80 block" />
                  <span className="w-3 h-3 rounded-full bg-emerald-500/80 block" />
                </div>
                <div className="text-xs font-medium text-slate-400 dark:text-slate-500 bg-white dark:bg-slate-950 px-4 py-1 rounded-md border border-slate-200/60 dark:border-slate-850">
                  x402-learn-workspace.app
                </div>
                <div className="w-12" />
              </div>

              {/* Workspace Layout mock */}
              <div className="grid grid-cols-1 md:grid-cols-12 min-h-[350px] md:h-[420px] text-xs">
                
                {/* Left Side: Course Modules outline */}
                <div className="hidden md:block md:col-span-3 border-r border-slate-200/60 dark:border-slate-800/60 p-3 bg-slate-50/30 dark:bg-slate-950/30">
                  <div className="font-semibold text-slate-800 dark:text-slate-200 mb-3 flex items-center gap-1">
                    <Terminal className="h-3 w-3 text-primary" /> Python & Algorand
                  </div>
                  <div className="space-y-1">
                    <div className="p-2 rounded-lg bg-primary/10 text-primary font-medium flex items-center justify-between">
                      <span>1. Intro to smart contracts</span>
                      <CheckCircle className="h-3 w-3 text-primary" />
                    </div>
                    <div className="p-2 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors flex items-center justify-between">
                      <span>2. x402 Protocols</span>
                      <Zap className="h-3 w-3 text-amber-500" />
                    </div>
                    <div className="p-2 rounded-lg text-slate-450 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors flex items-center justify-between opacity-70">
                      <span>3. Building custom tokens</span>
                      <CreditCard className="h-3 w-3" />
                    </div>
                  </div>
                </div>

                {/* Center Pane: Interactive Course Details / Payment Screen */}
                <div className="col-span-1 md:col-span-6 p-4 flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-bold text-accent tracking-wider bg-accent/10 px-2 py-0.5 rounded-full">Module 2</span>
                      <span className="text-[10px] text-slate-400 font-mono">0.05 ALGO</span>
                    </div>
                    
                    <h3 className="text-sm font-bold text-slate-850 dark:text-white">Micro-transactions for Knowledge Increments</h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal">
                      Algorand's x402 standard enables direct pay-as-you-learn architecture, completely bypassing expensive course bundles.
                    </p>
                    
                    {/* Simulated code snippet / interactive area */}
                    <div className="bg-slate-950 rounded-lg p-2.5 font-mono text-[9px] text-emerald-450 border border-slate-850 leading-relaxed shadow-inner">
                      <div className="text-slate-500">// Transaction approved natively</div>
                      <div>const tx = await client.x402.unlockChapter({`{`}</div>
                      <div className="pl-3 text-indigo-400">chapterId: "ch_2",</div>
                      <div className="pl-3 text-indigo-400">amount: 0.05 * 10**6</div>
                      <div>{`}`});</div>
                    </div>
                  </div>

                  {/* Payment feedback card */}
                  <div className="bg-primary/5 dark:bg-primary/10 border border-primary/20 rounded-xl p-3 flex items-center justify-between mt-3">
                    <div className="flex items-center gap-2">
                      <div className="h-7 w-7 bg-primary/20 text-primary rounded-lg flex items-center justify-center">
                        <CreditCard className="h-3.5 w-3.5" />
                      </div>
                      <div>
                        <div className="font-bold text-slate-800 dark:text-slate-200">Unlocked Chapter</div>
                        <div className="text-[10px] text-slate-400 font-mono">Tx: #x402...9a12</div>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-1 rounded-full uppercase">PAID</span>
                  </div>
                </div>

                {/* Right Side: AI Tutor chat preview */}
                <div className="hidden md:flex md:col-span-3 border-l border-slate-200/60 dark:border-slate-800/60 p-3 bg-slate-50/20 dark:bg-slate-950/20 flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex items-center gap-1 font-bold text-slate-800 dark:text-slate-200">
                      <Brain className="h-3.5 w-3.5 text-accent animate-pulse" />
                      <span>SikhoAI Tutor</span>
                    </div>
                    
                    <div className="space-y-2">
                      {/* Message 1 */}
                      <div className="bg-slate-100 dark:bg-slate-900 p-2 rounded-lg text-slate-600 dark:text-slate-400 text-[10px] leading-tight">
                        How does x402 save gas fees on Algorand?
                      </div>
                      
                      {/* Message 2 */}
                      <div className="bg-primary/10 dark:bg-primary/25 border border-primary/20 p-2 rounded-lg text-slate-800 dark:text-slate-200 text-[10px] leading-normal">
                        <Sparkles className="h-2.5 w-2.5 text-primary inline mr-1" />
                        By using lightweight asset mappings that process payments directly alongside content state updates.
                      </div>
                    </div>
                  </div>
                  
                  {/* Fake input bar */}
                  <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-2 py-1">
                    <span className="text-slate-400">Ask tutor...</span>
                    <MessageSquare className="h-3 w-3 text-slate-400 ml-auto" />
                  </div>
                </div>

              </div>
              
              {/* Overlay Mock stats / Micro analytics widget */}
              <div className="hidden sm:flex absolute bottom-4 right-4 bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-850 p-2.5 rounded-xl items-center gap-3 shadow-lg max-w-[150px]">
                <BarChart2 className="h-6 w-6 text-accent" />
                <div>
                  <div className="font-bold text-[10px] text-slate-850 dark:text-white">Spent Analytics</div>
                  <div className="text-[9px] text-slate-400">0.25 ALGO Total</div>
                </div>
              </div>

            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
};

export default Hero;
